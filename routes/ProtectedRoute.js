import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/Auth/AuthContext';
import { Loader, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../components/SupaBase/supabaseClient';

const ProtectedRoute = () => {
  const { user, loading, error } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const location = useLocation();

  // 🔧 REFS zur Vermeidung von Endlos-Schleifen
  const profileLoadingRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const mountedRef = useRef(true);

  // 🔧 VERBESSERTE FUNKTION: User Profile abrufen - nur einmal pro User
  useEffect(() => {
    const fetchUserProfile = async () => {
      // 🔧 Verhindere mehrfache Profile-Loads für denselben User
      if (!user?.id || 
          profileLoadingRef.current || 
          currentUserIdRef.current === user.id) {
        setProfileLoading(false);
        return;
      }

      try {
        profileLoadingRef.current = true;
        currentUserIdRef.current = user.id;
        
        // Timeout für Profile-Abfrage
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('employee_id, role, first_name, last_name, is_super_admin')
          .eq('id', user.id)
          .single();
        
        clearTimeout(timeoutId);
        
        if (!mountedRef.current) return; // Component unmounted check
        
        if (error) {
          console.error('Error fetching user profile:', error);
          setProfileError(error.message);
          setUserProfile(null);
        } else {
          setUserProfile(data);
          setProfileError(null);
        }
      } catch (err) {
        console.error('Error:', err);
        if (mountedRef.current) {
          if (err.name === 'AbortError') {
            setProfileError('Timeout: Profil-Laden dauert zu lange');
          } else {
            setProfileError(err.message);
          }
          setUserProfile(null);
        }
      } finally {
        if (mountedRef.current) {
          setProfileLoading(false);
        }
        profileLoadingRef.current = false;
      }
    };
    
    if (user) {
      fetchUserProfile();
    } else {
      // Reset states when no user
      currentUserIdRef.current = null;
      setProfileLoading(false);
      setUserProfile(null);
      setProfileError(null);
    }
  }, [user?.id]); // 🔧 Nur bei User-ID-Änderung, nicht bei user-Objekt-Änderung

  // 🔧 Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ERROR-HANDLING: Wenn AuthProvider einen Fehler hat
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Verbindungsproblem
          </h2>
          <p className="text-gray-600 mb-4">
            {error.includes('timeout') || error.includes('Timeout') 
              ? 'Die Verbindung zur Datenbank dauert zu lange.'
              : 'Es gab ein Problem beim Laden der Authentifizierung.'
            }
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Fehler: {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Seite neu laden
            </button>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Zur Login-Seite
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PROFILE ERROR-HANDLING: Wenn Profil-Laden fehlschlägt
  if (user && profileError && !profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Profil-Fehler
          </h2>
          <p className="text-gray-600 mb-4">
            Dein Benutzerprofil konnte nicht geladen werden.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Fehler: {profileError}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Reset all refs and states for retry
                profileLoadingRef.current = false;
                currentUserIdRef.current = null;
                setProfileLoading(true);
                setProfileError(null);
                setUserProfile(null);
                // Trigger profile reload by force-updating the dependency
                if (user) {
                  window.location.reload();
                }
              }}
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </button>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Neu anmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading || (user && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">
            {loading ? 'Authentifizierung wird überprüft...' : 'Profil wird geladen...'}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Falls das Laden zu lange dauert, prüfe deine Internetverbindung.
          </p>
        </div>
      </div>
    );
  }

  // NO USER REDIRECT
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 🔧 NEUE LOGIK: Bestimme User-Typ für Navigation - NUR wenn Profil geladen
  const getUserAccess = (profile) => {
    if (!profile) {
      return 'end-user'; // Fallback zu End-user
    }
    
    const role = profile.role?.toLowerCase();
    
    // Super-Admin → Super-Admin-Panel
    if (profile.is_super_admin) {
      return 'super-admin';
    }
    
    // Partner/Mitarbeiter → Admin Dashboard
    if (['partner', 'admin', 'mitarbeiter'].includes(role) || profile.employee_id === null) {
      return 'partner';
    }
    
    // End-user → Normale App
    if (role === 'end-user' || profile.employee_id !== null) {
      return 'end-user';
    }
    
    // Fallback
    return 'end-user';
  };

  // 🔧 Bestimme User Access nur wenn Profile verfügbar ist
  const userAccess = userProfile ? getUserAccess(userProfile) : 'end-user';

  // 🔧 NEUE NAVIGATION LOGIC - NUR wenn wir ein definitives Profil haben
  if (userProfile) {
    if (userAccess === 'super-admin') {
      // Super-Admin → Super-Admin-Panel
      if (location.pathname !== '/super-admin') {
        return <Navigate to="/super-admin" replace />;
      }
    } else if (userAccess === 'partner') {
      // Partner/Mitarbeiter → Admin Dashboard (außer bei spezifischen App-Routen)
      const appRoutes = ['/', '/agent-chat', '/tasks', '/calendar', '/user-management', '/admin', '/profile'];
      const isAppRoute = appRoutes.some(route => location.pathname.startsWith(route));
      
      if (!isAppRoute && location.pathname !== '/admin-dashboard') {
        return <Navigate to="/admin-dashboard" replace />;
      }
    } else {
      // End-user → App
      if (location.pathname === '/admin-dashboard') {
        return <Navigate to="/" replace />;
      }
      
      // Alte Panel-Route umleiten
      if (location.pathname === '/panel') {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Rendere die verschachtelten Routen
  return <Outlet />;
};

export default ProtectedRoute;