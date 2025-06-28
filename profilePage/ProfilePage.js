import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { Loader, Key } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Profildaten aus der profiles-Tabelle holen
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfileData(data);
    } catch (err) {
      console.error('Fehler beim Laden des Profils:', err);
      setError('Profildaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    
    try {
      setPasswordLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Passwort wurde erfolgreich geändert!');
    } catch (err) {
      console.error('Fehler beim Ändern des Passworts:', err);
      setError('Passwort konnte nicht geändert werden.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
        <div className="p-6 min-h-full">
          <div className="bg-theme-warning-bg border-l-4 border-theme-warning-border p-4 mb-4 text-theme-warning">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm">
                  Sie müssen angemeldet sein, um auf Ihr Profil zuzugreifen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !profileData) {
    return (
      <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
        <div className="p-6 min-h-full">
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-theme-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
      <div className="p-6 min-h-full">
        <div className="max-w-4xl mx-auto bg-theme-surface rounded-lg shadow-md overflow-hidden theme-transition">
          <div className="bg-theme-primary text-white p-4">
            <h1 className="text-2xl font-bold">Mein Profil</h1>
          </div>
          
          {error && (
            <div className="bg-theme-error-bg border-l-4 border-theme-error-border p-4 mb-4 text-theme-error">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6">
            {/* Benutzer-Informationen */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-theme-text">Benutzer-Informationen</h2>
              
              <div className="space-y-4">
                {/* Vor- und Nachname */}
                <div className="border border-theme-border rounded-md p-4 bg-theme-surface-secondary">
                  <p className="text-sm text-theme-text-muted mb-1">Vor- und Nachname</p>
                  <p className="font-medium text-theme-text">
                    {profileData?.first_name || profileData?.last_name 
                      ? `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()
                      : '—'
                    }
                  </p>
                </div>
                
                {/* E-Mail-Adresse */}
                <div className="border border-theme-border rounded-md p-4 bg-theme-surface-secondary">
                  <p className="text-sm text-theme-text-muted mb-1">E-Mail-Adresse</p>
                  <p className="font-medium text-theme-text">{user.email}</p>
                </div>
                
                {/* Passwort */}
                <div className="border border-theme-border rounded-md p-4 bg-theme-surface-secondary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-theme-text-muted mb-1">Passwort</p>
                      <p className="font-medium text-theme-text">••••••••</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        showPasswordChange 
                          ? 'bg-theme-hover text-theme-primary' 
                          : 'bg-theme-primary text-white hover:bg-theme-primary-hover'
                      }`}
                    >
                      <Key size={16} className="mr-1" />
                      {showPasswordChange ? 'Abbrechen' : 'Ändern'}
                    </button>
                  </div>
                  
                  {/* Passwort-Änderungsformular */}
                  {showPasswordChange && (
                    <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-theme-text mb-1">
                          Neues Passwort
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-theme-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-theme-surface text-theme-text"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-text mb-1">
                          Passwort bestätigen
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-theme-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary bg-theme-surface text-theme-text"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setNewPassword('');
                            setConfirmPassword('');
                            setError(null);
                          }}
                          className="px-4 py-2 rounded-md transition-colors bg-theme-surface-secondary text-theme-text hover:bg-theme-hover border border-theme-border"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary disabled:opacity-50 transition-colors bg-theme-primary hover:bg-theme-primary-hover"
                        >
                          {passwordLoading ? (
                            <>
                              <Loader size={16} className="animate-spin mr-2 inline" />
                              Speichern...
                            </>
                          ) : (
                            'Passwort ändern'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;