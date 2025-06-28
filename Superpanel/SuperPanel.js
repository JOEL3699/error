import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { supabase } from '../../components/SupaBase/supabaseClient';
import SuperPanelSidebar from './SuperPanelSidebar';
import SuperPanelDashboard from './SuperPanelDashboard';
import { RefreshCw, Shield } from 'lucide-react';

const SuperPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('partners');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Partner Data
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Setup Requests Data
  const [setupRequests, setSetupRequests] = useState([]);

  // Support Tickets Data
  const [supportTickets, setSupportTickets] = useState([]);

  // Modals
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    licenseType: 'starter',
    isSuperAdmin: false
  });

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: null,
    actionType: ''
  });

  // License Tiers
  const LICENSE_TIERS = {
    starter: {
      name: "Starter",
      monthlyFee: 99,
      setupFee: 149,
      customerLimit: 5,
      tokenLimit: 150000
    },
    professional: {
      name: "Professional",
      monthlyFee: 249,
      setupFee: 299,
      customerLimit: 25,
      tokenLimit: 750000
    },
    enterprise_basic: {
      name: "Enterprise Basic",
      monthlyFee: 599,
      setupFee: 699,
      customerLimit: 100,
      tokenLimit: 3500000
    },
    enterprise_pro: {
      name: "Enterprise Pro",
      monthlyFee: 849,
      setupFee: 699,
      customerLimit: 150,
      tokenLimit: 5000000
    },
    enterprise_custom: {
      name: "Enterprise Custom",
      monthlyFee: 1199,
      setupFee: 999,
      customerLimit: 200,
      tokenLimit: 10000000
    }
  };

  // Authorization Check
  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        if (user.email === 'joel-eric.joosten@gmx.de') {
          setAuthorized(true);
          await fetchPartners();
          await fetchMockData();
        } else {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Fehler beim Überprüfen des Super-Admin-Status:', error);
            setError('Fehler beim Überprüfen der Berechtigungen.');
          } else if (data && data.is_super_admin) {
            setAuthorized(true);
            await fetchPartners();
            await fetchMockData();
          } else {
            setAuthorized(false);
            setError('Sie haben keine Berechtigung, auf dieses Panel zuzugreifen.');
          }
        }
      } catch (err) {
        console.error('Unerwarteter Fehler:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };
    
    checkSuperAdminStatus();
  }, [user]);

  // Search Effect
  useEffect(() => {
    if (partners.length > 0) {
      const filtered = partners.filter(partner => 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.license_tier.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  }, [searchTerm, partners]);

  // Fetch Partners
  const fetchPartners = async () => {
    try {
      setLoading(true);
      
      if (user.email !== 'joel-eric.joosten@gmx.de') {
        const { data: adminCheck, error: adminError } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .single();
        
        if (adminError || !adminCheck || !adminCheck.is_super_admin) {
          setError('Du hast keine Berechtigung, auf diese Seite zuzugreifen.');
          setLoading(false);
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          is_super_admin,
          created_at,
          super_admin_id
        `)
        .eq('super_admin_id', user.id);
      
      if (error) {
        console.error('Fehler beim Laden der Partner:', error);
        setError('Partner konnten nicht geladen werden.');
        return;
      }
      
      const enhancedData = await Promise.all(data.map(async (profile) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
        
        let email = 'Keine E-Mail';
        if (!userError && userData) {
          email = userData.email || 'Keine E-Mail';
        }
        
        return {
          ...profile,
          email
        };
      }));
      
      const partnersWithLicense = await Promise.all(enhancedData.map(async (profile) => {
        const { data: licenseData, error: licenseError } = await supabase
          .from('partner_licenses')
          .select('*')
          .eq('user_id', profile.id)
          .single();
          
        let licenseInfo = {
          license_tier: 'starter',
          status: 'active',
          customer_limit: 5,
          token_limit: 150000,
          tokens_used: 0
        };
        
        if (!licenseError && licenseData) {
          licenseInfo = licenseData;
        }
        
        const { count: customerCount, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', profile.id);
          
        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Kein Name',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email,
          isSuperAdmin: profile.is_super_admin || false,
          createdAt: profile.created_at,
          ...licenseInfo,
          customerCount: customerCount || 0
        };
      }));
      
      setPartners(partnersWithLicense);
      setFilteredPartners(partnersWithLicense);
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Partner:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Support Tickets from database - HIER IST DIE KORREKTUR!
  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      
      // Alle Support-Tickets abrufen (OHNE email aus profiles - das war der Fehler!)
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (ticketsError) {
        console.error('Fehler beim Laden der Support-Tickets:', ticketsError);
        setError('Support-Tickets konnten nicht geladen werden.');
        return;
      }
      
      // E-Mail-Adressen separat über die Auth-API holen
      const ticketsWithEmails = await Promise.all(ticketsData.map(async (ticket) => {
        let partnerEmail = '';
        
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ticket.user_id);
          if (!userError && userData && userData.user) {
            partnerEmail = userData.user.email || '';
          }
        } catch (err) {
          console.error('Fehler beim Laden der E-Mail für Benutzer:', ticket.user_id, err);
        }
        
        return {
          ...ticket,
          partnerEmail
        };
      }));
      
      // Für jedes Ticket die zugehörigen Nachrichten abrufen
      const ticketsWithMessages = await Promise.all(ticketsWithEmails.map(async (ticket) => {
        const { data: messagesData, error: messagesError } = await supabase
          .from('support_messages')
          .select(`
            *,
            profiles:sender_id(first_name, last_name)
          `)
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error('Fehler beim Laden der Nachrichten:', messagesError);
          return {
            ...ticket,
            messages: []
          };
        }
        
        // Nachrichten formatieren
        const formattedMessages = messagesData.map(message => ({
          id: message.id,
          from: message.is_from_admin ? 'admin' : 'partner',
          sender: message.is_from_admin ? 'admin' : 'partner',
          text: message.content,
          timestamp: new Date(message.created_at).toISOString().replace('T', ' ').substring(0, 16),
          sender_id: message.sender_id,
          sender_name: message.profiles 
            ? `${message.profiles.first_name || ''} ${message.profiles.last_name || ''}`.trim() 
            : 'Unbekannt'
        }));
        
        return {
          id: ticket.id,
          partnerName: ticket.profiles 
            ? `${ticket.profiles.first_name || ''} ${ticket.profiles.last_name || ''}`.trim() 
            : 'Unbekannt',
          partnerEmail: ticket.partnerEmail, // Verwende die separat geladene E-Mail
          partnerId: ticket.user_id,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          created: new Date(ticket.created_at).toISOString().split('T')[0],
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          messages: formattedMessages
        };
      }));
      
      setSupportTickets(ticketsWithMessages);
      
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Support-Tickets:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Mock Data
  const fetchMockData = async () => {
    // Setze leere Arrays als Initialisierung
    setSetupRequests([]);
    setSupportTickets([]);
    
    // Lade echte Support-Tickets, wenn wir auf dem Support-Tab sind
    if (activeTab === 'support') {
      await fetchSupportTickets();
    }
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Modal functions
  const openAddPartnerModal = () => setIsAddPartnerModalOpen(true);
  const closeAddPartnerModal = () => {
    setIsAddPartnerModalOpen(false);
    resetForm();
  };
  
  const openLicenseModal = (partner) => {
    setSelectedPartner(partner);
    setIsLicenseModalOpen(true);
  };
  
  const closeLicenseModal = () => {
    setSelectedPartner(null);
    setIsLicenseModalOpen(false);
  };

  const openConfirmDialog = (title, message, confirmAction, actionType) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmAction,
      actionType
    });
  };
  
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      confirmAction: null,
      actionType: ''
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      licenseType: 'starter',
      isSuperAdmin: false
    });
    setError(null);
  };

  // If not authorized, show access denied
  if (!loading && !authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-4">Zugriff verweigert</h1>
          <p className="text-gray-300 text-center mb-6">
            Sie haben keine Berechtigung, auf das Super-Admin-Panel zuzugreifen.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zurück zum Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !filteredPartners.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-300">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <SuperPanelSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigate={navigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Dashboard */}
        <SuperPanelDashboard
          activeTab={activeTab}
          partners={filteredPartners}
          setupRequests={setupRequests}
          supportTickets={supportTickets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          error={error}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
          showSuccess={showSuccess}
          
          // Modal states
          isAddPartnerModalOpen={isAddPartnerModalOpen}
          isLicenseModalOpen={isLicenseModalOpen}
          selectedPartner={selectedPartner}
          confirmDialog={confirmDialog}
          formData={formData}
          setFormData={setFormData}
          
          // Modal functions
          openAddPartnerModal={openAddPartnerModal}
          closeAddPartnerModal={closeAddPartnerModal}
          openLicenseModal={openLicenseModal}
          closeLicenseModal={closeLicenseModal}
          openConfirmDialog={openConfirmDialog}
          closeConfirmDialog={closeConfirmDialog}
          resetForm={resetForm}
          
          // Data functions
          fetchPartners={fetchPartners}
          fetchMockData={fetchMockData}
          fetchSupportTickets={fetchSupportTickets}
          setPartners={setPartners}
          setFilteredPartners={setFilteredPartners}
          setSetupRequests={setSetupRequests}
          setSupportTickets={setSupportTickets}
          setLoading={setLoading}
          setError={setError}
          
          // Helper data
          LICENSE_TIERS={LICENSE_TIERS}
          user={user}
          supabase={supabase}
        />
      </div>
    </div>
  );
};

export default SuperPanel;