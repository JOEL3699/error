// supabaseClient.js - MIT SESSION-REFRESH FIX
import { createClient } from '@supabase/supabase-js';

// Konfiguration für Supabase mit Umgebungsvariablen
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Mock-Flag zur Erkennung, ob wir im Fallback-Modus laufen
const isUsingMock = !supabaseUrl || !supabaseAnonKey;

// 🔧 ERWEITERTE SUPABASE-KONFIGURATION mit Auto-Refresh
const supabaseConfig = {
  auth: {
    persistSession: true,           // Session im localStorage speichern
    autoRefreshToken: true,         // 🔧 WICHTIG: Automatische Token-Erneuerung
    detectSessionInUrl: true,       // OAuth-Sessions in URL erkennen
    flowType: 'pkce',              // Sicherere Auth-Flow
    storage: window.localStorage,   // Explizit localStorage verwenden
    storageKey: 'sb-auth-token',   // Eindeutiger Storage-Key
  },
  realtime: {
    params: {
      eventsPerSecond: 10          // Rate-Limiting für Realtime
    }
  },
  // 🔧 GLOBAL SETTINGS für bessere Stabilität
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
  // 🔧 DB SETTINGS für längere Timeouts
  db: {
    schema: 'public',
  }
};

// 🔧 MOCK QUERY BUILDER für Fallback-Szenarien
const createMockQuery = (tableName) => {
  console.log('🔧 Mock Query erstellt für Tabelle:', tableName);
  
  return {
    select: (columns) => {
      console.log('🔧 Mock select() für:', tableName, 'Columns:', columns);
      return createMockQuery(tableName);
    },
    insert: (data) => {
      console.log('🔧 Mock insert() für:', tableName, 'Data:', data);
      return createMockQuery(tableName);
    },
    update: (data) => {
      console.log('🔧 Mock update() für:', tableName, 'Data:', data);
      return createMockQuery(tableName);
    },
    delete: () => {
      console.log('🔧 Mock delete() für:', tableName);
      return createMockQuery(tableName);
    },
    eq: (column, value) => {
      console.log('🔧 Mock eq() für:', tableName, 'Column:', column, 'Value:', value);
      return createMockQuery(tableName);
    },
    order: (column, options) => {
      console.log('🔧 Mock order() für:', tableName, 'Column:', column, 'Options:', options);
      return createMockQuery(tableName);
    },
    limit: (count) => {
      console.log('🔧 Mock limit() für:', tableName, 'Count:', count);
      return createMockQuery(tableName);
    },
    single: async () => {
      console.log('🔧 Mock single() für:', tableName);
      return { data: null, error: { code: 'PGRST116', message: 'Mock-Modus: Keine Daten verfügbar' } };
    },
    maybeSingle: async () => {
      console.log('🔧 Mock maybeSingle() für:', tableName);
      return { data: null, error: { code: 'PGRST116', message: 'Mock-Modus: Keine Daten verfügbar' } };
    },
    then: async (callback) => {
      console.log('🔧 Mock Query-Ausführung für:', tableName);
      const result = { data: null, error: { message: 'Mock-Modus aktiv - keine echte Datenbank-Verbindung' } };
      return callback ? callback(result) : result;
    }
  };
};

