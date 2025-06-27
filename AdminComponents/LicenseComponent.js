import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CreditCard, Users, Settings, Package, 
  RefreshCw, TrendingUp, Calendar, CheckCircle, 
  AlertTriangle, Star, Zap, Crown, Award, Plus
} from 'lucide-react';
import { supabase, getPartnerLicense, checkLicenseFeature } from '../SupaBase/supabaseClient';
import { useAuth } from '../../pages/Auth/AuthContext';

// Lizenz-Stufen mit detaillierten Informationen
const LICENSE_TIERS = {
  starter: {
    name: 'Starter',
    price: '99 EUR/Monat',
    setupFee: '149 EUR',
    customerLimit: 5,
    tokenLimit: 150000,
    icon: Package,
    color: 'blue',
    features: [
      'Subdomain vom Anbieter',
      '4 Standardagenten - keine Individualisierung',
      'Einfaches Branding (Logo, Farben)',
      'Vorlagen für Rechtstexte (unverbindlich)',
      'Support: nur an Partner (72h)'
    ]
  },
  professional: {
    name: 'Professional',
    price: '249 EUR/Monat',
    setupFee: '299 EUR',
    customerLimit: 25,
    tokenLimit: 750000,
    icon: Star,
    color: 'purple',
    features: [
      'Eigene Subdomain',
      '1 von 4 Agenten individuell anpassbar',
      'Agent kann in Stil, Tonalität, Interaktionsverhalten geändert werden',
      'Anpassung Startnachricht, Farben, Titel',
      'Support: 48h'
    ]
  },
  enterprise_basic: {
    name: 'Enterprise Basic',
    price: '599 EUR/Monat',
    setupFee: '699 EUR',
    customerLimit: 100,
    tokenLimit: 3500000,
    icon: Zap,
    color: 'indigo',
    features: [
      'Eigene Domain, CI/CD',
      'Ab 3 vollständig anpassbare Agentenrollen',
      'Impressum, Hosting-Konfiguration',
      'Technischer Support bei Integration',
      'Supportzeit: 24h'
    ]
  },
  enterprise_pro: {
    name: 'Enterprise Pro',
    price: '849 EUR/Monat',
    setupFee: '699 EUR',
    customerLimit: 150,
    tokenLimit: 5000000,
    icon: Crown,
    color: 'violet',
    features: [
      'Bis zu 5 eigene Rollen',
      'CI/CD-Vollzugriff',
      'UX-/Branding komplett individualisierbar',
      'Supportzeit: 24h'
    ]
  },
  enterprise_custom: {
    name: 'Enterprise Custom',
    price: 'ab 1.199 EUR/Monat',
    setupFee: 'nach Aufwand',
    customerLimit: 200,
    tokenLimit: 10000000,
    icon: Award,
    color: 'fuchsia',
    features: [
      'Eigener Code (React)',
      'Hosting',
      'API-Logik',
      'Rollenarchitektur'
    ]
  }
};

// Add-ons für Token und Kunden
const ADD_ONS = {
  tokens: [
    { name: '+100.000 Tokens', price: '19 EUR/Monat', tokens: 100000 },
    { name: '+250.000 Tokens', price: '39 EUR/Monat', tokens: 250000 },
    { name: '+1.000.000 Tokens', price: '139 EUR/Monat', tokens: 1000000 }
  ],
  customers: {
    starter: { name: '+10 Endkunden', price: '49 EUR', customers: 10 },
    professional: { name: '+10 Endkunden', price: '79 EUR', customers: 10 },
    enterprise: { name: '+10 Endkunden', price: '99 EUR', customers: 10 }
  }
};

