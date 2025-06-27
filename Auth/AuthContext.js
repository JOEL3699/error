// src/pages/Auth/AuthContext.js – Loop-Fix, ansonsten Original-Logik
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { supabase } from '../../components/SupaBase/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  /* ---------- STATE ---------- */
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  /* ---------- REFS ---------- */
  const initializationRef   = useRef(false);
  const currentUserIdRef    = useRef(null);
  const superAdminCheckRef  = useRef(false);
  const authSubscriptionRef = useRef(null);
  const mountedRef          = useRef(true);

  console.log(
    '🔧 AuthProvider: Rendering | loading:',
    loading,
    '| user:',
    user?.email
  );

  /* ---------- ENV ---------- */
  const isUsingMock =
    !process.env.REACT_APP_SUPABASE_URL ||
    !process.env.REACT_APP_SUPABASE_ANON_KEY;

  /* ----------------------------------------------------------------
     signOut  (unverändert)
  ---------------------------------------------------------------- */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      currentUserIdRef.current   = null;
      superAdminCheckRef.current = false;
      setUser(null);
      setIsSuperAdmin(false);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Abmelden:', err);
      setError('Fehler beim Abmelden');
    }
  }, []);

  /* ----------------------------------------------------------------
     checkSuperAdminStatus  (unverändert)
  ---------------------------------------------------------------- */
  const checkSuperAdminStatus = useCallback(
    async (userId, email) => {
      if (superAdminCheckRef.current === userId) return;

      try {
        superAdminCheckRef.current = userId;

        if (isUsingMock) return setIsSuperAdmin(false);
        if (email === 'joel-eric.joosten@gmx.de') {
          setIsSuperAdmin(true);
          return;
        }

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 8000);

        const { data, error } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', userId)
          .single();

        clearTimeout(timeoutId);

        if (!mountedRef.current) return;
        if (error) {
          console.error('SA-Check error:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(!!data?.is_super_admin);
        }
      } catch (err) {
        if (mountedRef.current) setIsSuperAdmin(false);
      }
    },
    [isUsingMock]
  );

  /* ----------------------------------------------------------------
     HAUPT-INITIALISIERUNG (Originalcode + 2 Zeilen Loop-Fix)
  ---------------------------------------------------------------- */
  useEffect(() => {
    /* Strict-Mode-Reset: Flag bei jedem Mount wieder aktivieren */
    mountedRef.current = true;

    /* --- Fix ❶: Loader retten, falls erster Run abgebrochen --- */
    if (initializationRef.current) {
      console.log('🔧 Initialization already done – skip');
      if (loading) setLoading(false);           // <-- Rettung
      return;
    }

    initializationRef.current = true;
    console.log('🔧 Starting one-time initialization');

    let timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('⏰ Timeout – stop loading');
        setLoading(false);
        setError('Timeout: Authentifizierung dauert zu lange');
      }
    }, 15000);

    /* -------- initializeAuth (dein Original) -------- */
    const initializeAuth = async () => {
      try {
        console.log('🔧 initializeAuth started');

        if (isUsingMock) {
          if (mountedRef.current) {
            setUser(null);
            setIsSuperAdmin(false);
            setLoading(false);
            clearTimeout(timeoutId);
          }
          return;
        }

        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error('Session timeout')), 12000)
          )
        ]);

        if (sessionError) {
          if (mountedRef.current) {
            setError(sessionError.message);
            setUser(null);
            setIsSuperAdmin(false);
            setLoading(false);
            clearTimeout(timeoutId);
          }
          return;
        }

        if (session?.user && mountedRef.current) {
          currentUserIdRef.current = session.user.id;
          setUser(session.user);
          await checkSuperAdminStatus(session.user.id, session.user.email);
        } else if (mountedRef.current) {
          setUser(null);
          setIsSuperAdmin(false);
          currentUserIdRef.current = null;
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err.message === 'Session timeout'
              ? 'Timeout: Supabase-Verbindung dauert zu lange'
              : err.message
          );
          setUser(null);
          setIsSuperAdmin(false);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    /* Start */
    initializeAuth();

    /* -------- Auth-State-Listener (Original) -------- */
    if (!isUsingMock) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mountedRef.current) return;

            const newUserId = session?.user?.id || null;

            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                if (session?.user && currentUserIdRef.current !== newUserId) {
                  currentUserIdRef.current = newUserId;
                  superAdminCheckRef.current = false;
                  setUser(session.user);
                  await checkSuperAdminStatus(
                    session.user.id,
                    session.user.email
                  );
                  setError(null);
                }
                break;

              case 'SIGNED_OUT':
                currentUserIdRef.current   = null;
                superAdminCheckRef.current = false;
                setUser(null);
                setIsSuperAdmin(false);
                setError(null);
                break;

              case 'USER_UPDATED':
                if (session?.user && currentUserIdRef.current === session.user.id) {
                  setUser(session.user);
                }
                break;

              default:
                break;
            }

            if (loading) {
              setLoading(false);
              clearTimeout(timeoutId);
            }
          }
        );
        authSubscriptionRef.current = subscription;
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    }

    /* Cleanup */
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      authSubscriptionRef.current?.unsubscribe();
    };
  }, []);   // <- keine Dependencies  (Original)

  /* ----------------------------------------------------------------
     checkUser (unverändert)
  ---------------------------------------------------------------- */
  const checkUser = useCallback(async () => {
    try {
      setLoading(true);

      if (isUsingMock) {
        setUser(null);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const { data: { user: currentUser }, error } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('User check timeout')), 8000)
        )
      ]);

      if (error) {
        setError(error.message);
        setUser(null);
        setIsSuperAdmin(false);
        currentUserIdRef.current   = null;
        superAdminCheckRef.current = false;
      } else if (currentUser) {
        if (currentUserIdRef.current !== currentUser.id) {
          currentUserIdRef.current   = currentUser.id;
          superAdminCheckRef.current = false;
          setUser(currentUser);
          await checkSuperAdminStatus(currentUser.id, currentUser.email);
        } else {
          setUser(currentUser);
        }
        setError(null);
      } else {
        setUser(null);
        setIsSuperAdmin(false);
        currentUserIdRef.current   = null;
        superAdminCheckRef.current = false;
      }
    } catch (err) {
      setError(err.message);
      setUser(null);
      setIsSuperAdmin(false);
      currentUserIdRef.current   = null;
      superAdminCheckRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [isUsingMock, checkSuperAdminStatus]);

  /* ----------------------------------------------------------------
     RENDER
  ---------------------------------------------------------------- */
  const value = {
    user,
    loading,
    error,
    isSuperAdmin,
    checkUser,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};