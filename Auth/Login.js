import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkUser, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Nachricht von der Signup-Seite anzeigen, falls vorhanden
  const message = location.state?.message;

  // 🔧 NEUE FUNKTION: Rollen-basierte Navigation
  const determineUserDestination = (profile) => {
    if (!profile) return '/'; // Fallback zur App
    
    const role = profile.role?.toLowerCase();
    
    // Super-Admin → Super-Admin-Panel
    if (profile.is_super_admin) {
      console.log('🛡️ Login: Super-Admin erkannt → Super-Admin-Panel');
      return '/super-admin';
    }
    
    // Admins/Partner/Mitarbeiter → Admin Dashboard
    if (['partner', 'admin', 'mitarbeiter'].includes(role)) {
      console.log('✅ Login: Partner/Mitarbeiter-Zugang erkannt → Admin Dashboard');
      return '/admin-dashboard';
    }
    
    // End-user → App
    if (role === 'end-user') {
      console.log('👤 Login: End-user erkannt → App');
      return '/';
    }
    
    // Fallback: Wenn employee_id gesetzt ist (= ist Mitarbeiter) → App, sonst Admin Dashboard
    const hasEmployeeId = profile.employee_id !== null && profile.employee_id !== undefined;
    if (hasEmployeeId) {
      console.log('🔄 Login: End-user (via employee_id) → App');
      return '/';
    } else {
      console.log('🔄 Login: Partner (via employee_id null) → Admin Dashboard');
      return '/admin-dashboard';
    }
  };

  // Beim Laden prüfen, ob der Benutzer bereits angemeldet ist und ein Profil abrufen
  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        try {
          setIsProfileLoading(true);
          
          // Profil des Benutzers abrufen - JETZT MIT ROLLE UND SUPER-ADMIN
          const { data, error } = await supabase
            .from('profiles')
            .select('employee_id, role, first_name, last_name, is_super_admin')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Fehler beim Laden des Benutzerprofils:', error);
          } else {
            setUserProfile(data);
            
            // 🔧 NEUE LOGIK: Rollen-basierte Weiterleitung
            const destination = determineUserDestination(data);
            console.log('🎯 Login: Weiterleitung zu:', destination);
            navigate(destination);
          }
        } catch (err) {
          console.error('Unerwarteter Fehler:', err);
        } finally {
          setIsProfileLoading(false);
        }
      }
    };
    
    checkUserStatus();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validiere Felder
      if (!email || !password) {
        setError('Bitte alle Felder ausfüllen.');
        return;
      }
      
      // Versuche Anmeldung mit Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('Anmeldefehler:', signInError);
        setError(signInError.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort ist falsch.'
          : 'Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
        );
        return;
      }
      
      // Auth-Context aktualisieren
      await checkUser();
      
      // Profil des Benutzers abrufen - JETZT MIT ROLLE UND SUPER-ADMIN
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('employee_id, role, first_name, last_name, is_super_admin')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('Fehler beim Laden des Benutzerprofils:', profileError);
        // Im Fehlerfall zur App navigieren
        navigate('/');
        return;
      }
      
      // 🔧 NEUE LOGIK: Rollen-basierte Weiterleitung
      const destination = determineUserDestination(profileData);
      console.log('🎯 Login Success: Weiterleitung zu:', destination);
      navigate(destination);
      
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          // Metadaten für Profilerstellung bei OAuth-Anmeldung 
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        console.error('Google-Anmeldefehler:', error);
        setError('Bei der Anmeldung mit Google ist ein Fehler aufgetreten.');
      }
      
      // Hinweis: Bei OAuth werden wir zu Google weitergeleitet, daher keine weitere Navigation hier
    } catch (err) {
      console.error('Unerwarteter Fehler bei der Google-Anmeldung:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginWithMicrosoft = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin + '/',
          // Metadaten für Profilerstellung bei OAuth-Anmeldung
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        console.error('Microsoft-Anmeldefehler:', error);
        setError('Bei der Anmeldung mit Microsoft ist ein Fehler aufgetreten.');
      }
      
      // Hinweis: Bei OAuth werden wir zu Microsoft weitergeleitet, daher keine weitere Navigation hier
    } catch (err) {
      console.error('Unerwarteter Fehler bei der Microsoft-Anmeldung:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Anzeige des Ladezustands, wenn das Benutzerprofil geladen wird
  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-bold text-center mb-8">Anmelden</h2>
      
      {/* Erfolgsmeldung von der Registrierungsseite */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 mb-6 rounded-md">
          {message}
        </div>
      )}
      
      {/* Fehlermeldung */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-Mail
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Passwort
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              disabled={loading}
            />
            <button 
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? 
                <EyeOff className="h-5 w-5 text-gray-400" /> : 
                <Eye className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
              Angemeldet bleiben
            </label>
          </div>

          <div className="text-sm">
            <Link to="/auth/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
              Passwort vergessen?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin mr-2" />
                Anmelden...
              </>
            ) : 'Anmelden'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Noch kein Konto?{' '}
        <Link to="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
};

export default Login;