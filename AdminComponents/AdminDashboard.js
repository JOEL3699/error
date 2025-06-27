import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Settings, CreditCard, MessageSquare,
  CheckCircle, AlertCircle, UserPlus, Palette, RefreshCw,
  Home, TrendingUp, Calendar, Award
} from 'lucide-react';
import { supabase, getPartnerLicense } from '../../components/SupaBase/supabaseClient';
import { useAuth } from '../../pages/Auth/AuthContext';

const AdminDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [license, setLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Lade alle Daten beim Komponenten-Mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchLicenseInfo();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Fehler beim Laden des Benutzerprofils:', error);
        setError('Benutzerprofil konnte nicht geladen werden.');
      } else {
        setUserProfile(data);
        if (data) {
          fetchEmployees(data.id);
        }
      }
    } catch (err) {
      console.error('Unerwarteter Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    }
  };

  const fetchLicenseInfo = async () => {
    try {
      setLicenseLoading(true);
      const licenseData = await getPartnerLicense(user.id);
      setLicense(licenseData);
    } catch (err) {
      console.error('Fehler beim Laden der Lizenzinformationen:', err);
    } finally {
      setLicenseLoading(false);
    }
  };

  const fetchEmployees = async (userId) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at, updated_at, role')
        .eq('employee_id', userId);
      
      if (error) {
        console.error('Fehler beim Laden der Mitarbeiter:', error);
        setError('Mitarbeiter konnten nicht geladen werden.');
        return;
      }
      
      const formattedEmployees = await Promise.all(data.map(async (emp) => {
        const { data: userData, error: userError } = await supabase
          .auth.admin.getUserById(emp.id);
        
        let email = '';
        if (!userError && userData && userData.user) {
          email = userData.user.email || '';
        }
        
        return {
          id: emp.id,
          firstName: emp.first_name || '',
          lastName: emp.last_name || '',
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Kein Name',
          email: email,
          role: emp.role || 'End-user',
          created_at: new Date(emp.created_at).toLocaleDateString('de-DE')
        };
      }));
      
      setEmployees(formattedEmployees);
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Mitarbeiter:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setError(null);
    await fetchUserProfile();
    await fetchLicenseInfo();
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Hilfsfunktionen für Berechnungen
  const calculatePercentage = (used, limit) => {
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getProgressColor = (percentage) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLicenseTierName = (tier) => {
    const tiers = {
      'starter': 'Starter',
      'professional': 'Professional',
      'enterprise_basic': 'Enterprise Basic',
      'enterprise_pro': 'Enterprise Pro',
      'enterprise_custom': 'Enterprise Custom'
    };
    return tiers[tier] || tier;
  };

  if (licenseLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Lade Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mit Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück zur App
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Übersicht über End-user, Tokens und Lizenz</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center shadow-sm">
          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center shadow-sm">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hauptstatistiken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* End-user Karte */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="p-3 bg-blue-50 rounded-2xl w-fit mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aktive End-user</h4>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-5xl font-light text-gray-900">{employees.length}</span>
                <span className="text-xl text-gray-500">/ {license?.customer_limit || 5}</span>
              </div>
              <p className="text-gray-500">Benutzer in Ihrem System</p>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Auslastung</span>
                  <span>{calculatePercentage(employees.length, license?.customer_limit || 5)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculatePercentage(employees.length, license?.customer_limit || 5))}`}
                    style={{ width: `${calculatePercentage(employees.length, license?.customer_limit || 5)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Details</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Verfügbar</span>
                  <span className="text-sm font-medium text-gray-900">{(license?.customer_limit || 5) - employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Limit</span>
                  <span className="text-sm font-medium text-gray-900">{license?.customer_limit || 5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Lizenz</span>
                  <span className="text-sm font-medium text-gray-900">{getLicenseTierName(license?.license_tier)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Karte */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="p-3 bg-green-50 rounded-2xl w-fit mb-6">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Token-Verbrauch</h4>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-5xl font-light text-gray-900">{Math.round((license?.tokens_used || 0) / 1000)}k</span>
                <span className="text-xl text-gray-500">/ {Math.round((license?.token_limit || 150000) / 1000)}k</span>
              </div>
              <p className="text-gray-500">Tokens diesen Monat</p>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Verbrauch</span>
                  <span>{calculatePercentage(license?.tokens_used || 0, license?.token_limit || 150000)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculatePercentage(license?.tokens_used || 0, license?.token_limit || 150000))}`}
                    style={{ width: `${calculatePercentage(license?.tokens_used || 0, license?.token_limit || 150000)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Details</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Verbraucht</span>
                  <span className="text-sm font-medium text-gray-900">{(license?.tokens_used || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Verfügbar</span>
                  <span className="text-sm font-medium text-gray-900">{((license?.token_limit || 150000) - (license?.tokens_used || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reset</span>
                  <span className="text-sm font-medium text-gray-900">In 12 Tagen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schnellzugriff */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-gray-900">Schnellzugriff</h2>
          <span className="text-sm text-gray-500">Häufige Aufgaben</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-center cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">End-user hinzufügen</h4>
            <p className="text-xs text-gray-500">Neuen Benutzer erstellen</p>
            {employees.length >= (license?.customer_limit || 5) && (
              <p className="text-red-500 text-xs mt-1">Limit erreicht</p>
            )}
          </div>
          
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-center cursor-pointer">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Support</h4>
            <p className="text-xs text-gray-500">Tickets verwalten</p>
          </div>
          
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-center cursor-pointer">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Palette className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">App-Anpassen</h4>
            <p className="text-xs text-gray-500">Design & Branding</p>
          </div>
          
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 text-center cursor-pointer">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Lizenz-Info</h4>
            <p className="text-xs text-gray-500">Lizenz verwalten</p>
          </div>
        </div>
      </div>

      {/* Zusätzliche Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monatliche Gebühr</p>
              <p className="text-2xl font-semibold text-gray-900">{license?.monthly_fee || 99} EUR</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lizenz-Status</p>
              <p className="text-2xl font-semibold text-green-600">Aktiv</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nächste Abrechnung</p>
              <p className="text-lg font-semibold text-gray-900">{license?.next_billing_date || 'Nicht festgelegt'}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Neueste End-user */}
      {employees.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-light text-gray-900">Neueste End-user</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {employees.slice(0, 5).map((employee) => (
                <div key={employee.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {employee.firstName?.charAt(0) || employee.lastName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{employee.role}</p>
                      <p className="text-xs text-gray-400">Erstellt: {employee.created_at}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {employees.length > 5 && (
              <div className="p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">... und {employees.length - 5} weitere End-user</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;