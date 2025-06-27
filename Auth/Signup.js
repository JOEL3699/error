import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { useAuth } from './AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { checkUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('Bitte geben Sie Ihren Vornamen ein.');
      return false;
    }

    if (!formData.lastName.trim()) {
      setError('Bitte geben Sie Ihren Nachnamen ein.');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return false;
    }
    
    if (!formData.password) {
      setError('Bitte geben Sie ein Passwort ein.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return false;
    }
    
    if (!termsAccepted) {
      setError('Bitte akzeptieren Sie die Nutzungsbedingungen und Datenschutzrichtlinie.');
      return false;
    }
    
    return true;
  };

  const createProfile = async (userId) => {
    console.log('Erstelle Profil für Benutzer:', userId);
    
    try {
      // Direkter Zugriff auf die profiles-Tabelle
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            first_name: formData.firstName,
            last_name: formData.lastName,
            // Explizit Zeitstempel setzen
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error('Fehler beim Erstellen des Profils:', error);
        return { success: false, error };
      }
      
      console.log('Profil erfolgreich erstellt:', data);
      return { success: true, profile: data[0] };
    } catch (err) {
      console.error('Unerwarteter Fehler beim Erstellen des Profils:', err);
      return { success: false, error: err };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Starte Registrierungsprozess mit Daten:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      // Supabase Auth API mit Metadaten für Vor- und Nachname
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });
      
      if (error) {
        console.error('Supabase Auth Fehler:', error);
        throw error;
      }

      console.log('Registrierungsdaten:', data);

      if (data && data.user) {
        console.log('Benutzer erfolgreich erstellt mit ID:', data.user.id);
        
        // Expliziter Versuch, ein Profil zu erstellen
        const profileResult = await createProfile(data.user.id);
        
        if (!profileResult.success) {
          console.warn('Profil konnte nicht erstellt werden, fahre trotzdem fort');
        }

        // Aktualisiere den Auth-Zustand
        await checkUser();
        
        // Direkt zum Panel weiterleiten
        navigate('/panel');
      } else {
        console.log('Benutzer wurde erstellt, aber keine Bestätigung erhalten');
        // Bei Supabase kann es vorkommen, dass eine E-Mail-Bestätigung erforderlich ist
        navigate('/auth/login', { 
          state: { 
            message: 'Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail und melden Sie sich dann an.' 
          } 
        });
      }
    } catch (err) {
      console.error('Detaillierter Registrierungsfehler:', err);
      setError('Bei der Registrierung ist ein Fehler aufgetreten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Konto erstellen</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Vorname</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nachname</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Passwort</label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
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
            <p className="mt-1 text-xs text-gray-500">Mindestens 8 Zeichen empfohlen</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? 
                  <EyeOff className="h-5 w-5 text-gray-400" /> : 
                  <Eye className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
          </div>
          
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={() => setTermsAccepted(!termsAccepted)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              Ich stimme den <Link to="/terms" className="text-blue-600 hover:underline">Nutzungsbedingungen</Link> und der <Link to="/privacy" className="text-blue-600 hover:underline">Datenschutzrichtlinie</Link> zu
            </label>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Wird registriert...' : 'Registrieren'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Oder</span>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Haben Sie bereits ein Konto? <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">Anmelden</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;