// 🛡️ SICHERER QUERY WRAPPER für echte Supabase-Calls
const createSecureQuery = (originalQuery, tableName) => {
  if (!originalQuery) {
    console.error('🚨 Original Query ist null/undefined für Tabelle:', tableName);
    return createMockQuery(tableName);
  }

  return {
    select: (columns) => {
      try {
        const result = originalQuery.select(columns);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in select() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    insert: (data) => {
      try {
        const result = originalQuery.insert(data);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in insert() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    update: (data) => {
      try {
        const result = originalQuery.update(data);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in update() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    delete: () => {
      try {
        const result = originalQuery.delete();
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in delete() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    eq: (column, value) => {
      try {
        const result = originalQuery.eq(column, value);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in eq() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    order: (column, options) => {
      try {
        const result = originalQuery.order(column, options);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in order() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    limit: (count) => {
      try {
        const result = originalQuery.limit(count);
        return result ? createSecureQuery(result, tableName) : createMockQuery(tableName);
      } catch (error) {
        console.error('🚨 Fehler in limit() für:', tableName, error);
        return createMockQuery(tableName);
      }
    },
    
    single: async () => {
      try {
        if (!originalQuery.single) {
          console.error('🚨 single() Methode nicht verfügbar für:', tableName);
          return { data: null, error: { code: 'PGRST116', message: 'single() nicht verfügbar' } };
        }
        const result = await originalQuery.single();
        return result;
      } catch (error) {
        console.error('🚨 Fehler in single() für:', tableName, error);
        return { data: null, error };
      }
    },
    
    maybeSingle: async () => {
      try {
        if (!originalQuery.maybeSingle) {
          console.error('🚨 maybeSingle() Methode nicht verfügbar für:', tableName);
          return { data: null, error: { code: 'PGRST116', message: 'maybeSingle() nicht verfügbar' } };
        }
        const result = await originalQuery.maybeSingle();
        return result;
      } catch (error) {
        console.error('🚨 Fehler in maybeSingle() für:', tableName, error);
        return { data: null, error };
      }
    },
    
    then: async (callback) => {
      try {
        if (!originalQuery.then) {
          console.error('🚨 Query ist nicht thenable für:', tableName);
          const result = { data: null, error: { message: 'Query nicht ausführbar' } };
          return callback ? callback(result) : result;
        }
        return await originalQuery.then(callback);
      } catch (error) {
        console.error('🚨 Fehler in Query-Ausführung für:', tableName, error);
        const result = { data: null, error };
        return callback ? callback(result) : result;
      }
    }
  };
};

// ✅ SUPABASE CLIENT mit verbesserter Konfiguration
export const supabase = isUsingMock 
  ? {
      // Mock-Implementierung
      auth: {
        getSession: async () => {
          console.log('🔧 Mock: getSession aufgerufen');
          return { data: { session: null }, error: null };
        },
        getUser: async () => {
          console.log('🔧 Mock: getUser aufgerufen');
          return { data: { user: null }, error: null };
        },
        signOut: async () => {
          console.log('🔧 Mock: signOut aufgerufen');
          return { error: null };
        },
        signInWithPassword: async () => {
          console.log('🔧 Mock: signInWithPassword aufgerufen');
          return { data: null, error: { message: 'Mock-Modus aktiv - keine echte Anmeldung möglich' } };
        },
        signUp: async () => {
          console.log('🔧 Mock: signUp aufgerufen');
          return { data: null, error: { message: 'Mock-Modus aktiv - keine echte Registrierung möglich' } };
        },
        onAuthStateChange: (callback) => {
          console.log('🔧 Mock: onAuthStateChange aufgerufen');
          setTimeout(() => callback('SIGNED_OUT', null), 100);
          return { 
            data: { 
              subscription: { 
                unsubscribe: () => console.log('🔧 Mock: Auth-Subscription beendet') 
              } 
            } 
          };
        },
        refreshSession: async () => {
          console.log('🔧 Mock: refreshSession aufgerufen');
          return { data: { session: null }, error: null };
        }
      },
      from: (table) => {
        console.log('🔧 Mock: Tabellenzugriff auf', table);
        return createMockQuery(table);
      },
      rpc: async (functionName, params) => {
        console.log('🔧 Mock: RPC-Aufruf', functionName, params);
        return { data: null, error: { message: 'Mock-Modus: RPC nicht verfügbar' } };
      }
    }
  : (() => {
      try {
        console.log('🔧 Erstelle echten Supabase-Client mit Auto-Refresh...');
        
        // 🔧 VERBESSERT: Client mit erweiterter Konfiguration
        const realClient = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
        
        if (!realClient) {
          console.error('🚨 KRITISCH: Supabase-Client konnte nicht erstellt werden!');
          throw new Error('Supabase Client Creation Failed');
        }
        
        // 🛡️ SICHERE from() Funktion
        const originalFrom = realClient.from.bind(realClient);
        realClient.from = (table) => {
          try {
            if (!table || typeof table !== 'string') {
              console.error('🚨 Ungültiger Tabellenname:', table);
              return createMockQuery(table);
            }
            
            const originalQuery = originalFrom(table);
            
            if (!originalQuery) {
              console.error('🚨 Query-Objekt ist null für Tabelle:', table);
              return createMockQuery(table);
            }
            
            return createSecureQuery(originalQuery, table);
          } catch (error) {
            console.error('🚨 KRITISCHER FEHLER in realClient.from():', error);
            return createMockQuery(table);
          }
        };
        
        // 🛡️ SICHERE RPC Funktion
        const originalRpc = realClient.rpc.bind(realClient);
        realClient.rpc = async (functionName, params) => {
          try {
            return await originalRpc(functionName, params);
          } catch (error) {
            console.error('🚨 Fehler in RPC:', error);
            return { data: null, error };
          }
        };
        
        console.log('✅ Supabase-Client erfolgreich erstellt');
        return realClient;
        
      } catch (error) {
        console.error('🚨 FATALER FEHLER beim Erstellen des Supabase-Clients:', error);
        console.error('Fallback zu Mock-Modus...');
        
        // Fallback zu Mock-Client
        return {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signOut: async () => ({ error: null }),
            signInWithPassword: async () => ({ data: null, error: { message: 'Fallback-Modus: Auth nicht verfügbar' } }),
            signUp: async () => ({ data: null, error: { message: 'Fallback-Modus: Auth nicht verfügbar' } }),
            onAuthStateChange: (callback) => {
              setTimeout(() => callback('SIGNED_OUT', null), 100);
              return { data: { subscription: { unsubscribe: () => {} } } };
            },
            refreshSession: async () => ({ data: { session: null }, error: null })
          },
          from: (table) => createMockQuery(table),
          rpc: async () => ({ data: null, error: { message: 'Fallback-Modus: RPC nicht verfügbar' } })
        };
      }
    })();

// 🔧 VERBESSERTE SESSION-REFRESH-FUNKTION (ERSETZT DIE ALTE)
const setupImprovedSessionRefresh = () => {
  if (isUsingMock) return;
  
  let refreshInProgress = false;
  
  const checkAndRefreshSession = async () => {
    // Verhindere mehrfache gleichzeitige Refresh-Versuche
    if (refreshInProgress) {
      console.log('🔄 Session-Refresh bereits in Bearbeitung, überspringe...');
      return;
    }
    
    try {
      refreshInProgress = true;
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🚨 Session-Check Fehler:', error);
        return;
      }
      
      if (!session) {
        console.log('📤 Keine Session vorhanden');
        return;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏰ Session läuft ab in: ${Math.floor(timeUntilExpiry / 60)} Minuten`);
      
      // Erneuere Token wenn er in den nächsten 5 Minuten abläuft
      if (timeUntilExpiry < 300) { // 5 Minuten = 300 Sekunden
        console.log('🔄 Starte proaktive Session-Erneuerung...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('🚨 Session-Refresh fehlgeschlagen:', refreshError);
          
          // Bei Refresh-Fehler: Benutzer zur Login-Seite weiterleiten
          if (refreshError.message?.includes('refresh_token_not_found') || 
              refreshError.message?.includes('Invalid refresh token')) {
            console.log('🔄 Token ungültig, leite zur Anmeldung weiter...');
            await supabase.auth.signOut();
            window.location.href = '/login';
            return;
          }
        } else {
          console.log('✅ Session erfolgreich erneuert');
        }
      }
      
    } catch (err) {
      console.error('🚨 Unerwarteter Session-Check Fehler:', err);
    } finally {
      refreshInProgress = false;
    }
  };
  
  // Prüfe alle 2 Minuten (weniger aggressiv als vorher)
  const intervalId = setInterval(checkAndRefreshSession, 2 * 60 * 1000);
  
  // Initiale Prüfung nach 5 Sekunden
  setTimeout(checkAndRefreshSession, 5000);
  
  // Cleanup-Funktion
  window.supabaseSessionInterval = intervalId;
  
  return intervalId;
};

// 🔧 AUTH-STATE-CHANGE-LISTENER
const setupAuthStateListener = () => {
  if (isUsingMock) return;
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth State Change:', event, session ? 'Session vorhanden' : 'Keine Session');
    
    switch (event) {
      case 'SIGNED_OUT':
        console.log('📤 Benutzer abgemeldet');
        // Cleanup
        if (window.supabaseSessionInterval) {
          clearInterval(window.supabaseSessionInterval);
        }
        break;
        
      case 'TOKEN_REFRESHED':
        console.log('✅ Token automatisch erneuert');
        break;
        
      case 'SIGNED_IN':
        console.log('📥 Benutzer angemeldet, starte Session-Monitoring');
        // Starte Session-Refresh-Monitoring
        setupImprovedSessionRefresh();
        break;
    }
  });
  
  // Cleanup-Funktion für später
  window.supabaseAuthSubscription = subscription;
  
  return subscription;
};

// 🔧 NEUE UTILITY-FUNKTIONEN für Session-Management
export const refreshUserSession = async () => {
  if (isUsingMock) {
    console.log('🔧 Mock: Session-Refresh übersprungen');
    return { success: false, error: 'Mock-Modus' };
  }
  
  try {
    console.log('🔧 Manuelle Session-Erneuerung...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('🚨 Session-Refresh fehlgeschlagen:', error);
      return { success: false, error };
    }
    
    console.log('✅ Session erfolgreich erneuert');
    return { success: true, session: data.session };
  } catch (err) {
    console.error('🚨 Unerwarteter Fehler bei Session-Refresh:', err);
    return { success: false, error: err };
  }
};

export const checkSessionStatus = async () => {
  if (isUsingMock) {
    return { valid: false, timeLeft: 0, error: 'Mock-Modus' };
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { valid: false, timeLeft: 0, error };
    }
    
    if (!session) {
      return { valid: false, timeLeft: 0, error: 'Keine Session' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const timeLeft = expiresAt - now;
    
    return { 
      valid: timeLeft > 0, 
      timeLeft, 
      timeLeftMinutes: Math.floor(timeLeft / 60),
      session 
    };
  } catch (err) {
    return { valid: false, timeLeft: 0, error: err };
  }
};

// 🔧 VERBESSERTE SIGN-IN FUNKTION MIT AUTO-REFRESH
export const signInWithAutoRefresh = async ({ email, password }) => {
  if (isUsingMock) {
    return { 
      data: { user: { id: 'mock-user', email }, session: { access_token: 'mock' } }, 
      error: null 
    };
  }
  
  try {
    console.log('🔑 Starte Anmeldung mit Auto-Refresh...');
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      console.error('❌ Anmeldung fehlgeschlagen:', error);
      return { data: null, error };
    }
    
    if (data.session) {
      console.log('✅ Anmeldung erfolgreich, starte Session-Monitoring');
      
      // Starte Session-Refresh und Auth-Listener
      setupImprovedSessionRefresh();
      setupAuthStateListener();
    }
    
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Unerwarteter Anmeldefehler:', error);
    return { data: null, error };
  }
};

// 🔧 VERBESSERTE getCurrentUser MIT SESSION-CHECK
export const getCurrentUserWithRefresh = async () => {
  if (isUsingMock) return null;
  
  try {
    // Erst prüfen ob Session noch gültig ist
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️ Session-Fehler:', error);
      return null;
    }
    
    if (!session) {
      console.log('📤 Keine Session vorhanden');
      return null;
    }
    
    // Prüfe ob Session bald abläuft
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const timeUntilExpiry = expiresAt - now;
    
    // Wenn Session in den nächsten 30 Sekunden abläuft, versuche Refresh
    if (timeUntilExpiry < 30) {
      console.log('⏰ Session läuft bald ab, versuche Refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('🚨 Session-Refresh fehlgeschlagen:', refreshError);
        return null;
      }
      
      console.log('✅ Session vor Ablauf erneuert');
      return refreshData.session?.user || null;
    }
    
    return session.user;
    
  } catch (err) {
    console.error('❌ getCurrentUserWithRefresh Fehler:', err);
    return null;
  }
};

// 🔧 INITIALISIERUNG (rufe das beim App-Start auf)
export const initializeSupabaseAuth = () => {
  if (isUsingMock) {
    console.log('🔧 Mock-Modus: Supabase Auth übersprungen');
    return;
  }
  
  console.log('🚀 Initialisiere Supabase Auth mit Auto-Refresh...');
  
  // Setup Auth-State-Listener
  setupAuthStateListener();
  
  // Prüfe aktuelle Session und starte Monitoring falls nötig
  getCurrentUserWithRefresh().then(user => {
    if (user) {
      console.log('👤 Bestehende Session gefunden, starte Monitoring');
      setupImprovedSessionRefresh();
    } else {
      console.log('📝 Keine bestehende Session');
    }
  });
};

// 🔧 DEBUG-INFORMATIONEN erweitern
window.isUsingMock = isUsingMock;
window.supabaseDebug = {
  isUsingMock,
  supabaseUrl: supabaseUrl ? 'SET' : 'NOT_SET',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT_SET',
  clientExists: !!supabase,
  clientType: isUsingMock ? 'MOCK' : 'REAL',
  autoRefreshEnabled: !isUsingMock,
  timestamp: new Date().toISOString(),
  // Session-Debug-Funktionen
  refreshSession: refreshUserSession,
  checkSession: checkSessionStatus
};

// Cleanup beim App-Shutdown (erweitert)
window.addEventListener('beforeunload', () => {
  if (window.supabaseSessionInterval) {
    clearInterval(window.supabaseSessionInterval);
    console.log('🧹 Session-Interval gestoppt');
  }
  
  if (window.supabaseAuthSubscription) {
    window.supabaseAuthSubscription.unsubscribe();
    console.log('🧹 Auth-Subscription beendet');
  }
});

// Verbesserte Warnung ausgeben
if (isUsingMock && process.env.NODE_ENV === 'development') {
  console.warn(
    '🔧 SUPABASE MOCK-MODUS AKTIV!\n' +
    '📝 Um echte Supabase-Funktionen zu nutzen, erstelle eine .env-Datei mit:\n' +
    '   REACT_APP_SUPABASE_URL=https://dein-projekt.supabase.co\n' +
    '   REACT_APP_SUPABASE_ANON_KEY=dein_anon_key\n' +
    '🔄 Dann starte die App neu mit: npm start'
  );
} else {
  console.log('✅ Supabase-Client mit verbessertem Session-Management initialisiert:', {
    isUsingMock,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    clientReady: !!supabase,
    autoRefreshEnabled: true
  });
}

// 🔧 TAB-WECHSEL SESSION-FIX
// Füge diesen Code in deine supabaseClient.js ein (nach den bestehenden Funktionen)

// 🔧 TAB-VISIBILITY SESSION-RECOVERY
const setupTabVisibilitySessionRecovery = () => {
  if (isUsingMock) return;
  
  let tabWasHidden = false;
  let sessionRecoveryInProgress = false;
  
  const handleVisibilityChange = async () => {
    const isHidden = document.hidden;
    
    if (isHidden) {
      // Tab wird versteckt
      console.log('📱 Tab wird inaktiv - pausiere Session-Monitoring');
      tabWasHidden = true;
      
      // Stoppe den normalen Session-Check während Tab inaktiv ist
      if (window.supabaseSessionInterval) {
        clearInterval(window.supabaseSessionInterval);
        console.log('⏸️ Session-Interval pausiert');
      }
      
    } else if (tabWasHidden && !sessionRecoveryInProgress) {
      // Tab wird wieder aktiv
      console.log('🔄 Tab wird wieder aktiv - prüfe Session-Status...');
      tabWasHidden = false;
      sessionRecoveryInProgress = true;
      
      try {
        // Sofortige Session-Prüfung beim Tab-Wechsel zurück
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🚨 Session-Check nach Tab-Wechsel fehlgeschlagen:', error);
          sessionRecoveryInProgress = false;
          return;
        }
        
        if (!session) {
          console.log('❌ Keine Session nach Tab-Wechsel - Benutzer muss sich neu anmelden');
          // Weiterleitung zur Login-Seite
          window.location.href = '/login';
          return;
        }
        
        // Prüfe ob Session bald abläuft oder bereits abgelaufen ist
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;
        const timeUntilExpiry = expiresAt - now;
        
        console.log(`⏰ Session-Status nach Tab-Wechsel: ${Math.floor(timeUntilExpiry / 60)} Minuten verbleibend`);
        
        if (timeUntilExpiry <= 0) {
          console.log('⚠️ Session ist bereits abgelaufen, versuche Refresh...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('🚨 Session-Refresh nach Tab-Wechsel fehlgeschlagen:', refreshError);
            console.log('🔄 Leite zur Anmeldung weiter...');
            await supabase.auth.signOut();
            window.location.href = '/login';
            return;
          }
          
          console.log('✅ Session nach Tab-Wechsel erfolgreich erneuert');
          
        } else if (timeUntilExpiry < 300) { // Weniger als 5 Minuten
          console.log('⚠️ Session läuft bald ab, erneuere proaktiv...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('⚠️ Proaktive Session-Erneuerung fehlgeschlagen:', refreshError);
            // Trotzdem weitermachen, da Session noch gültig ist
          } else {
            console.log('✅ Session proaktiv nach Tab-Wechsel erneuert');
          }
        } else {
          console.log('✅ Session ist noch gültig nach Tab-Wechsel');
        }
        
        // Starte Session-Monitoring wieder
        console.log('🔄 Starte Session-Monitoring nach Tab-Wechsel neu...');
        setupImprovedSessionRefresh();
        
      } catch (err) {
        console.error('🚨 Unerwarteter Fehler bei Tab-Wechsel Session-Recovery:', err);
        // Im Zweifelsfall zur Login-Seite
        window.location.href = '/login';
      } finally {
        sessionRecoveryInProgress = false;
      }
    }
  };
  
  // Page Visibility API Listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Zusätzlicher Focus-Listener für bessere Browser-Kompatibilität
  window.addEventListener('focus', async () => {
    if (tabWasHidden && !sessionRecoveryInProgress) {
      console.log('🔍 Window-Focus erkannt - trigger Session-Check');
      await handleVisibilityChange();
    }
  });
  
  // Cleanup-Funktion speichern
  window.tabVisibilityCleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    console.log('🧹 Tab-Visibility-Listener entfernt');
  };
  
  console.log('✅ Tab-Visibility Session-Recovery aktiviert');
};

// 🔧 VERBESSERTE Session-Refresh mit Tab-Awareness
const setupImprovedSessionRefreshWithTabAwareness = () => {
  if (isUsingMock) return;
  
  let refreshInProgress = false;
  
  const checkAndRefreshSession = async () => {
    // Überspringe Session-Check wenn Tab versteckt ist
    if (document.hidden) {
      console.log('⏸️ Tab ist versteckt, überspringe Session-Check');
      return;
    }
    
    // Verhindere mehrfache gleichzeitige Refresh-Versuche
    if (refreshInProgress) {
      console.log('🔄 Session-Refresh bereits in Bearbeitung, überspringe...');
      return;
    }
    
    try {
      refreshInProgress = true;
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🚨 Session-Check Fehler:', error);
        return;
      }
      
      if (!session) {
        console.log('📤 Keine Session vorhanden');
        return;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏰ Session läuft ab in: ${Math.floor(timeUntilExpiry / 60)} Minuten`);
      
      // Erneuere Token wenn er in den nächsten 5 Minuten abläuft
      if (timeUntilExpiry < 300) { // 5 Minuten = 300 Sekunden
        console.log('🔄 Starte proaktive Session-Erneuerung...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('🚨 Session-Refresh fehlgeschlagen:', refreshError);
          
          // Bei Refresh-Fehler: Benutzer zur Login-Seite weiterleiten
          if (refreshError.message?.includes('refresh_token_not_found') || 
              refreshError.message?.includes('Invalid refresh token')) {
            console.log('🔄 Token ungültig, leite zur Anmeldung weiter...');
            await supabase.auth.signOut();
            window.location.href = '/login';
            return;
          }
        } else {
          console.log('✅ Session erfolgreich erneuert');
        }
      }
      
    } catch (err) {
      console.error('🚨 Unerwarteter Session-Check Fehler:', err);
    } finally {
      refreshInProgress = false;
    }
  };
  
  // Prüfe alle 90 Sekunden (häufiger für bessere Tab-Wechsel-Kompatibilität)
  const intervalId = setInterval(checkAndRefreshSession, 90 * 1000);
  
  // Initiale Prüfung nach 5 Sekunden
  setTimeout(checkAndRefreshSession, 5000);
  
  // Cleanup-Funktion
  window.supabaseSessionInterval = intervalId;
  
  return intervalId;
};

// 🔧 VERBESSERTE INITIALISIERUNG mit Tab-Support
export const initializeSupabaseAuthWithTabSupport = () => {
  if (isUsingMock) {
    console.log('🔧 Mock-Modus: Supabase Auth übersprungen');
    return;
  }
  
  console.log('🚀 Initialisiere Supabase Auth mit Tab-Wechsel-Support...');
  
  // Setup Auth-State-Listener
  setupAuthStateListener();
  
  // Setup Tab-Visibility Session-Recovery
  setupTabVisibilitySessionRecovery();
  
  // Prüfe aktuelle Session und starte Monitoring falls nötig
  getCurrentUserWithRefresh().then(user => {
    if (user) {
      console.log('👤 Bestehende Session gefunden, starte Tab-aware Monitoring');
      setupImprovedSessionRefreshWithTabAwareness();
    } else {
      console.log('📝 Keine bestehende Session');
    }
  });
};

// 🔧 ERWEITERTE CLEANUP-FUNKTION
const cleanupSupabaseAuth = () => {
  // Stoppe Session-Interval
  if (window.supabaseSessionInterval) {
    clearInterval(window.supabaseSessionInterval);
    console.log('🧹 Session-Interval gestoppt');
  }
  
  // Stoppe Auth-Subscription
  if (window.supabaseAuthSubscription) {
    window.supabaseAuthSubscription.unsubscribe();
    console.log('🧹 Auth-Subscription beendet');
  }
  
  // Stoppe Tab-Visibility-Listener
  if (window.tabVisibilityCleanup) {
    window.tabVisibilityCleanup();
  }
};

// Erweiterte Cleanup beim App-Shutdown
window.addEventListener('beforeunload', cleanupSupabaseAuth);

// Zusätzlicher Cleanup bei Navigations-Events
window.addEventListener('pagehide', cleanupSupabaseAuth);

console.log('✅ Tab-Wechsel Session-Recovery Funktionen geladen');

// 🔧 DEBUG: Tab-Status überwachen
if (process.env.NODE_ENV === 'development') {
  window.supabaseTabDebug = {
    getCurrentTabStatus: () => ({
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      sessionIntervalActive: !!window.supabaseSessionInterval,
      authSubscriptionActive: !!window.supabaseAuthSubscription
    }),
    forceSessionCheck: async () => {
      console.log('🔧 DEBUG: Erzwinge Session-Check...');
      return await getCurrentUserWithRefresh();
    }
  };
}

// Agenten-Funktionen - Verbessert mit korrektem Rückgabeformat
export const getAgentById = async (agentId) => {
  console.log('Suche Agent mit ID:', agentId);
  
  if (isUsingMock) {
    // Wenn wir im Mock-Modus sind, verwenden wir statische Daten
    const agentsData = [
      {
        id: 'second-brain',
        title: 'AI',
        full_title: 'Dein zweites Gehirn',
        color: 'bg-blue-600',
        description: 'Allgemeiner intelligenter Assistent für alle Anfragen',
        initial_message: 'Hallo, ich bin dein zweites Gehirn. Ich stehe dir bei allen Fragen und Aufgaben zur Verfügung. Wie kann ich dir heute helfen?'
      },
      {
        id: 'cmo',
        title: 'CMO',
        full_title: 'Chief Marketing Officer',
        color: 'bg-purple-600',
        description: 'Marketing-Strategien und Markenentwicklung',
        initial_message: 'Hallo, ich bin dein CMO-Agent. Ich unterstütze dich bei Marketingstrategien, Markenentwicklung, Kundenbindung und der Optimierung deiner Marketingmaßnahmen. Wie kann ich dir heute helfen?'
      },
      {
        id: 'cfo',
        title: 'CFO',
        full_title: 'Chief Financial Officer',
        color: 'bg-amber-600',
        description: 'Finanzplanung und wirtschaftliche Beratung',
        initial_message: 'Hallo, ich bin dein CFO-Agent. Ich unterstütze dich bei Finanzplanung, Budgetierung, Investitionsentscheidungen und finanziellen Analysen. Wie kann ich dir heute helfen?'
      },
      {
        id: 'coo',
        title: 'COO',
        full_title: 'Chief Operations Officer',
        color: 'bg-emerald-600',
        description: 'Optimierung von Geschäftsprozessen und operativer Effizienz',
        initial_message: 'Hallo, ich bin dein COO-Agent. Ich unterstütze dich bei der Optimierung von Geschäftsprozessen, operativer Effizienz und Ressourcenmanagement. Wie kann ich dir heute helfen?'
      }
    ];
    
    const mockAgent = agentsData.find(a => a.id === agentId);
    return { agent: mockAgent, error: null };
  }
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    console.log('Datenbank-Antwort:', data, error);
    
    if (error) {
      console.error('Fehler bei der Datenbankanfrage:', error);
      return { agent: null, error };
    }
    
    return { agent: data, error: null };
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden des Agenten:', err);
    return { agent: null, error: err };
  }
};

// Ersetze die getSecondBrainSettings und saveSecondBrainSettings Funktionen in deinem supabaseClient.js:

export const getSecondBrainSettings = async (userId, agentId = 'second-brain') => {
  console.log('Lade Second Brain Einstellungen für Benutzer:', userId, 'und Agent:', agentId);
  
  if (isUsingMock) {
    return { 
      settings: getMockSecondBrainSettings(), 
      model_version: 'gpt-4-turbo',
      error: null 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('second_brain_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Keine Einstellungen gefunden, verwende Standardwerte');
        return { 
          settings: getMockSecondBrainSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
      
      console.error('Fehler beim Laden der Second Brain Einstellungen:', error);
      return { 
        settings: null, 
        model_version: 'gpt-4-turbo',
        error 
      };
    }
    
    console.log('Second Brain Rohdaten aus DB:', data);
    
    // Neue 4-Tab-Struktur aus DB-Daten zusammenstellen
    const settings = {
      // Neue 4-Tab-Struktur - direkt aus DB-Spalten
      unternehmerprofil: data.unternehmerprofil || {
        entscheidungsstil: '',
        risikobereitschaft: '',
        zeithorizont: '',
        gruenderTyp: ''
      },
      
      unternehmensausrichtung: data.unternehmensausrichtung || {
        unternehmensart: '',
        phase: '',
        wachstumsstrategie: [],
        visionLangfristig: ''
      },
      
      fokusbereiche: data.fokusbereiche || {
        aktuellePrioritaet: [],
        entscheidendeHebel: '',
        abhaengigkeiten: ''
      },
      
      wettbewerb: data.wettbewerb || {
        konkurrenzUmfeld: '',
        vorteileGegenueberWettbewerb: ''
      },
      
      // Alte Strukturen VOLLSTÄNDIG beibehalten für Kompatibilität
      identitaet: data.identitaet || {},
      persoenlichkeit: data.persoenlichkeit || {},
      fachlicheAusrichtung: data.fachlicheAusrichtung || {},
      unternehmenskontext: data.unternehmenskontext || {},
      systemprompts: data.systemprompts || {},
      reflexionsfokus: data.reflexionsfokus || {}
    };
    
    console.log('Second Brain Einstellungen verarbeitet (neue + alte Struktur):', settings);
    
    return { 
      settings, 
      model_version: data.model_version || 'gpt-4-turbo',
      error: null 
    };
    
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden der Second Brain Einstellungen:', error);
    return { 
      settings: getMockSecondBrainSettings(), 
      model_version: 'gpt-4-turbo',
      error 
    };
  }
};

export const saveSecondBrainSettings = async (userId, agentId, settings, modelVersion = 'gpt-3.5-turbo') => {
  if (isUsingMock) {
    console.log('Mock-Modus: Würde Second Brain Einstellungen speichern', userId, agentId, settings);
    return { success: true };
  }
  
  try {
    console.log('=== SECOND BRAIN SPEICHERUNG START ===');
    console.log('Benutzer:', userId);
    console.log('Agent:', agentId);
    console.log('Eingehende Einstellungen (neue + alte Struktur):', JSON.stringify(settings, null, 2));
    
    // Prüfen, ob bereits Einstellungen existieren
    const { data: existingData, error: existingError } = await supabase
      .from('second_brain_settings')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .limit(1);
    
    if (existingError) {
      console.error('Fehler beim Prüfen bestehender Daten:', existingError);
    }
    
    // DB-Settings mit neuer und alter Struktur
    const dbSettings = {
      // Neue 4-Tab-Struktur - direkt in eigene Spalten
      unternehmerprofil: settings.unternehmerprofil || {
        entscheidungsstil: '',
        risikobereitschaft: '',
        zeithorizont: '',
        gruenderTyp: ''
      },
      
      unternehmensausrichtung: settings.unternehmensausrichtung || {
        unternehmensart: '',
        phase: '',
        wachstumsstrategie: [],
        visionLangfristig: ''
      },
      
      fokusbereiche: settings.fokusbereiche || {
        aktuellePrioritaet: [],
        entscheidendeHebel: '',
        abhaengigkeiten: ''
      },
      
      wettbewerb: settings.wettbewerb || {
        konkurrenzUmfeld: '',
        vorteileGegenueberWettbewerb: ''
      },
      
      // Alte Strukturen AUCH speichern für vollständige Kompatibilität
      identitaet: settings.identitaet || {},
      persoenlichkeit: settings.persoenlichkeit || {},
      fachlicheAusrichtung: settings.fachlicheAusrichtung || {},
      unternehmenskontext: settings.unternehmenskontext || {},
      systemprompts: settings.systemprompts || {},
      reflexionsfokus: settings.reflexionsfokus || {},
      
      model_version: modelVersion,
      updated_at: new Date().toISOString()
    };
    
    console.log('Daten für DB aufbereitet (neue + alte Struktur):', JSON.stringify(dbSettings, null, 2));
    
    let result;
    
    if (existingData && existingData.length > 0) {
      console.log('Update bestehender Eintrag mit ID:', existingData[0].id);
      
      // Update vorhandene Einstellungen
      const { data, error } = await supabase
        .from('second_brain_settings')
        .update(dbSettings)
        .eq('id', existingData[0].id)
        .select();
        
      result = { data, error };
    } else {
      console.log('Erstelle neuen Eintrag');
      
      // Erstelle neue Einstellungen
      const { data, error } = await supabase
        .from('second_brain_settings')
        .insert({
          user_id: userId,
          agent_id: agentId,
          ...dbSettings
        })
        .select();
        
      result = { data, error };
    }
    
    if (result.error) {
      console.error('=== SECOND BRAIN SPEICHER-FEHLER ===');
      console.error('Fehler Details:', result.error);
      console.error('Fehler Code:', result.error.code);
      console.error('Fehler Message:', result.error.message);
      console.error('Fehler Hint:', result.error.hint);
      console.error('Fehler Details:', result.error.details);
      return { success: false, error: result.error };
    }
    
    console.log('=== SECOND BRAIN SPEICHERUNG ERFOLGREICH ===');
    console.log('Gespeicherte Daten:', result.data);
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error('=== UNERWARTETER SECOND BRAIN SPEICHER-FEHLER ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
};

// KORRIGIERTE CFO Speicher- und Ladefunktionen für supabaseClient.js

export const getCFOSettings = async (userId, agentId = 'cfo') => {
  console.log('Lade CFO Einstellungen für Benutzer:', userId, 'und Agent:', agentId);
  
  if (isUsingMock) {
    return { 
      settings: getMockCFOSettings(), 
      model_version: 'gpt-4-turbo',
      error: null 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('cfo_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Keine CFO Einstellungen gefunden, verwende Standardwerte');
        return { 
          settings: getMockCFOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
      
      console.error('Fehler beim Laden der CFO Einstellungen:', error);
      return { 
        settings: null, 
        model_version: 'gpt-4-turbo',
        error 
      };
    }
    
    console.log('CFO Rohdaten aus DB:', data);
    
    // Neue 5-Tab-Struktur aus DB-Daten zusammenstellen
    const settings = {
      // Neue 5-Tab-Struktur - direkt aus DB-Spalten
      kapitalFinanzierung: data.kapitalFinanzierung || {
        finanzierungsstatus: '',
        runwayInMonaten: '',
        burnRateMonatlich: ''
      },
      
      einnahmenmodell: data.einnahmenmodell || {
        umsatzmodell: '',
        wiederkehrendeUmsaetze: '',
        monatlicherUmsatz: ''
      },
      
      kostenstruktur: data.kostenstruktur || {
        hauptkostenarten: '',
        outsourcingQuote: ''
      },
      
      finanzplanungTools: data.finanzplanungTools || {
        finanzplanVorhanden: '',
        buchhaltungstool: ''
      },
      
      skalierungsoption: data.skalierungsoption || {
        skalierungsausFinanzsicht: ''
      },
      
      // System-Prompts (unified aus verschiedenen Quellen)
      systemprompts: data.systemprompts || data.systemPrompts || {
        systemPrompt: 'Du bist ein analytisch denkender CFO mit einem klaren Blick auf Zahlen, Liquidität und finanzielle Risiken. Du bewertest jede Maßnahme hinsichtlich Cash-Impact, Renditepotenzial und Planungssicherheit.',
        begruessung: 'Gib mir bitte eine schnelle Einschätzung zur aktuellen finanziellen Lage – was ist kritisch?',
        fallback: 'Bitte lade die letzten Finanzdaten hoch oder beschreibe die wichtigsten Kennzahlen, damit ich valide Entscheidungen ableiten kann.',
        krisenPrompt: 'Bewerte das Überleben des Unternehmens bei 30% Umsatzrückgang in den nächsten 3 Monaten.'
      },
      
      // Alte Strukturen VOLLSTÄNDIG beibehalten für Kompatibilität
      identitaet: data.identitaet || {},
      persoenlichkeit: data.persoenlichkeit || {},
      finanzFunktionen: data.finanzFunktionen || {},
      unternehmensKontext: data.unternehmensKontext || data.unternehmenskontext || {},
      systemPrompts: data.systemPrompts || data.systemprompts || {},
      interaktion: data.interaktion || {},
      fachlicheausrichtung: data.fachlicheausrichtung || {},
      finanzfokus: data.finanzfokus || {}
    };
    
    console.log('CFO Einstellungen verarbeitet (neue + alte Struktur):', settings);
    
    return { 
      settings, 
      model_version: data.model_version || 'gpt-4-turbo',
      error: null 
    };
    
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden der CFO Einstellungen:', error);
    return { 
      settings: getMockCFOSettings(), 
      model_version: 'gpt-4-turbo',
      error 
    };
  }
};

export const saveCFOSettings = async (userId, agentId, settings, modelVersion = 'gpt-3.5-turbo') => {
  if (isUsingMock) {
    console.log('Mock-Modus: Würde CFO Einstellungen speichern', userId, agentId, settings);
    return { success: true };
  }
  
  try {
    console.log('=== CFO SPEICHERUNG START ===');
    console.log('Benutzer:', userId);
    console.log('Agent:', agentId);
    console.log('Eingehende Einstellungen (neue + alte Struktur):', JSON.stringify(settings, null, 2));
    
    // Prüfen, ob bereits Einstellungen existieren
    const { data: existingData, error: existingError } = await supabase
      .from('cfo_settings')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .limit(1);
    
    if (existingError) {
      console.error('Fehler beim Prüfen bestehender CFO Daten:', existingError);
    }
    
    // DB-Settings mit neuer und alter Struktur
    const dbSettings = {
      // Neue 5-Tab-Struktur - direkt in eigene Spalten
      kapitalFinanzierung: settings.kapitalFinanzierung || {
        finanzierungsstatus: '',
        runwayInMonaten: '',
        burnRateMonatlich: ''
      },
      
      einnahmenmodell: settings.einnahmenmodell || {
        umsatzmodell: '',
        wiederkehrendeUmsaetze: '',
        monatlicherUmsatz: ''
      },
      
      kostenstruktur: settings.kostenstruktur || {
        hauptkostenarten: '',
        outsourcingQuote: ''
      },
      
      finanzplanungTools: settings.finanzplanungTools || {
        finanzplanVorhanden: '',
        buchhaltungstool: ''
      },
      
      skalierungsoption: settings.skalierungsoption || {
        skalierungsausFinanzsicht: ''
      },
      
      // System-Prompts (neue einheitliche Struktur)
      systemprompts: settings.systemprompts || {
        systemPrompt: 'Du bist ein analytisch denkender CFO mit einem klaren Blick auf Zahlen, Liquidität und finanzielle Risiken.',
        begruessung: 'Gib mir bitte eine schnelle Einschätzung zur aktuellen finanziellen Lage – was ist kritisch?',
        fallback: 'Bitte lade die letzten Finanzdaten hoch oder beschreibe die wichtigsten Kennzahlen, damit ich valide Entscheidungen ableiten kann.',
        krisenPrompt: ''
      },
      
      // Alte Strukturen AUCH speichern für vollständige Kompatibilität
      identitaet: settings.identitaet || {},
      persoenlichkeit: settings.persoenlichkeit || {},
      finanzFunktionen: settings.finanzFunktionen || {},
      unternehmensKontext: settings.unternehmensKontext || {},
      systemPrompts: settings.systemPrompts || settings.systemprompts || {},
      interaktion: settings.interaktion || {},
      fachlicheausrichtung: settings.fachlicheausrichtung || {},
      unternehmenskontext: settings.unternehmenskontext || settings.unternehmensKontext || {},
      finanzfokus: settings.finanzfokus || {},
      
      model_version: modelVersion,
      updated_at: new Date().toISOString()
    };
    
    console.log('CFO Daten für DB aufbereitet (neue + alte Struktur):', JSON.stringify(dbSettings, null, 2));
    
    let result;
    
    if (existingData && existingData.length > 0) {
      console.log('Update bestehender CFO Eintrag mit ID:', existingData[0].id);
      
      // Update vorhandene Einstellungen
      const { data, error } = await supabase
        .from('cfo_settings')
        .update(dbSettings)
        .eq('id', existingData[0].id)
        .select();
        
      result = { data, error };
    } else {
      console.log('Erstelle neuen CFO Eintrag');
      
      // Erstelle neue Einstellungen
      const { data, error } = await supabase
        .from('cfo_settings')
        .insert({
          user_id: userId,
          agent_id: agentId,
          ...dbSettings
        })
        .select();
        
      result = { data, error };
    }
    
    if (result.error) {
      console.error('=== CFO SPEICHER-FEHLER ===');
      console.error('Fehler Details:', result.error);
      console.error('Fehler Code:', result.error.code);
      console.error('Fehler Message:', result.error.message);
      console.error('Fehler Hint:', result.error.hint);
      console.error('Fehler Details:', result.error.details);
      return { success: false, error: result.error };
    }
    
    console.log('=== CFO SPEICHERUNG ERFOLGREICH ===');
    console.log('Gespeicherte CFO Daten:', result.data);
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error('=== UNERWARTETER CFO SPEICHER-FEHLER ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
};

export const getCMOSettings = async (userId, agentId = 'cmo') => {
  console.log('Lade CMO Einstellungen für Benutzer:', userId, 'und Agent:', agentId);
  
  if (isUsingMock) {
    return { 
      settings: getMockCMOSettings(), 
      model_version: 'gpt-4-turbo',
      error: null 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('cmo_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Keine CMO Einstellungen gefunden, verwende Standardwerte');
        return { 
          settings: getMockCMOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
      
      console.error('Fehler beim Laden der CMO Einstellungen:', error);
      return { 
        settings: null, 
        model_version: 'gpt-4-turbo',
        error 
      };
    }
    
    console.log('CMO Rohdaten aus DB:', data);
    
    // Neue 6-Tab-Struktur aus DB-Daten zusammenstellen
    const settings = {
      // Neue 6-Tab-Struktur - direkt aus DB-Spalten
      marketingfunktionen: data.marketingfunktionen || {
        branding: true,
        contentMarketing: false,
        socialMedia: false,
        performanceMarketing: false,
        emailMarketing: false,
        influencerMarketing: false,
        launchKampagnen: false
      },
      
      zielgruppen: data.zielgruppen || {
        zielgruppenbeschreibung: '',
        kundenprobleme: '',
        kaufmotive: { emotional: false, rational: false },
        entscheidungsdauer: '',
        zielgruppentyp: '',
        marktkenntnis: false
      },
      
      produktstatus: data.produktstatus || {
        status: 'idee',
        produktTyp: { physisch: false, digital: false, coaching: false, hybrid: false },
        vertriebslogik: { ecommerce: false, preSale: false, leadFunnel: false, buchung: false, creatorAffiliate: false }
      },
      
      gotomarket: data.gotomarket || {
        taktiken: {
          awareness: false, trustBuilding: false, leadGen: false, conversion: false,
          retention: false, preSaleFunnel: false, launchSequenzen: false, paidAds: false,
          influencerCodes: false, emailSerien: false
        }
      },
      
      erfolgsmetriken: data.erfolgsmetriken || {
        primaereZielsetzung: 'reichweite',
        kpiFokus: {
          followerwachstum: false, linkKlicks: false, conversionRate: false,
          roiAds: false, emailOeffnungen: false, preSalesZiel: false
        },
        kommunikationsziel: ''
      },
      
      gruenderprofil: data.gruenderprofil || {
        wunschrolle: 'thoughtLeader',
        persoenlicheKanaele: { linkedin: false, instagram: false, tiktok: false, youtube: false, podcast: false },
        sichtbarkeitsziele: { vertrauen: false, reichweite: false, autoritaet: false, networking: false },
        personalBrandingAnsatz: '',
        aktiveSichtbarkeit: false
      },
      
      // Alte Strukturen VOLLSTÄNDIG beibehalten für Kompatibilität
      identitaet: data.identitaet || {},
      persoenlichkeit: data.persoenlichkeit || {},
      systemprompts: data.systemprompts || {},
      interaktion: data.interaktion || {},
      contentformate: data.contentformate || {}
    };
    
    console.log('CMO Einstellungen verarbeitet (neue + alte Struktur):', settings);
    
    return { 
      settings, 
      model_version: data.model_version || 'gpt-4-turbo',
      error: null 
    };
    
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden der CMO Einstellungen:', error);
    return { 
      settings: getMockCMOSettings(), 
      model_version: 'gpt-4-turbo',
      error 
    };
  }
};

export const saveCMOSettings = async (userId, agentId, settings, modelVersion = 'gpt-3.5-turbo') => {
  if (isUsingMock) {
    console.log('Mock-Modus: Würde CMO Einstellungen speichern', userId, agentId, settings);
    return { success: true };
  }
  
  try {
    console.log('=== CMO SPEICHERUNG START ===');
    console.log('Benutzer:', userId);
    console.log('Agent:', agentId);
    console.log('Eingehende Einstellungen (neue + alte Struktur):', JSON.stringify(settings, null, 2));
    
    // Prüfen, ob bereits Einstellungen existieren
    const { data: existingData, error: existingError } = await supabase
      .from('cmo_settings')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .limit(1);
    
    if (existingError) {
      console.error('Fehler beim Prüfen bestehender Daten:', existingError);
    }
    
    // DB-Settings mit neuer und alter Struktur
    const dbSettings = {
      // Neue 6-Tab-Struktur - direkt in eigene Spalten
      marketingfunktionen: settings.marketingfunktionen || {
        branding: true,
        contentMarketing: false,
        socialMedia: false,
        performanceMarketing: false,
        emailMarketing: false,
        influencerMarketing: false,
        launchKampagnen: false
      },
      
      zielgruppen: settings.zielgruppen || {
        zielgruppenbeschreibung: '',
        kundenprobleme: '',
        kaufmotive: { emotional: false, rational: false },
        entscheidungsdauer: '',
        zielgruppentyp: '',
        marktkenntnis: false
      },
      
      produktstatus: settings.produktstatus || {
        status: 'idee',
        produktTyp: { physisch: false, digital: false, coaching: false, hybrid: false },
        vertriebslogik: { ecommerce: false, preSale: false, leadFunnel: false, buchung: false, creatorAffiliate: false }
      },
      
      gotomarket: settings.gotomarket || {
        taktiken: {
          awareness: false, trustBuilding: false, leadGen: false, conversion: false,
          retention: false, preSaleFunnel: false, launchSequenzen: false, paidAds: false,
          influencerCodes: false, emailSerien: false
        }
      },
      
      erfolgsmetriken: settings.erfolgsmetriken || {
        primaereZielsetzung: 'reichweite',
        kpiFokus: {
          followerwachstum: false, linkKlicks: false, conversionRate: false,
          roiAds: false, emailOeffnungen: false, preSalesZiel: false
        },
        kommunikationsziel: ''
      },
      
      gruenderprofil: settings.gruenderprofil || {
        wunschrolle: 'thoughtLeader',
        persoenlicheKanaele: { linkedin: false, instagram: false, tiktok: false, youtube: false, podcast: false },
        sichtbarkeitsziele: { vertrauen: false, reichweite: false, autoritaet: false, networking: false },
        personalBrandingAnsatz: '',
        aktiveSichtbarkeit: false
      },
      
      // Alte Strukturen AUCH speichern für vollständige Kompatibilität
      identitaet: settings.identitaet || {},
      persoenlichkeit: settings.persoenlichkeit || {},
      systemprompts: settings.systemprompts || {},
      interaktion: settings.interaktion || {},
      contentformate: settings.contentformate || {},
      
      model_version: modelVersion,
      updated_at: new Date().toISOString()
    };
    
    console.log('Daten für DB aufbereitet (neue + alte Struktur):', JSON.stringify(dbSettings, null, 2));
    
    let result;
    
    if (existingData && existingData.length > 0) {
      console.log('Update bestehender Eintrag mit ID:', existingData[0].id);
      
      // Update vorhandene Einstellungen
      const { data, error } = await supabase
        .from('cmo_settings')
        .update(dbSettings)
        .eq('id', existingData[0].id)
        .select();
        
      result = { data, error };
    } else {
      console.log('Erstelle neuen Eintrag');
      
      // Erstelle neue Einstellungen
      const { data, error } = await supabase
        .from('cmo_settings')
        .insert({
          user_id: userId,
          agent_id: agentId,
          ...dbSettings
        })
        .select();
        
      result = { data, error };
    }
    
    if (result.error) {
      console.error('=== CMO SPEICHER-FEHLER ===');
      console.error('Fehler Details:', result.error);
      console.error('Fehler Code:', result.error.code);
      console.error('Fehler Message:', result.error.message);
      console.error('Fehler Hint:', result.error.hint);
      console.error('Fehler Details:', result.error.details);
      return { success: false, error: result.error };
    }
    
    console.log('=== CMO SPEICHERUNG ERFOLGREICH ===');
    console.log('Gespeicherte Daten:', result.data);
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error('=== UNERWARTETER CMO SPEICHER-FEHLER ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
};

export const getCOOSettings = async (userId, agentId = 'coo') => {
  console.log('Lade COO Einstellungen für Benutzer:', userId, 'und Agent:', agentId);
  
  if (isUsingMock) {
    return { 
      settings: getMockCOOSettings(), 
      model_version: 'gpt-4-turbo',
      error: null 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('coo_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Keine COO Einstellungen gefunden, verwende Standardwerte');
        return { 
          settings: getMockCOOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
      
      console.error('Fehler beim Laden der COO Einstellungen:', error);
      return { 
        settings: null, 
        model_version: 'gpt-4-turbo',
        error 
      };
    }
    
    console.log('COO Rohdaten aus DB:', data);
    
    // Neue 4-Tab-Struktur aus DB-Daten zusammenstellen
    const settings = {
      // Neue 4-Tab-Struktur - direkt aus DB-Spalten
      prozesseAblaeufe: data.prozesseAblaeufe || {
        prozesseUndWorkflows: ''
      },
      
      teamorganisation: data.teamorganisation || {
        teamgroesse: '',
        rollenbesetzung: '',
        fehlendeRollen: ''
      },
      
      zusammenarbeitSteuerung: data.zusammenarbeitSteuerung || {
        zusammenarbeitsmodell: '', // 'remote', 'hybrid', 'vorOrt'
        koordinationsstruktur: ''
      },
      
      engpaesseSchwaechen: data.engpaesseSchwaechen || {
        operativeProbleme: '',
        prozessluecken: ''
      },
      
      // System-Prompts (neue einheitliche Struktur)
      systemprompts: data.systemprompts || data.promptVorlagen || {
        systemPrompt: 'Du bist ein pragmatischer COO mit hohem Fokus auf Effizienz, Kommunikation und Ergebnisverantwortung. Du hinterfragst operative Strukturen und schaffst Umsetzungsklarheit.',
        begruessung: 'Hey! Was läuft gerade operativ am besten und wo hakt es am meisten?',
        fallback: 'Ich brauche mehr Kontext zur aktuellen operativen Situation, um dir konkrete Handlungsempfehlungen geben zu können.',
        reviewPrompt: 'Analysiere die Umsetzungsqualität und identifiziere Prozessbrüche, Rollenunklarheiten und Ineffizienzen.'
      },
      
      // Alte Strukturen VOLLSTÄNDIG beibehalten für Kompatibilität
      basisdaten: data.basisdaten || {},
      persoenlichkeit: data.persoenlichkeit || {},
      operationsFunktionen: data.operationsFunktionen || {},
      datenKontext: data.datenKontext || {},
      promptVorlagen: data.promptVorlagen || {},
      interaktion: data.interaktion || {}
    };
    
    console.log('COO Einstellungen verarbeitet (neue + alte Struktur):', settings);
    
    return { 
      settings, 
      model_version: data.model_version || 'gpt-4-turbo',
      error: null 
    };
    
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden der COO Einstellungen:', error);
    return { 
      settings: getMockCOOSettings(), 
      model_version: 'gpt-4-turbo',
      error 
    };
  }
};

export const saveCOOSettings = async (userId, agentId, settings, modelVersion = 'gpt-3.5-turbo') => {
  if (isUsingMock) {
    console.log('Mock-Modus: Würde COO Einstellungen speichern', userId, agentId, settings);
    return { success: true };
  }
  
  try {
    console.log('=== COO SPEICHERUNG START ===');
    console.log('Benutzer:', userId);
    console.log('Agent:', agentId);
    console.log('Eingehende Einstellungen (neue + alte Struktur):', JSON.stringify(settings, null, 2));
    
    // Prüfen, ob bereits Einstellungen existieren
    const { data: existingData, error: existingError } = await supabase
      .from('coo_settings')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .limit(1);
    
    if (existingError) {
      console.error('Fehler beim Prüfen bestehender COO Daten:', existingError);
    }
    
    // DB-Settings mit neuer und alter Struktur
    const dbSettings = {
      // Neue 4-Tab-Struktur - direkt in eigene Spalten
      prozesseAblaeufe: settings.prozesseAblaeufe || {
        prozesseUndWorkflows: ''
      },
      
      teamorganisation: settings.teamorganisation || {
        teamgroesse: '',
        rollenbesetzung: '',
        fehlendeRollen: ''
      },
      
      zusammenarbeitSteuerung: settings.zusammenarbeitSteuerung || {
        zusammenarbeitsmodell: '',
        koordinationsstruktur: ''
      },
      
      engpaesseSchwaechen: settings.engpaesseSchwaechen || {
        operativeProbleme: '',
        prozessluecken: ''
      },
      
      // System-Prompts (neue einheitliche Struktur)
      systemprompts: settings.systemprompts || {
        systemPrompt: 'Du bist ein pragmatischer COO mit hohem Fokus auf Effizienz, Kommunikation und Ergebnisverantwortung.',
        begruessung: 'Hey! Was läuft gerade operativ am besten und wo hakt es am meisten?',
        fallback: 'Ich brauche mehr Kontext zur aktuellen operativen Situation.',
        reviewPrompt: 'Analysiere die Umsetzungsqualität und identifiziere Ineffizienzen.'
      },
      
      // Alte Strukturen AUCH speichern für vollständige Kompatibilität
      basisdaten: settings.basisdaten || {},
      persoenlichkeit: settings.persoenlichkeit || {},
      operationsFunktionen: settings.operationsFunktionen || {},
      datenKontext: settings.datenKontext || {},
      promptVorlagen: settings.promptVorlagen || settings.systemprompts || {},
      interaktion: settings.interaktion || {},
      
      model_version: modelVersion,
      updated_at: new Date().toISOString()
    };
    
    console.log('COO Daten für DB aufbereitet (neue + alte Struktur):', JSON.stringify(dbSettings, null, 2));
    
    let result;
    
    if (existingData && existingData.length > 0) {
      console.log('Update bestehender COO Eintrag mit ID:', existingData[0].id);
      
      // Update vorhandene Einstellungen
      const { data, error } = await supabase
        .from('coo_settings')
        .update(dbSettings)
        .eq('id', existingData[0].id)
        .select();
        
      result = { data, error };
    } else {
      console.log('Erstelle neuen COO Eintrag');
      
      // Erstelle neue Einstellungen
      const { data, error } = await supabase
        .from('coo_settings')
        .insert({
          user_id: userId,
          agent_id: agentId,
          ...dbSettings
        })
        .select();
        
      result = { data, error };
    }
    
    if (result.error) {
      console.error('=== COO SPEICHER-FEHLER ===');
      console.error('Fehler Details:', result.error);
      console.error('Fehler Code:', result.error.code);
      console.error('Fehler Message:', result.error.message);
      console.error('Fehler Hint:', result.error.hint);
      console.error('Fehler Details:', result.error.details);
      return { success: false, error: result.error };
    }
    
    console.log('=== COO SPEICHERUNG ERFOLGREICH ===');
    console.log('Gespeicherte COO Daten:', result.data);
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error('=== UNERWARTETER COO SPEICHER-FEHLER ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
};
  

  export const getAgentSettings = async (agentId) => {
    console.log('Lade Einstellungen für Agent:', agentId);
    
    if (isUsingMock) {
      if (agentId === 'second-brain') {
        return { 
          settings: getMockSecondBrainSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'cfo') {
        return { 
          settings: getMockCFOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'cmo') {
        // AKTUALISIERT: Verwende neue CMO Mock-Daten
        return { 
          settings: getMockCMOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'coo') {
        return { 
          settings: getMockCOOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else {
        return { 
          settings: {}, 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
    }
    
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Je nach Agent-Typ die richtige Funktion verwenden
        if (agentId === 'second-brain') {
          return await getSecondBrainSettings(user.id, agentId);
        } else if (agentId === 'cfo') {
          return await getCFOSettings(user.id, agentId);
        } else if (agentId === 'cmo') {
          // AKTUALISIERT: Verwende neue getCMOSettings Funktion
          return await getCMOSettings(user.id, agentId);
        } else if (agentId === 'coo') {
          return await getCOOSettings(user.id, agentId);
        }
      }
      
      // Fallback zu Standard-Einstellungen
      console.log('Kein Benutzer gefunden oder unbekannter Agent-Typ, verwende Standardeinstellungen');
      
      if (agentId === 'second-brain') {
        return { 
          settings: getMockSecondBrainSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'cfo') {
        return { 
          settings: getMockCFOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'cmo') {
        // AKTUALISIERT: Verwende neue CMO Mock-Daten
        return { 
          settings: getMockCMOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else if (agentId === 'coo') {
        return { 
          settings: getMockCOOSettings(), 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      } else {
        return { 
          settings: {}, 
          model_version: 'gpt-4-turbo',
          error: null 
        };
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden der Agent-Einstellungen:', error);
      return { settings: null, model_version: 'gpt-4-turbo', error };
    }
  };

function getMockSecondBrainSettings() {
  return {
    // Neue 4-Tab-Struktur - exakt wie Frontend erwartet
    unternehmerprofil: {
      entscheidungsstil: '',
      risikobereitschaft: '',
      zeithorizont: '',
      gruenderTyp: ''
    },
    
    unternehmensausrichtung: {
      unternehmensart: '',
      phase: '',
      wachstumsstrategie: [],
      visionLangfristig: ''
    },
    
    fokusbereiche: {
      aktuellePrioritaet: [],
      entscheidendeHebel: '',
      abhaengigkeiten: ''
    },
    
    wettbewerb: {
      konkurrenzUmfeld: '',
      vorteileGegenueberWettbewerb: ''
    },
    
    // Alte Strukturen für vollständige Kompatibilität beibehalten
    identitaet: {
      name: 'Business Mentor',
      beschreibung: 'Erfahrener Geschäftsführer und lockerer Mentor für alle Businessfragen.',
      funktionsrollen: {
        strategischerMentor: true,
        geschaeftsfuehrer: true,
        unternehmensberater: true,
        innovationsCoach: true
      },
      profilbild: 'brain',
      sprachstil: 'lockerZugaenglich'
    },
    
    persoenlichkeit: {
      empathie: 7,
      kreativitaet: 8,
      stabilitaet: 9,
      selbstsicherheit: 8,
      tonfaelle: {
        beratend: true,
        inspirierend: true,
        unterstuetzend: true
      },
      gespraechsfuehrung: 'proaktiv',
      kommunikationsbeispiel: 'Hey, lass uns mal direkt darüber sprechen, was dich gerade bremst. Aus meiner Erfahrung gibt\'s da drei Ansätze, die wirklich funktionieren. Was meinst du dazu?'
    },
    
    fachlicheAusrichtung: {
      visionZieleRichtung: true,
      entscheidungenReflektieren: true,
      mindsetFokusSelbstfuehrung: false,
      strategieIdeenPrioritaeten: true,
      zweifelBlockadenWiderstaende: false,
      freiesSparring: true
    },
    
    unternehmenskontext: {
      visionZielbild: '',
      geschaeftsmodellAngebote: '',
      zielgruppenMaerkte: '',
      persoenlicheRolleFuehrungsstil: '',
      problemeRisiken: ''
    },
    
    systemprompts: {
      systemPrompt: 'Du verkörperst einen erfahrenen Geschäftsführer und Business-Mentor mit umfangreicher Praxiserfahrung in verschiedenen Branchen. Dein Kommunikationsstil ist authentisch, locker, direkt und pragmatisch. Du gibst rationale Informationen und wertvolle Tipps, basierend auf deinem breiten Wissen und deiner langjährigen Erfahrung. Als Mentor sprichst du auf Augenhöhe und bist bereit, auch konstruktiv kritisch zu sein, wenn es dem Geschäftserfolg dient. Verwende anschauliche Beispiele und praxisnahe Ratschläge statt theoretischer Abhandlungen.',
      begruessung: '', 
      fallback: '',
      auditPrompt: ''
    },
    
    reflexionsfokus: {
      zieleRichtung: {
        reflexionsmodus: 'visionaerDenken'
      },
      entscheidungen: {
        proContraBasiert: true,
        erfahrungsWertbasiert: false,
        risikoSzenarienOrientiert: false
      },
      mindset: {
        fokusbereich: 'fokusStaerken'
      },
      strategie: {
        arbeitsmodus: 'strukturierterFilter'
      },
      blockaden: {
        klaerungsmodus: 'ursacheAnalysieren'
      },
      sparring: {
        sparringStil: 'strukturiert'
      }
    }
  };
}

function getMockCFOSettings() {
  return {
    // Neue 5-Tab-Struktur - exakt wie Frontend erwartet
    kapitalFinanzierung: {
      finanzierungsstatus: '',
      runwayInMonaten: '',
      burnRateMonatlich: ''
    },
    
    einnahmenmodell: {
      umsatzmodell: '',
      wiederkehrendeUmsaetze: '',
      monatlicherUmsatz: ''
    },
    
    kostenstruktur: {
      hauptkostenarten: '',
      outsourcingQuote: ''
    },
    
    finanzplanungTools: {
      finanzplanVorhanden: '',
      buchhaltungstool: ''
    },
    
    skalierungsoption: {
      skalierungsausFinanzsicht: ''
    },
    
    // System-Prompts (neue einheitliche Struktur)
    systemprompts: {
      systemPrompt: 'Du bist ein analytisch denkender CFO mit einem klaren Blick auf Zahlen, Liquidität und finanzielle Risiken. Du bewertest jede Maßnahme hinsichtlich Cash-Impact, Renditepotenzial und Planungssicherheit.',
      begruessung: 'Gib mir bitte eine schnelle Einschätzung zur aktuellen finanziellen Lage – was ist kritisch?',
      fallback: 'Bitte lade die letzten Finanzdaten hoch oder beschreibe die wichtigsten Kennzahlen, damit ich valide Entscheidungen ableiten kann.',
      krisenPrompt: 'Bewerte das Überleben des Unternehmens bei 30% Umsatzrückgang in den nächsten 3 Monaten.'
    },
    
    // Alte Strukturen für vollständige Kompatibilität beibehalten
    identitaet: {
      name: 'CFO Assistant',
      kurzbeschreibung: 'Dein persönlicher CFO für Finanzfragen',
      rolle: 'Financial Controller',
      sprachstil: ['praezise_sachlich', 'ergebnisorientiert']
    },
    
    persoenlichkeit: {
      risikotoleranz: 4,
      analysefokus: 5,
      kommunikationsklarheit: 6,
      ueberzeugungskraft: 5,
      tonfall: ['kontrollierend', 'faktenbasiert'],
      gespraechsfuehrung: ['rueckspiegelnd', 'prognostisch'],
      textvorschau: ''
    },
    
    finanzFunktionen: {
      zustaendigkeitsbereiche: {
        liquiditaetsplanung: true,
        budgetierung: true,
        finanzreporting: false,
        investitionsplanung: false,
        steueroptimierung: false,
        preisstrategien: false,
        investorenvorbereitung: false
      },
      rechenFaehigkeiten: {
        tabellenausgaben: true,
        forecastModelle: true,
        kennzahlenAbleitung: 7,
        empfehlungen: true
      },
      entscheidungslogik: ['sicherheitVorWachstum', 'liquiditaetVorBilanzstabilitaet']
    },
    
    unternehmensKontext: {
      rechtsform: '',
      umsatzKosten: '',
      engpaesse: '',
      investitionsplaene: '',
      finanzgeber: '',
      kpis: '',
      waehrung: 'EUR'
    },
    
    systemPrompts: {
      systemPrompt: 'Du bist ein analytisch denkender CFO mit einem klaren Blick auf Zahlen, Liquidität und finanzielle Risiken.',
      begruessung: 'Gib mir bitte eine schnelle Einschätzung zur aktuellen finanziellen Lage – was ist kritisch?',
      fallback: 'Bitte lade die letzten Finanzdaten hoch oder beschreibe die wichtigsten Kennzahlen, damit ich valide Entscheidungen ableiten kann.',
      krisenPrompt: ''
    },
    
    interaktion: {
      antwortformat: ['zahlenbasierteArgumentation'],
      antwortlaenge: 'mittel',
      adaptiveReaktionstiefe: true,
      monitoringFrequenz: 'monatlich',
      alertsGenerieren: true
    }
  };
}

// Hilfsfunktion für Mock-Modus: Standard-Einstellungen für CMO
function getMockCMOSettings() {
  return {
    // Neue 6-Tab-Struktur - exakt wie Frontend erwartet
    marketingfunktionen: {
      branding: true,
      contentMarketing: false,
      socialMedia: false,
      performanceMarketing: false,
      emailMarketing: false,
      influencerMarketing: false,
      launchKampagnen: false
    },
    
    zielgruppen: {
      zielgruppenbeschreibung: '',
      kundenprobleme: '',
      kaufmotive: { emotional: false, rational: false },
      entscheidungsdauer: '',
      zielgruppentyp: '',
      marktkenntnis: false
    },
    
    produktstatus: {
      status: 'idee',
      produktTyp: { physisch: false, digital: false, coaching: false, hybrid: false },
      vertriebslogik: { ecommerce: false, preSale: false, leadFunnel: false, buchung: false, creatorAffiliate: false }
    },
    
    gotomarket: {
      taktiken: {
        awareness: false, trustBuilding: false, leadGen: false, conversion: false,
        retention: false, preSaleFunnel: false, launchSequenzen: false, paidAds: false,
        influencerCodes: false, emailSerien: false
      }
    },
    
    erfolgsmetriken: {
      primaereZielsetzung: 'reichweite',
      kpiFokus: {
        followerwachstum: false, linkKlicks: false, conversionRate: false,
        roiAds: false, emailOeffnungen: false, preSalesZiel: false
      },
      kommunikationsziel: ''
    },
    
    gruenderprofil: {
      wunschrolle: 'thoughtLeader',
      persoenlicheKanaele: { linkedin: false, instagram: false, tiktok: false, youtube: false, podcast: false },
      sichtbarkeitsziele: { vertrauen: false, reichweite: false, autoritaet: false, networking: false },
      personalBrandingAnsatz: '',
      aktiveSichtbarkeit: false
    },
    
    // Alte Strukturen für vollständige Kompatibilität beibehalten
    identitaet: {
      name: 'Marketing Assistent',
      beschreibung: 'Dein persönlicher Assistent für Marketing',
      rolle: 'Performance-Marketing Leiter',
      profilbild: 'default',
      sprachniveau: 'locker',
      slogan: 'Marketing-Strategie & Kampagnen'
    },
    
    persoenlichkeit: {
      tonalitaet: 'inspirierend',
      detailtiefe: 3,
      persuasionslevel: 3,
      kreativitaet: 80,
      empathieAnalytik: 60
    },
    
    systemprompts: {
      systemPrompt: 'Du bist ein freundschaftlicher, lockerer CMO. Kommuniziere verständlich und auf Augenhöhe, aber mit Marketing-Expertise.',
      kampagnenBriefing: '',
      fallback: 'Ich bräuchte noch ein paar Details zu deiner Zielgruppe, um besser zu helfen.',
      begruessung: 'Hey! Wie kann ich heute deine Marketing-Strategie verbessern?',
      auditPrompt: 'Lass uns gemeinsam deine Zielgruppenannahmen überprüfen.'
    },
    
    interaktion: {
      followUp: true,
      maxAntwortlaenge: 500,
      antwortformat: 'fliesstext',
      ctaEmpfehlungen: true,
      aufgabenErstellung: false,
      aktiveBeratung: true
    },
    
    contentformate: {}
  };
}

// Mock-Daten für COO mit neuer 3-Tab-Struktur
function getMockCOOSettings() {
  return {
    // Neue 4-Tab-Struktur - exakt wie Frontend erwartet
    prozesseAblaeufe: {
      prozesseUndWorkflows: ''
    },
    
    teamorganisation: {
      teamgroesse: '',
      rollenbesetzung: '',
      fehlendeRollen: ''
    },
    
    zusammenarbeitSteuerung: {
      zusammenarbeitsmodell: '', // 'remote', 'hybrid', 'vorOrt'
      koordinationsstruktur: ''
    },
    
    engpaesseSchwaechen: {
      operativeProbleme: '',
      prozessluecken: ''
    },
    
    // System-Prompts (neue einheitliche Struktur)
    systemprompts: {
      systemPrompt: 'Du bist ein pragmatischer COO mit hohem Fokus auf Effizienz, Kommunikation und Ergebnisverantwortung. Du hinterfragst operative Strukturen und schaffst Umsetzungsklarheit.',
      begruessung: 'Hey! Was läuft gerade operativ am besten und wo hakt es am meisten?',
      fallback: 'Ich brauche mehr Kontext zur aktuellen operativen Situation, um dir konkrete Handlungsempfehlungen geben zu können.',
      reviewPrompt: 'Analysiere die Umsetzungsqualität und identifiziere Prozessbrüche, Rollenunklarheiten und Ineffizienzen.'
    },
    
    // Alte Strukturen für vollständige Kompatibilität beibehalten
    basisdaten: {
      name: 'Operations Assistent',
      beschreibung: 'Dein persönlicher Assistent für Prozessoptimierung',
      rolle: 'Prozessoptimierer',
      profilbild: 'default',
      sprachniveau: 'professionell'
    },
    
    persoenlichkeit: {
      empathie: 5,
      strukturOrientierung: 7,
      umsetzungsfokus: 8,
      fuehrungshaltung: 6,
      tonfall: {
        zielorientiert: true,
        sachlich: true,
        loesungsgetrieben: true,
        feedbackorientiert: false,
        unterstuetzendFordernd: false,
        ergebnisgetrieben: true
      },
      gespraechsfuehrung: 'strukturiert',
      textBeispiel: 'Was genau verhindert gerade, dass dieser Prozess sauber läuft? Wo ist der Engpass?'
    },
    
    operationsFunktionen: {
      cooPrimaryFunctions: {
        tagesgeschaeft: true,
        prozessOptimierung: true,
        kpiTracking: false,
        teamKommunikation: false,
        problemLoesungen: true
      },
      cooPrioritization: 'dringlichkeitsbasiert',
      cooOptimizationGoal: 'effizienz'
    },
    
    datenKontext: {
      prozessdaten: '',
      tools: '',
      engpaesse: '',
      teamGroesse: '',
      schluesselMetriken: '',
      uploadedFiles: []
    },
    
    promptVorlagen: {
      systemPrompt: 'Du bist ein freundschaftlicher, lockerer COO.',
      auditCheckliste: '',
      fallback: 'Um dir besser bei den Prozessen zu helfen, bräuchte ich noch ein paar Details.',
      begruessung: 'Hey! Wie kann ich dir heute bei der Optimierung deiner Abläufe helfen?',
      auditPrompt: 'Lass uns gemeinsam die Prozesse überprüfen:'
    },
    
    interaktion: {
      antwortStil: 'analytischMitMassnahmen',
      reaktionsVerhalten: 'proaktivProbleme',
      antwortformat: 'gliederung',
      antwortlaenge: 'mittel',
      adaptivesVerhalten: true,
      eingriffsfrequenz: 'reaktiv',
      followUp: true,
      maxAntwortlaenge: 500,
      todoErstellung: true,
      prozessdiagramme: false,
      aktiveBeratung: true
    }
  };
}

// AKTUALISIERTE getMockSettings Hilfsfunktion 
function getMockSettings(agentId) {
  switch(agentId) {
    case 'second-brain':
      return getMockSecondBrainSettings();
    case 'cmo':
      return getMockCMOSettings(); // AKTUALISIERT: Neue 6-Tab-Struktur
    case 'cfo':
      return getMockCFOSettings();
    case 'coo':
      return getMockCOOSettings();
    default:
      return {};
  }
}

// Authentifizierungsfunktionen
export const signIn = async ({ email, password }) => {
  if (isUsingMock) {
    return { 
      data: { 
        user: { id: 'mock-user-id', email }, 
        session: { access_token: 'mock-token' } 
      }, 
      error: null 
    };
  }
  
  try {
    return await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
  } catch (error) {
    console.error('Anmeldefehler:', error);
    return { data: null, error };
  }
};

export const signUp = async ({ email, password, metadata = {} }) => {
  if (isUsingMock) {
    return { 
      data: { 
        user: { id: 'mock-user-id', email }, 
        session: { access_token: 'mock-token' } 
      }, 
      error: null 
    };
  }
  
  try {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin + '/auth/callback'
      }
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  if (isUsingMock) return { error: null };
  
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('Abmeldefehler:', error);
    return { error };
  }
};

// Vereinfachte getCurrentUser Funktion
export const getCurrentUser = async () => {
  if (isUsingMock) {
    return null; // Im Mock-Modus gibt es keinen User
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Supabase getSession Fehler:', error);
      return null;
    }
    
    return data?.session?.user || null;
  } catch (err) {
    console.error('getCurrentUser Fehler:', err);
    return null;
  }
};
export const createConversation = async (userId, agentId, title = '') => {
  if (isUsingMock) {
    return { 
      conversation: { 
        id: 'mock-conversation-id', 
        user_id: userId, 
        agent_id: agentId,
        title: title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 
      error: null 
    };
  }
  
  try {
    console.log('Erstelle neue Konversation:', { userId, agentId, title });
    
    const timestamp = new Date().toISOString();
    
    const conversationData = { 
      user_id: userId,
      agent_id: agentId,
      title: title || `Gespräch mit ${agentId}`,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([conversationData])
      .select();
    
    if (error) {
      console.error('Fehler beim Erstellen der Konversation:', error);
      return { conversation: null, error };
    }
    
    console.log('Konversation erfolgreich erstellt:', data[0]);
    return { conversation: data[0], error: null };
  } catch (error) {
    console.error('Fehler beim Erstellen der Konversation:', error);
    return { conversation: null, error };
  }
};

/**
 * Fügt eine Nachricht zu einer Konversation hinzu und aktualisiert den updated_at Zeitstempel
 * @param {string} conversationId - Die ID der Konversation
 * @param {string} senderType - Der Typ des Absenders (user, agent, system)
 * @param {string} content - Der Inhalt der Nachricht
 * @returns {Promise<{message: Object|null, error: Error|null}>}
 */
export const addMessage = async (conversationId, senderType, content) => {
  if (isUsingMock) {
    return { 
      message: {
        id: 'mock-message-id',
        conversation_id: conversationId,
        sender_type: senderType,
        content: content,
        timestamp: new Date().toISOString()
      }, 
      error: null 
    };
  }
  
  try {
    console.log('Füge Nachricht hinzu:', { conversationId, senderType, contentLength: content?.length || 0 });
    
    // Aktualisiere den updated_at Zeitstempel der Konversation separat
    const timestamp = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: timestamp })
      .eq('id', conversationId);
    
    if (updateError) {
      console.error('Fehler beim Aktualisieren des Konversation-Zeitstempels:', updateError);
      // Trotzdem weitermachen und versuchen, die Nachricht zu speichern
    }
    
    // Füge die Nachricht hinzu
    const messageData = {
      conversation_id: conversationId,
      sender_type: senderType,
      content: content,
      timestamp: timestamp
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select();
    
    if (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
      return { message: null, error };
    }
    
    console.log('Nachricht erfolgreich hinzugefügt');
    return { message: data[0], error: null };
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Nachricht:', error);
    return { message: null, error };
  }
};

/**
 * Ruft alle Nachrichten einer Konversation ab
 * @param {string} conversationId - Die ID der Konversation
 * @returns {Promise<{messages: Array|null, error: Error|null}>}
 */
export const getMessagesByConversationId = async (conversationId) => {
  if (isUsingMock) {
    return { 
      messages: [
        {
          sender_type: 'agent',
          content: 'Hallo, wie kann ich dir helfen?',
          timestamp: new Date(Date.now() - 60000).toISOString() // 1 Minute ago
        }
      ], 
      error: null 
    };
  }
  
  try {
    console.log('Lade Nachrichten für Konversation:', conversationId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
      return { messages: null, error };
    }
    
    // Formatiere die Nachrichten für die Verwendung in der UI
    const formattedMessages = data.map(message => ({
      sender_type: message.sender_type,
      content: message.content,
      timestamp: message.timestamp,
    }));
    
    console.log(`${formattedMessages.length} Nachrichten geladen`);
    return { messages: formattedMessages, error: null };
  } catch (error) {
    console.error('Fehler beim Laden der Nachrichten:', error);
    return { messages: null, error };
  }
};

/**
 * Ruft eine Konversation anhand ihrer ID ab
 * @param {string} conversationId - Die ID der Konversation
 * @returns {Promise<{conversation: Object|null, error: Error|null}>}
 */
export const getConversationById = async (conversationId) => {
  if (isUsingMock) {
    return { 
      conversation: {
        id: conversationId,
        title: 'Mock Konversation',
        user_id: 'mock-user-id',
        agent_id: 'second-brain',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updated_at: new Date().toISOString(),
        agent: {
          id: 'second-brain',
          title: 'AI',
          full_title: 'Dein zweites Gehirn',
          color: 'bg-blue-600'
        }
      }, 
      error: null 
    };
  }
  
  try {
    console.log('Lade Konversation:', conversationId);
    
    // Zuerst die Konversation selbst laden
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (conversationError) {
      console.error('Fehler beim Laden der Konversation:', conversationError);
      return { conversation: null, error: conversationError };
    }
    
    // Dann die Agent-Informationen laden
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', conversationData.agent_id)
      .single();
    
    if (agentError) {
      console.warn('Fehler beim Laden des Agenten:', agentError);
      // Wir können trotzdem weitermachen, Agent-Informationen sind nicht kritisch
    }
    
    // Kombiniere die Daten
    const conversation = {
      ...conversationData,
      agent: agentData || null
    };
    
    console.log('Konversation geladen:', conversation);
    return { conversation, error: null };
  } catch (error) {
    console.error('Fehler beim Laden der Konversation:', error);
    return { conversation: null, error };
  }
};

/**
 * Ruft die zuletzt aktiven Konversationen eines Benutzers ab
 * @param {string} userId - Die ID des Benutzers
 * @param {number} limit - Die maximale Anzahl von abzurufenden Konversationen
 * @returns {Promise<{conversations: Array|null, error: Error|null}>}
 */
export const getRecentConversationsByUserId = async (userId, limit = 5) => {
  if (isUsingMock) {
    return { 
      conversations: [
        {
          id: 'mock-conversation-1',
          title: 'Gespräch mit Second Brain',
          agent_id: 'second-brain',
          updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          agent: {
            id: 'second-brain',
            title: 'AI',
            full_title: 'Dein zweites Gehirn',
            color: 'bg-blue-600'
          }
        },
        {
          id: 'mock-conversation-2',
          title: 'Gespräch mit Marketing-Assistent',
          agent_id: 'cmo',
          updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          agent: {
            id: 'cmo',
            title: 'CMO',
            full_title: 'Chief Marketing Officer',
            color: 'bg-purple-600'
          }
        }
      ], 
      error: null 
    };
  }
  
  try {
    console.log('Lade kürzliche Konversationen für Benutzer:', userId);
    
    // Zuerst nur die Konversationen laden (ohne verschachtelte Abfrage)
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (conversationsError) {
      console.error('Fehler beim Laden der Konversationen:', conversationsError);
      return { conversations: null, error: conversationsError };
    }

    if (!conversationsData || conversationsData.length === 0) {
      console.log('Keine Konversationen gefunden');
      return { conversations: [], error: null };
    }
    
    // Für jede Konversation die Agent-Informationen laden
    const conversationsWithAgents = await Promise.all(conversationsData.map(async (conv) => {
      try {
        // Agent-Informationen laden
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', conv.agent_id)
          .single();
        
        if (agentError) {
          console.warn('Fehler beim Laden des Agenten für Konversation:', conv.id, agentError);
          return { ...conv, agent: null };
        }
        
        return { ...conv, agent: agentData };
      } catch (err) {
        console.error('Fehler beim Laden der Agent-Informationen:', err);
        return { ...conv, agent: null };
      }
    }));
    
    // Für jede Konversation die letzte Nachricht laden
    const enhancedConversations = await Promise.all(conversationsWithAgents.map(async (conv) => {
      try {
        // Letzte Nachricht laden
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('timestamp', { ascending: false })
          .limit(1);
        
        if (messagesError) {
          console.warn('Fehler beim Laden der Nachrichten für Konversation:', conv.id, messagesError);
          return { ...conv, lastMessage: null, hasUserMessages: false };
        }
        
        // Prüfen, ob Benutzernachrichten vorhanden sind
        const { count: userMessagesCount, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_type', 'user');
        
        const hasUserMessages = userMessagesCount > 0;
        
        return {
          ...conv,
          lastMessage: messagesData && messagesData.length > 0 ? messagesData[0] : null,
          hasUserMessages
        };
      } catch (err) {
        console.error('Fehler beim Laden der Nachrichten:', err);
        return { ...conv, lastMessage: null, hasUserMessages: false };
      }
    }));
    
    // Filtere Konversationen, in denen mindestens eine Benutzer-Nachricht vorhanden ist
    const conversationsWithUserMessages = enhancedConversations.filter(conv => conv.hasUserMessages);
    
    console.log(`${conversationsWithUserMessages.length} Konversationen mit Benutzernachrichten geladen`);
    return { conversations: conversationsWithUserMessages, error: null };
  } catch (error) {
    console.error('Fehler beim Laden der Konversationen:', error);
    return { conversations: null, error };
  }
};

/**
 * Aktualisiert den Titel einer Konversation
 * @param {string} conversationId - Die ID der Konversation
 * @param {string} newTitle - Der neue Titel
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const updateConversationTitle = async (conversationId, newTitle) => {
  if (isUsingMock) {
    return { success: true, error: null };
  }
  
  try {
    console.log('Aktualisiere Konversationstitel:', { conversationId, newTitle });
    
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (error) {
      console.error('Fehler beim Aktualisieren des Konversationstitels:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Konversationstitels:', error);
    return { success: false, error };
  }
};

/**
 * Löscht eine Konversation und alle zugehörigen Nachrichten
 * @param {string} conversationId - Die ID der zu löschenden Konversation
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const deleteConversation = async (conversationId) => {
  if (isUsingMock) {
    return { success: true, error: null };
  }
  
  try {
    console.log('Lösche Konversation:', conversationId);
    
    // Lösche zuerst alle Nachrichten der Konversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (messagesError) {
      console.error('Fehler beim Löschen der Nachrichten:', messagesError);
      return { success: false, error: messagesError };
    }
    
    // Lösche dann die Konversation selbst
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (conversationError) {
      console.error('Fehler beim Löschen der Konversation:', conversationError);
      return { success: false, error: conversationError };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Fehler beim Löschen der Konversation:', error);
    return { success: false, error };
  }
};

// Aufgaben-Funktionen
export const getTasks = async (filters = {}) => {
  if (isUsingMock) {
    // Statische Beispieldaten zurückgeben
    return [
      { 
        id: 1, 
        title: 'Dashboard Design überarbeiten', 
        status: 'completed', 
        assignee: 'Anna M.', 
        due_date: '2025-04-15',
        created_by: 'second-brain',
        description: 'Das Dashboard-Design muss überarbeitet werden, um die neue CI zu berücksichtigen.'
      },
      { 
        id: 2, 
        title: 'Frontend-Tests implementieren', 
        status: 'in-progress', 
        assignee: 'Markus L.', 
        due_date: '2025-04-20',
        created_by: 'cmo',
        description: 'Implementierung von Unit- und Integrationstests für die Frontend-Komponenten.'
      },
      { 
        id: 3, 
        title: 'Supabase Integration', 
        status: 'pending', 
        assignee: 'Sarah K.', 
        due_date: '2025-04-25',
        created_by: 'coo',
        description: 'Integration der Supabase-Datenbank in die bestehende Anwendung.'
      }
    ];
  }
  
  try {
    console.log('Lade Aufgaben mit Filtern:', filters);
    
    // Vereinfachte Abfrage mit besserer Stabilität
    let query = supabase
      .from('tasks')
      .select('*');
    
    // Wenn creator_id gesetzt ist, filtern wir danach
    if (filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }
    
    // Status-Filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Assignee-Filter
    if (filters.assignee && filters.assignee !== 'all') {
      query = query.eq('assignee', filters.assignee);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
      throw error;
    }
    
    // Nach dem Abrufen der Basisdaten, holen wir zugehörige Informationen
    const enhancedTasks = await Promise.all((data || []).map(async (task) => {
      let enhancedTask = { ...task };
      
      // Profilinformationen für Assignee holen, falls vorhanden
      if (task.assignee) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', task.assignee)
            .single();
            
          if (profileData) {
            enhancedTask.profiles = profileData;
          }
        } catch (profileErr) {
          console.warn('Fehler beim Laden des Profils:', profileErr);
        }
      }
      
      // Creator-Informationen holen
      if (task.creator_id) {
        try {
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', task.creator_id)
            .single();
            
          if (creatorData) {
            enhancedTask.creator = creatorData;
          }
        } catch (creatorErr) {
          console.warn('Fehler beim Laden des Erstellers:', creatorErr);
        }
      }
      
      // Projektinformationen holen
      if (task.project_id) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', task.project_id)
            .single();
            
          if (projectData) {
            enhancedTask.projects = projectData;
          }
        } catch (projectErr) {
          console.warn('Fehler beim Laden des Projekts:', projectErr);
        }
      }
      
      return enhancedTask;
    }));
    
    console.log('Geladene Aufgaben:', enhancedTasks.length);
    return enhancedTasks;
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error);
    throw error;
  }
};

// Verbesserte Funktion zum Laden von Aufgaben für einen bestimmten Benutzer
export const getUserTasks = async (userId, filters = { status: 'all', assignee: 'all' }) => {
  if (isUsingMock) {
    return [
      { 
        id: 1, 
        title: 'Dashboard Design überarbeiten', 
        status: 'completed', 
        assignee: userId,
        due_date: '2025-04-15',
        creator_id: userId,
        description: 'Das Dashboard-Design muss überarbeitet werden, um die neue CI zu berücksichtigen.'
      },
      { 
        id: 2, 
        title: 'Frontend-Tests implementieren', 
        status: 'in-progress', 
        assignee: 'employee-123',
        due_date: '2025-04-20',
        creator_id: userId,
        description: 'Implementierung von Unit- und Integrationstests für die Frontend-Komponenten.'
      }
    ];
  }
  
  try {
    console.log('Lade Aufgaben für Benutzer:', userId);
    
    // Vereinfachte Abfrage
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('creator_id', userId);
    
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.assignee !== 'all') {
      query = query.eq('assignee', filters.assignee);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
      throw error;
    }
    
    // Nach dem Laden der Basisdaten führen wir separate Abfragen für zusätzliche Details durch
    const enhancedTasks = await Promise.all((data || []).map(async (task) => {
      let enhancedTask = { ...task };
      
      // Profilinformationen für Assignee holen
      if (task.assignee) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', task.assignee)
            .single();
            
          if (profileData) {
            enhancedTask.profiles = profileData;
          }
        } catch (profileErr) {
          console.warn('Fehler beim Laden des Profils:', profileErr);
        }
      }
      
      // Projektinformationen holen
      if (task.project_id) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', task.project_id)
            .single();
            
          if (projectData) {
            enhancedTask.projects = projectData;
          }
        } catch (projectErr) {
          console.warn('Fehler beim Laden des Projekts:', projectErr);
        }
      }
      
      return enhancedTask;
    }));
    
    console.log('Geladene Aufgaben:', enhancedTasks);
    return enhancedTasks;
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error);
    throw error;
  }
};

// Funktion zum Laden aller verfügbaren Zuweisungen für Aufgaben
export const getAvailableAssignees = async (userId) => {
  if (isUsingMock) {
    return [
      { id: userId, name: 'Ich selbst', isSelf: true },
      { id: 'emp-1', name: 'Anna M.', isSelf: false },
      { id: 'emp-2', name: 'Markus L.', isSelf: false }
    ];
  }
  
  try {
    console.log('Lade verfügbare Zuweisungen für Benutzer:', userId);
    
    // 1. Eigenes Profil laden
    const { data: ownProfile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single();
    
    // 2. Mitarbeiter laden, die diesem Benutzer zugeordnet sind - vereinfachte Abfrage
    const { data: employeesData } = await supabase
      .from('employees')
      .select('id, email, status')
      .eq('main_account_id', userId)
      .eq('status', 'Aktiv');
    
    // 3. Verfügbare Zuweisungen zusammenstellen
    const assignees = [];
    
    // Sich selbst hinzufügen
    if (ownProfile) {
      assignees.push({
        id: ownProfile.id,
        name: `${ownProfile.first_name || ''} ${ownProfile.last_name || ''}`.trim() || 'Ich',
        isSelf: true
      });
    } else {
      // Fallback wenn kein Profil geladen wurde
      assignees.push({
        id: userId,
        name: 'Ich selbst',
        isSelf: true
      });
    }
    
    // Mitarbeiter hinzufügen - separate Profilabrufe für bessere Stabilität
    if (employeesData && employeesData.length > 0) {
      for (const emp of employeesData) {
        try {
          const { data: empProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', emp.id)
            .single();
          
          const empName = empProfile 
            ? `${empProfile.first_name || ''} ${empProfile.last_name || ''}`.trim() 
            : '';
            
          assignees.push({
            id: emp.id,
            name: empName || emp.email || 'Mitarbeiter',
            email: emp.email,
            isSelf: false
          });
        } catch (profileErr) {
          console.warn('Fehler beim Laden des Mitarbeiterprofils:', profileErr);
          // Trotzdem mit Fallback-Infos hinzufügen
          assignees.push({
            id: emp.id,
            name: emp.email || 'Mitarbeiter',
            email: emp.email,
            isSelf: false
          });
        }
      }
    }
    
    console.log('Verfügbare Zuweisungen:', assignees);
    return assignees;
  } catch (error) {
    console.error('Fehler beim Laden der verfügbaren Zuweisungen:', error);
    // Fallback - mindestens sich selbst zurückgeben
    return [{ id: userId, name: 'Ich selbst', isSelf: true }];
  }
};

// Verbesserte Aufgabenerstellung mit korrekter Datumsformatierung
export const createTask = async (taskData) => {
  if (isUsingMock) {
    return { 
      id: Math.floor(Math.random() * 1000),
      title: taskData.title,
      description: taskData.description,
      assignee: taskData.assignee,
      due_date: taskData.dueDate,
      created_by: taskData.createdBy || taskData.creator_id,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
  
  try {
    console.log('Erstelle Aufgabe mit Daten:', taskData);
    
    // Korrigierte Datumsformatierung
    let formattedDate;
    try {
      const dueDate = new Date(taskData.dueDate || taskData.due_date);
      // Format: YYYY-MM-DD
      formattedDate = dueDate.toISOString().split('T')[0];
    } catch (dateErr) {
      console.error('Ungültiges Datumsformat:', dateErr);
      throw new Error('Ungültiges Datumsformat für due_date');
    }
    
    const taskToInsert = {
      title: taskData.title,
      description: taskData.description,
      assignee: taskData.assignee,
      due_date: formattedDate,
      project_id: taskData.project || taskData.project_id || null,
      creator_id: taskData.creator_id || taskData.createdBy,
      status: 'pending'
    };
    
    console.log('Zu speicherndes Task-Objekt:', taskToInsert);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskToInsert])
      .select();
    
    if (error) {
      console.error('Fehler beim Erstellen der Aufgabe:', error);
      throw error;
    }
    
    console.log('Aufgabe erfolgreich erstellt:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error);
    throw error;
  }
};

// Aktualisierung des Aufgabenstatus
export const updateTaskStatus = async (taskId, status) => {
  if (isUsingMock) {
    return { 
      id: taskId,
      status
    };
  }
  
  try {
    console.log('Aktualisiere Aufgabenstatus:', taskId, status);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      throw error;
    }
    
    console.log('Status erfolgreich aktualisiert:', data);
    return data[0];
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    throw error;
  }
};

// Aufgabe löschen
export const deleteUserTask = async (taskId) => {
  if (isUsingMock) return true;
  
  try {
    console.log('Lösche Aufgabe:', taskId);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      throw error;
    }
    
    console.log('Aufgabe erfolgreich gelöscht');
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error);
    throw error;
  }
};

// Mitarbeiter-Funktionen mit verbesserter Profilabruflogik (überarbeitet für neue Struktur)
export const getEmployees = async (userId = null) => {
  if (isUsingMock) {
    // Statische Beispieldaten zurückgeben
    return [
      { id: 1, name: 'Anna M.' },
      { id: 2, name: 'Markus L.' },
      { id: 3, name: 'Sarah K.' },
      { id: 4, name: 'Thomas B.' },
      { id: 5, name: 'Julia R.' },
      { id: 6, name: 'Michael W.' },
      { id: 7, name: 'Lisa S.' }
    ];
  }
  
  try {
    // GEÄNDERT: Jetzt verwenden wir die profiles-Tabelle mit employee_id Filter
    if (!userId) {
      console.error('Keine Benutzer-ID angegeben');
      return [];
    }
    
    console.log('Lade Mitarbeiter für Benutzer-ID:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at, auth.users(email)')
      .eq('employee_id', userId);
    
    if (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
      throw error;
    }
    
    console.log('Geladene Mitarbeiter:', data);
    
    // Verarbeite die Daten in das erwartete Format
    if (data && data.length > 0) {
      return data.map(emp => {
        return {
          id: emp.id,
          firstName: emp.first_name || '',
          lastName: emp.last_name || '',
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Kein Name',
          email: emp.users?.email || '',
          role: 'Mitarbeiter', // Standard-Rolle, kann später angepasst werden
          created_at: emp.created_at ? new Date(emp.created_at).toLocaleDateString('de-DE') : '-'
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Mitarbeiter:', error);
    
    // Fallback zu statischen Daten im Fehlerfall
    return [
      { id: 1, name: 'Anna M.' },
      { id: 2, name: 'Markus L.' },
      { id: 3, name: 'Sarah K.' }
    ];
  }
};

// Profil-Funktionen
export const getUserProfile = async (userId) => {
  if (isUsingMock) {
    return {
      id: userId || 'mock-user-id',
      first_name: 'Max',
      last_name: 'Mustermann',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Fehler beim Laden des Profils:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden des Profils:', error);
    return null;
  }
};

export const createUserProfile = async (userId, userData) => {
  if (isUsingMock) {
    return {
      id: userId || 'mock-user-id',
      first_name: userData.first_name || userData.firstName || '',
      last_name: userData.last_name || userData.lastName || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  try {
    // Prüfen, ob Profil bereits existiert
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingProfile) {
      console.log('Profil existiert bereits, wird aktualisiert');
      return await updateUserProfile(userId, userData);
    }
    
    // Neues Profil erstellen
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userId,
          first_name: userData.first_name || userData.firstName || '',
          last_name: userData.last_name || userData.lastName || '',
          employee_id: userData.employee_id || null // NEU: employee_id unterstützen
        }
      ])
      .select();
      
    if (error) {
      console.error('Fehler beim Erstellen des Profils:', error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Erstellen des Profils:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  if (isUsingMock) {
    return {
      id: userId || 'mock-user-id',
      ...updates,
      updated_at: new Date().toISOString()
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
      
    if (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Aktualisieren des Profils:', error);
    throw error;
  }
};

// Function to save a message as a memory
export const saveMemory = async (userId, content, agentId, senderType) => {
  if (isUsingMock) {
    console.log('Mock-Modus: Würde Erinnerung speichern', { userId, content, agentId, senderType });
    return { success: true, data: { id: 'mock-memory-id' } };
  }
  
  try {
    // Check if the user already has 10 memories
    const { count, error: countError } = await supabase
      .from('memorys')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error('Fehler beim Zählen der Erinnerungen:', countError);
      return { success: false, error: countError, message: 'Fehler beim Überprüfen der Erinnerungen.' };
    }
    
    // If user has reached the limit, return an error
    if (count >= 10) {
      return { 
        success: false, 
        error: null, 
        message: 'Du hast das Limit von 10 Erinnerungen erreicht. Bitte lösche eine alte Erinnerung, um eine neue zu speichern.' 
      };
    }
    
    // Save the new memory
    const { data, error } = await supabase
      .from('memorys')
      .insert({
        user_id: userId,
        content,
        agent_id: agentId,
        sender_type: senderType
      })
      .select();
      
    if (error) {
      console.error('Fehler beim Speichern der Erinnerung:', error);
      return { success: false, error, message: 'Fehler beim Speichern der Erinnerung.' };
    }
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Speichern der Erinnerung:', error);
    return { success: false, error, message: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
};

// Function to get all memories for a user
export const getUserMemories = async (userId) => {
  if (isUsingMock) {
    return [
      { id: 'mock-memory-1', content: 'Beispiel-Erinnerung 1', agent_id: 'second-brain', sender_type: 'agent', created_at: new Date().toISOString() },
      { id: 'mock-memory-2', content: 'Beispiel-Erinnerung 2', agent_id: 'cmo', sender_type: 'agent', created_at: new Date().toISOString() }
    ];
  }
  
  try {
    const { data, error } = await supabase
      .from('memorys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Fehler beim Laden der Erinnerungen:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Unerwarteter Fehler beim Laden der Erinnerungen:', error);
    throw error;
  }
};

// Function to delete a memory
export const deleteMemory = async (memoryId) => {
  if (isUsingMock) return true;
  
  try {
    const { error } = await supabase
      .from('memorys')
      .delete()
      .eq('id', memoryId);
      
    if (error) {
      console.error('Fehler beim Löschen der Erinnerung:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Löschen der Erinnerung:', error);
    throw error;
  }
};

// Existing code remains the same. Adding modified token usage functions below:

// Fix for token usage functions to ensure consistent data retrieval

// Funktion zum Abrufen des aktuellen Token-Verbrauchs eines Benutzers
export const getUserTokenUsage = async (userId) => {
  if (isUsingMock) {
    return { 
      tokens_used: 1200,
      last_reset: new Date().toISOString().split('T')[0],
      daily_limit: 2500,
      error: null 
    };
  }
  
  try {
    console.log('Prüfe Token-Nutzung für Benutzer:', userId);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD Format
    
    // Sicherer Aufruf der RPC-Funktion, ignoriere Fehler
    try {
      await supabase.rpc('refresh_cache');
    } catch (rpcError) {
      console.log('RPC-Fehler ignoriert:', rpcError);
    }
    
    // Prüfen, ob der Benutzer ein Mitarbeiter ist
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', userId)
      .single();
    
    const isEmployee = !profileError && profileData && profileData.employee_id ? true : false;
    
    // Token-Nutzung für den aktuellen Benutzer abrufen
    const { data, error } = await supabase
      .from('user_token_usage')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .order('updated_at', { ascending: false })
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Fehler beim Abrufen der Token-Nutzung:', error);
      return { tokens_used: 0, last_reset: today, daily_limit: 2500, error };
    }
    
    // Wenn kein Datensatz gefunden wurde oder ein Reset nötig ist
    if (!data || data.last_reset !== today) {
      // Erstelle/Update Eintrag für heute
      let newEntry;
      
      if (!data) {
        // Erstelle neuen Eintrag mit korrekter employee_id
        const { data: newData, error: insertError } = await supabase
          .from('user_token_usage')
          .insert({
            user_id: userId,
            tokens_used: 0,
            last_reset: today,
            daily_limit: 2500,
            is_employee: isEmployee,
            employee_id: isEmployee ? userId : null
          })
          .select();
          
        if (insertError) {
          console.error('Fehler beim Erstellen des Token-Nutzungsdatensatzes:', insertError);
          return { tokens_used: 0, last_reset: today, daily_limit: 2500, error: insertError };
        }
        
        newEntry = newData[0];
      } else {
        // Reset für neuen Tag
        const { data: resetData, error: resetError } = await supabase
          .from('user_token_usage')
          .update({ 
            tokens_used: 0,
            last_reset: today
          })
          .eq('id', data.id)
          .select();
          
        if (resetError) {
          console.error('Fehler beim Zurücksetzen der Token-Nutzung:', resetError);
          return { tokens_used: data.tokens_used, last_reset: data.last_reset, daily_limit: data.daily_limit, error: resetError };
        }
        
        newEntry = resetData[0];
      }
      
      console.log('Neue/Aktualisierte Token-Daten:', newEntry);
      
      return { 
        tokens_used: newEntry.tokens_used || 0, 
        last_reset: newEntry.last_reset, 
        daily_limit: newEntry.daily_limit || 2500,
        is_employee: isEmployee,
        error: null 
      };
    }
    
    // Eintrag existiert und ist aktuell
    console.log('Gefundene Token-Daten:', data);
    
    return { 
      tokens_used: data.tokens_used, 
      last_reset: data.last_reset, 
      daily_limit: data.daily_limit,
      is_employee: isEmployee,
      error: null 
    };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Abrufen der Token-Nutzung:', error);
    return { 
      tokens_used: 0, 
      last_reset: new Date().toISOString().split('T')[0], 
      daily_limit: 2500, 
      error 
    };
  }
};

// Funktion zum Aktualisieren des Token-Verbrauchs
export const updateUserTokenUsage = async (userId, tokensUsed) => {
  if (isUsingMock) {
    return { success: true, error: null };
  }
  
  try {
    console.log('Aktualisiere Token-Nutzung für User:', userId, 'mit Tokens:', tokensUsed);
    
    // Prüfen, ob der Benutzer ein Mitarbeiter ist
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', userId)
      .single();
    
    const isEmployee = !profileError && profileData && profileData.employee_id ? true : false;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Verbessert: Direktes Update mit der aktuellsten Row
    const { data: latestData } = await supabase
      .from('user_token_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('last_reset', today)
      .limit(1)
      .order('updated_at', { ascending: false });
    
    let updatedData;
    
    // Wenn bereits ein Eintrag für heute existiert
    if (latestData && latestData.length > 0) {
      const newTokensUsed = latestData[0].tokens_used + tokensUsed;
      
      // Update der bestehenden Zeile
      const { data: updateData, error: updateError } = await supabase
        .from('user_token_usage')
        .update({ 
          tokens_used: newTokensUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', latestData[0].id)
        .select();
      
      if (updateError) {
        console.error('Fehler beim Aktualisieren der Token-Nutzung:', updateError);
        return { success: false, error: updateError };
      }
      
      updatedData = updateData[0];
      console.log('Token-Nutzung aktualisiert:', updatedData);
    } 
    // Wenn noch kein Eintrag für heute existiert
    else {
      // Erstelle neuen Eintrag mit korrekter employee_id
      const { data: insertData, error: insertError } = await supabase
        .from('user_token_usage')
        .insert({
          user_id: userId,
          tokens_used: tokensUsed,
          last_reset: today,
          daily_limit: 2500,
          is_employee: isEmployee,
          employee_id: isEmployee ? userId : null
        })
        .select();
      
      if (insertError) {
        console.error('Fehler beim Erstellen des Token-Eintrags:', insertError);
        return { success: false, error: insertError };
      }
      
      updatedData = insertData[0];
      console.log('Neuer Token-Eintrag erstellt:', updatedData);
    }
    
    // Explizite Rückgabe der aktualisierten Daten
    return { 
      success: true, 
      tokens_used: updatedData.tokens_used,
      daily_limit: updatedData.daily_limit,
      is_employee: isEmployee,
      error: null 
    };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Aktualisieren der Token-Nutzung:', error);
    return { success: false, error };
  }
};

// Funktion zum Prüfen, ob ein Benutzer sein Token-Limit erreicht hat
export const checkUserTokenLimit = async (userId) => {
  if (isUsingMock) {
    return { 
      limitReached: false, 
      tokensLeft: 1300,
      tokens_used: 1200,
      daily_limit: 2500,
      error: null 
    };
  }
  
  try {
    const { 
      tokens_used, 
      daily_limit, 
      is_employee,
      error 
    } = await getUserTokenUsage(userId);
    
    if (error) {
      return { 
        limitReached: false, 
        tokensLeft: daily_limit,
        tokens_used: 0,
        daily_limit,
        error 
      };
    }
    
    const tokensLeft = Math.max(0, daily_limit - tokens_used);
    const limitReached = tokens_used >= daily_limit;
    
    // Detailliertere Protokollierung
    if (is_employee) {
      console.log(`Token-Status für Mitarbeiter ${userId}: ${tokens_used}/${daily_limit}, übrig: ${tokensLeft}`);
    } else {
      console.log(`Token-Status für Benutzer ${userId}: ${tokens_used}/${daily_limit}, übrig: ${tokensLeft}`);
    }
    
    return { 
      limitReached, 
      tokensLeft,
      tokens_used,
      daily_limit,
      is_employee,
      error: null 
    };
  } catch (error) {
    console.error('Unerwarteter Fehler beim Prüfen des Token-Limits:', error);
    return { 
      limitReached: false, 
      tokensLeft: 2500,
      tokens_used: 0,
      daily_limit: 2500,
      error 
    };
  }
};
// Funktion zum Abrufen der Lizenzinformationen eines Partners
export const getPartnerLicense = async (userId) => {
  if (isUsingMock) {
    return { 
      license_tier: 'starter',
      status: 'active',
      customer_limit: 5,
      token_limit: 150000,
      tokens_used: 45000,
      subdomain: 'partner-demo',
      branding_config: { logo: null, primary_color: '#3B82F6' }
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('partner_licenses')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Kein Lizenz-Eintrag gefunden, erstelle einen Standard-Eintrag
        return createDefaultPartnerLicense(userId);
      }
      console.error('Fehler beim Laden der Partner-Lizenz:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Lizenzinformationen:', err);
    return null;
  }
};

// Erstelle eine Standard-Lizenz für neue Partner
const createDefaultPartnerLicense = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('partner_licenses')
      .insert([{
        user_id: userId,
        license_tier: 'starter',
        status: 'active',
        customer_limit: 5,
        token_limit: 150000,
        tokens_used: 0,
        branding_config: {}
      }])
      .select();
    
    if (error) {
      console.error('Fehler beim Erstellen der Standard-Lizenz:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Unerwarteter Fehler beim Erstellen der Standard-Lizenz:', err);
    return null;
  }
};

// Prüfe, ob eine bestimmte Funktion für die Lizenzstufe verfügbar ist
export const checkLicenseFeature = async (userId, feature) => {
  const license = await getPartnerLicense(userId);
  
  if (!license) {
    return { allowed: false, reason: 'Keine gültige Lizenz gefunden' };
  }
  
  if (license.status !== 'active') {
    return { allowed: false, reason: 'Lizenz ist nicht aktiv' };
  }
  
  // Feature-spezifische Prüfungen
  switch (feature) {
    case 'custom_subdomain':
      return { 
        allowed: ['professional', 'enterprise_basic', 'enterprise_pro', 'enterprise_custom'].includes(license.license_tier),
        current: license.subdomain
      };
    
    case 'custom_domain':
      return { 
        allowed: ['enterprise_basic', 'enterprise_pro', 'enterprise_custom'].includes(license.license_tier),
        current: license.custom_domain
      };
    
    case 'agent_customization':
      const customizableAgents = getCustomizableAgents(license.license_tier);
      return { 
        allowed: customizableAgents.length > 0,
        customizable: customizableAgents
      };
    
    case 'customer_limit':
      return { 
        allowed: true,
        limit: license.customer_limit,
        used: await getCustomerCount(userId)
      };
    
    default:
      return { allowed: false, reason: 'Unbekannte Funktion' };
  }
};

// Hilfsfunktion: Ermittle welche Agenten anpassbar sind basierend auf der Lizenzstufe
function getCustomizableAgents(licenseTier) {
  switch (licenseTier) {
    case 'professional':
      return ['cmo']; // In Professional kann nur 1 Agent angepasst werden
    case 'enterprise_basic':
      return ['cmo', 'cfo', 'coo']; // Ab Enterprise Basic können 3 Agenten angepasst werden
    case 'enterprise_pro':
    case 'enterprise_custom':
      return ['cmo', 'cfo', 'coo', 'second-brain']; // Bei Enterprise Pro und Custom alle Agenten
    default:
      return []; // Starter: Keine anpassbaren Agenten
  }
}

// Hilfsfunktion: Zähle die Kunden eines Partners
async function getCustomerCount(userId) {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', userId);
    
    if (error) {
      console.error('Fehler beim Zählen der Kunden:', error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error('Unerwarteter Fehler beim Zählen der Kunden:', err);
    return 0;
  }
}

// Funktion zum Aktualisieren der monatlichen Token-Nutzung eines Partners
export const updatePartnerTokenUsage = async (userId, tokensUsed) => {
  try {
    const { data, error } = await supabase
      .from('partner_licenses')
      .select('tokens_used')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Fehler beim Abrufen der Token-Nutzung:', error);
      return { success: false, error };
    }
    
    const newTokensUsed = (data.tokens_used || 0) + tokensUsed;
    
    const { error: updateError } = await supabase
      .from('partner_licenses')
      .update({ 
        tokens_used: newTokensUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Fehler beim Aktualisieren der Token-Nutzung:', updateError);
      return { success: false, error: updateError };
    }
    
    return { success: true, tokens_used: newTokensUsed };
  } catch (err) {
    console.error('Unerwarteter Fehler beim Aktualisieren der Token-Nutzung:', err);
    return { success: false, error: err };
  }
};