const LicenseComponent = ({ onBack }) => {
  const { user } = useAuth();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [canCustomizeAgents, setCanCustomizeAgents] = useState([]);
  const [canUseCustomDomain, setCanUseCustomDomain] = useState(false);
  const [canUseCustomSubdomain, setCanUseCustomSubdomain] = useState(false);

  // Lizenzinformationen laden
  useEffect(() => {
    if (user) {
      fetchLicenseInfo();
      fetchCustomerCount();
      fetchLicenseFeatures();
    }
  }, [user]);

  const fetchLicenseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const licenseData = await getPartnerLicense(user.id);
      
      if (!licenseData) {
        // Wenn keine Lizenz gefunden wurde, erstelle eine Standard-Lizenz
        const newLicense = await createDefaultLicense();
        setLicense(newLicense);
      } else {
        setLicense(licenseData);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Lizenzinformationen:', err);
      setError('Lizenzinformationen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultLicense = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_licenses')
        .insert([{
          user_id: user.id,
          license_tier: 'starter',
          status: 'active',
          customer_limit: 5,
          token_limit: 150000,
          tokens_used: 0,
          setup_fee: 149,
          monthly_fee: 99,
          billing_day: 1,
          next_billing_date: getNextBillingDate(1),
          branding_config: {},
          agent_customization: { cmo: false, cfo: false, coo: false, second_brain: false }
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Fehler beim Erstellen der Standard-Lizenz:', err);
      setError('Standard-Lizenz konnte nicht erstellt werden.');
      return null;
    }
  };

  const getNextBillingDate = (billingDay) => {
    const today = new Date();
    let nextMonth = today.getMonth() + 1;
    let year = today.getFullYear();
    
    if (nextMonth > 11) {
      nextMonth = 0;
      year++;
    }
    
    const nextDate = new Date(year, nextMonth, billingDay);
    return nextDate.toISOString().split('T')[0];
  };

  const fetchCustomerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id);
      
      if (error) {
        console.error('Fehler beim Zählen der Kunden:', error);
      } else {
        setCustomerCount(count || 0);
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Zählen der Kunden:', err);
    }
  };

  const fetchLicenseFeatures = async () => {
    try {
      const agentCustomization = await checkLicenseFeature(user.id, 'agent_customization');
      setCanCustomizeAgents(agentCustomization.allowed ? agentCustomization.customizable : []);
      
      const customDomain = await checkLicenseFeature(user.id, 'custom_domain');
      setCanUseCustomDomain(customDomain.allowed);
      
      const customSubdomain = await checkLicenseFeature(user.id, 'custom_subdomain');
      setCanUseCustomSubdomain(customSubdomain.allowed);
    } catch (err) {
      console.error('Fehler beim Laden der Lizenz-Features:', err);
    }
  };

  const calculatePercentage = (used, limit) => {
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getProgressColor = (percentage) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCurrentTierInfo = () => {
    return LICENSE_TIERS[license?.license_tier] || LICENSE_TIERS.starter;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      violet: 'bg-violet-50 text-violet-600 border-violet-200',
      fuchsia: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200'
    };
    return colors[color] || colors.blue;
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Lizenzinformationen werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </button>
          <h1 className="text-3xl font-light text-gray-900">Lizenz-Informationen</h1>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle size={20} className="inline-block mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!license) return null;

  const currentTier = getCurrentTierInfo();
  const customerPercentage = calculatePercentage(customerCount, license.customer_limit);
  const tokenPercentage = calculatePercentage(license.tokens_used || 0, license.token_limit);
  const TierIcon = currentTier.icon;

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
            <h1 className="text-3xl font-light text-gray-900">Lizenz-Informationen</h1>
            <p className="text-gray-500">Ihre aktuelle Lizenz verwalten und upgraden</p>
          </div>
        </div>
        <button
          onClick={fetchLicenseInfo}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Aktualisieren
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center shadow-sm">
          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Aktuelle Lizenz Übersicht */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-6 ${getColorClasses(currentTier.color)} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-white rounded-2xl shadow-sm`}>
                <TierIcon size={32} className={`text-${currentTier.color}-600`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ihre Lizenz: {currentTier.name}</h2>
                <p className="text-lg font-medium mt-1">{currentTier.price}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Aktiv
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <CreditCard size={18} className="text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Monatliche Gebühr</div>
                <div className="font-medium text-lg">{license.monthly_fee} EUR</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar size={18} className="text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Nächste Abrechnung</div>
                <div className="font-medium text-lg">{license.next_billing_date || 'Nicht festgelegt'}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Package size={18} className="text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Einrichtungsgebühr</div>
                <div className="font-medium text-lg">{currentTier.setupFee}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutzungsstatistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kunden-Statistik */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users size={20} className="mr-2 text-blue-600" />
              End-user Auslastung
            </h3>
            <span className="text-2xl font-bold text-gray-900">
              {customerCount} / {license.customer_limit}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Auslastung</span>
              <span>{customerPercentage}% genutzt</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(customerPercentage)}`}
                style={{ width: `${customerPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Verfügbar:</span>
              <span className="font-medium ml-1">{license.customer_limit - customerCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Limit:</span>
              <span className="font-medium ml-1">{license.customer_limit}</span>
            </div>
          </div>
        </div>

        {/* Token-Statistik */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Settings size={20} className="mr-2 text-green-600" />
              Token-Verbrauch
            </h3>
            <span className="text-2xl font-bold text-gray-900">
              {Math.round((license.tokens_used || 0) / 1000)}k / {Math.round(license.token_limit / 1000)}k
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Verbrauch</span>
              <span>{tokenPercentage}% genutzt</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(tokenPercentage)}`}
                style={{ width: `${tokenPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Verbraucht:</span>
              <span className="font-medium ml-1">{(license.tokens_used || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Verfügbar:</span>
              <span className="font-medium ml-1">{(license.token_limit - (license.tokens_used || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aktuelle Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold">Ihre aktuellen Features</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTier.features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Token Add-ons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h3 className="text-lg font-semibold text-green-900">Token-Pakete hinzufügen</h3>
          </div>
          <div className="p-6 space-y-3">
            {ADD_ONS.tokens.map((tokenPackage, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-medium">{tokenPackage.name}</div>
                  <div className="text-sm text-gray-500">{tokenPackage.price}</div>
                </div>
                <button className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  <Plus size={14} className="mr-1" />
                  Hinzufügen
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Kunden Add-ons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900">End-user Limit erhöhen</h3>
          </div>
          <div className="p-6">
            {(() => {
              let addon = ADD_ONS.customers.starter;
              if (['enterprise_basic', 'enterprise_pro', 'enterprise_custom'].includes(license.license_tier)) {
                addon = ADD_ONS.customers.enterprise;
              } else if (license.license_tier === 'professional') {
                addon = ADD_ONS.customers.professional;
              }

              return (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium">{addon.name}</div>
                    <div className="text-sm text-gray-500">{addon.price}</div>
                  </div>
                  <button className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    <Plus size={14} className="mr-1" />
                    Hinzufügen
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Upgrade-Optionen */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-purple-900">Lizenz upgraden</h3>
          <p className="text-sm text-purple-700 mt-1">Erweitern Sie Ihre Möglichkeiten mit höheren Lizenzstufen</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(LICENSE_TIERS).map(([tierId, tierInfo]) => {
              if (tierId === license.license_tier) return null;
              
              const TierIcon = tierInfo.icon;
              const isUpgrade = Object.keys(LICENSE_TIERS).indexOf(tierId) > Object.keys(LICENSE_TIERS).indexOf(license.license_tier);
              
              return (
                <div 
                  key={tierId}
                  className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    isUpgrade ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <TierIcon size={20} className={`mr-2 text-${tierInfo.color}-600`} />
                      <h4 className="font-semibold">{tierInfo.name}</h4>
                    </div>
                    <div className="text-sm font-medium">{tierInfo.price}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">End-user:</span>
                      <span className="font-medium ml-1">{tierInfo.customerLimit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tokens:</span>
                      <span className="font-medium ml-1">{(tierInfo.tokenLimit / 1000).toLocaleString()}k</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {tierInfo.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-start">
                        <CheckCircle size={10} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                    {tierInfo.features.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{tierInfo.features.length - 2} weitere Features
                      </div>
                    )}
                  </div>

                  <button 
                    className={`w-full py-2 px-3 text-sm rounded transition-colors ${
                      isUpgrade 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!isUpgrade}
                  >
                    {isUpgrade ? (
                      <>
                        <TrendingUp size={14} className="inline mr-1" />
                        Upgrade
                      </>
                    ) : (
                      'Downgrade nicht verfügbar'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseComponent;