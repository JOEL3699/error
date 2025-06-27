import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, UserPlus, Mail, CheckCircle, AlertCircle, 
  X, Eye, EyeOff, User, Shield, RefreshCw
} from 'lucide-react';
import { supabase, getPartnerLicense } from '../../components/SupaBase/supabaseClient';
import { useAuth } from '../../pages/Auth/AuthContext';

const AddUserComponent = ({ onBack }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Lade Lizenz und aktuelle End-user beim Mount
  useEffect(() => {
    if (user) {
      fetchLicenseInfo();
      fetchEmployees();
    }
  }, [user]);

  const fetchLicenseInfo = async () => {
    try {
      setLicenseLoading(true);
      const licenseData = await getPartnerLicense(user.id);
      setLicense(licenseData);
    } catch (err) {
      console.error('Fehler beim Laden der Lizenzinformationen:', err);
      setError('Lizenzinformationen konnten nicht geladen werden.');
    } finally {
      setLicenseLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at, role')
        .eq('employee_id', user.id);
      
      if (error) {
        console.error('Fehler beim Laden der End-user:', error);
        setError('End-user konnten nicht geladen werden.');
        return;
      }
      
      setEmployees(data || []);
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der End-user:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('Bitte geben Sie einen Vornamen ein.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Bitte geben Sie einen Nachnamen ein.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Bitte geben Sie ein Passwort ein.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return false;
    }
    
    // Lizenz-Limit prüfen
    if (license && employees.length >= license.customer_limit) {
      setError(`Sie haben Ihr End-user-Limit von ${license.customer_limit} erreicht. Bitte upgraden Sie Ihre Lizenz, um weitere End-user hinzuzufügen.`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('Erstelle neuen End-user:', formData.email);
      
      // 1. Benutzer in Supabase Auth erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) {
        console.error('Auth-Fehler:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Benutzer konnte nicht erstellt werden.');
      }

      console.log('Auth-Benutzer erstellt:', authData.user.id);

      // 2. Profil in der Profiles-Tabelle erstellen
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            first_name: formData.firstName,
            last_name: formData.lastName,
            employee_id: user.id, // Wichtig: Verbindung zum Partner
            role: 'End-user'
          }
        ])
        .select();

      if (profileError) {
        console.error('Profil-Fehler:', profileError);
        throw profileError;
      }

      console.log('Profil erstellt:', profileData);

      // 3. Erfolgsmeldung und Reset
      const userName = `${formData.firstName} ${formData.lastName}`;
      setSuccessMessage(`End-user "${userName}" wurde erfolgreich erstellt und kann sich jetzt anmelden.`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 8000);

      // 4. Formular zurücksetzen
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });

      // 5. End-user-Liste aktualisieren
      await fetchEmployees();

    } catch (err) {
      console.error('Fehler beim Erstellen des End-users:', err);
      
      // Spezifische Fehlermeldungen
      if (err.message && err.message.includes('duplicate key')) {
        setError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else if (err.message && err.message.includes('password')) {
        setError('Das Passwort entspricht nicht den Anforderungen (mindestens 6 Zeichen).');
      } else if (err.message && err.message.includes('email')) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      } else {
        setError(`Fehler beim Erstellen des End-users: ${err.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    });
    setError('');
  };

  const refreshData = async () => {
    await fetchLicenseInfo();
    await fetchEmployees();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">End-user hinzufügen</h1>
            <p className="text-gray-500">Neuen Benutzer zum System hinzufügen</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={licenseLoading || employeesLoading}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className={`mr-2 ${(licenseLoading || employeesLoading) ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center shadow-sm">
          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center shadow-sm">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lizenz-Status */}
      {!licenseLoading && license && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Lizenz-Status: {license.customer_limit - employees.length} von {license.customer_limit} End-user verfügbar
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Aktuell: {employees.length} End-user
            </div>
          </div>
          {employees.length >= license.customer_limit && (
            <div className="mt-2 text-sm text-red-700">
              ⚠️ End-user-Limit erreicht. Bitte upgraden Sie Ihre Lizenz.
            </div>
          )}
        </div>
      )}

      {/* Formular */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserPlus className="mr-2 text-blue-600" size={20} />
            Neuen End-user erstellen
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name-Felder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mustermann"
                  required
                />
              </div>
            </div>
          </div>

          {/* E-Mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="max.mustermann@firma.de"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Der End-user erhält Anmeldedaten an diese E-Mail-Adresse
            </p>
          </div>

          {/* Passwort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mindestens 6 Zeichen"
                required
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : 
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                }
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Das Passwort kann später vom End-user geändert werden
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Zurücksetzen
            </button>
            <button
              type="submit"
              disabled={loading || (license && employees.length >= license.customer_limit)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  End-user erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bestehende End-user */}
      {!employeesLoading && employees.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Bestehende End-user ({employees.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {employees.map((employee) => (
              <div key={employee.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {employee.first_name?.charAt(0) || employee.last_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Kein Name'}
                      </p>
                      <p className="text-xs text-gray-500">{employee.role || 'End-user'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      Erstellt: {new Date(employee.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUserComponent;