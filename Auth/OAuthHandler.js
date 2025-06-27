import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { useAuth } from './AuthContext';
import { Loader } from 'lucide-react';

// Diese Komponente wird als Route für die Weiterleitung nach OAuth-Anmeldung verwendet
const OAuthHandler = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, checkUser } = useAuth();
  const navigate = useNavigate();

  // 🔧 NEUE LOGIK: Rollen-basierte Navigation für OAuth
  const determineUserDestination = (profile) => {
    if (!profile) return '/'; // Fallback zur App
    
    const role = profile.role?.toLowerCase();
    
    // Super-Admin → Super-Admin-Panel
    if (profile.is_super_admin) {
      console.log('🛡️ OAuth: Super-Admin erkannt → Super-Admin-Panel');
      return '/super-admin';
    }
    
    // Partner/Mitarbeiter → Admin Dashboard
    if (['partner', 'admin', 'mitarbeiter'].includes(role)) {
      console.log('🎨 OAuth: Partner/Mitarbeiter erkannt → Admin Dashboard');
      return '/admin-dashboard';
    }
    
    // End-user → App
    if (role === 'end-user') {
      console.log('👤 OAuth: End-user erkannt → App');
      return '/';
    }
    
    // Fallback: Wenn employee_id gesetzt ist (= ist Mitarbeiter) → App, sonst Admin Dashboard
    const hasEmployeeId = profile.employee_id !== null && profile.employee_id !== undefined;
    if (hasEmployeeId) {
      console.log('🔄 OAuth: End-user (via employee_id) → App');
      return '/';
    } else {
      console.log('🔄 OAuth: Partner (via employee_id null) → Admin Dashboard');
      return '/admin-dashboard';
    }
  };

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        // Wir überprüfen zuerst den Authentifizierungsstatus
        await checkUser();
        
        if (user) {
          // Überprüfen, ob bereits ein Profil für den Benutzer existiert
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, employee_id, role, first_name, last_name, is_super_admin')
            .eq('id', user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = kein Ergebnis gefunden
            console.error('Fehler beim Prüfen des Profils:', profileError);
          }
          
          // Wenn kein Profil existiert, erstellen wir eines
          if (!existingProfile) {
            // Metadaten aus der OAuth-Anmeldung extrahieren
            const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                            user.user_metadata?.name?.split(' ')[0] || 
                            '';
            const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                           user.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                           '';
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: user.id, 
                  first_name: firstName,
                  last_name: lastName,
                  role: 'End-user' // Standard-Rolle für neue OAuth-Benutzer
                }
              ]);
              
            if (insertError) {
              console.error('Fehler beim Erstellen des Profils nach OAuth:', insertError);
              setError('Fehler beim Erstellen des Profils');
            }
            
            // Nach der Profilkonfiguration zur App navigieren für neue End-user
            console.log('🎯 OAuth: Neuer End-user → App');
            navigate('/', { replace: true });
            return;
          }
          
          // 🔧 NEUE LOGIK: Rollen-basierte Weiterleitung für bestehende User
          const destination = determineUserDestination(existingProfile);
          console.log('🎯 OAuth: Bestehender Benutzer → Weiterleitung zu:', destination);
          navigate(destination, { replace: true });
        } else {
          // Wenn kein Benutzer vorhanden ist, zur Anmeldung weiterleiten
          navigate('/auth/login', { 
            replace: true,
            state: { message: 'Die Anmeldung war nicht erfolgreich. Bitte versuchen Sie es erneut.' }
          });
        }
      } catch (err) {
        console.error('Unerwarteter Fehler bei OAuth-Verarbeitung:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    };
    
    handleOAuthRedirect();
  }, [user, checkUser, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Anmeldung wird verarbeitet...</h2>
          <p className="text-gray-500">Einen Moment bitte, Sie werden gleich weitergeleitet.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Fehler bei der Anmeldung</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Zurück zur Anmeldung
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default OAuthHandler;