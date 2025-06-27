import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { supabase } from '../../components/SupaBase/supabaseClient';
import Sidebar from './Sidebar';

// 🆕 Admin Components (diese müssen noch erstellt werden im Ordner src/components/AdminComponents/)
// Für jetzt importieren wir sie als Platzhalter - später durch echte Komponenten ersetzen
import { AdminDashboard } from '../AdminComponents/AdminDashboard';
import { AddUserComponent } from '../AdminComponents/AddUserComponent';
import { SupportComponent } from '../AdminComponents/SupportComponent';
import { LicenseComponent } from '../AdminComponents/LicenseComponent';
import BrandingEditor from '../AdminComponents/BrandingEditor';

// 🔧 FALLBACK: Falls Admin-Komponenten noch nicht existieren, zeige Platzhalter
const PlaceholderComponent = ({ title, onBack }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Zurück
        </button>
        <div>
          <h1 className="text-3xl font-light text-gray-900">{title}</h1>
          <p className="text-gray-500">Diese Komponente wird noch entwickelt</p>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">In Entwicklung</h3>
      <p className="text-gray-600">Die {title}-Komponente wird gerade entwickelt.</p>
    </div>
  </div>
);

const PartnerAppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAdminView, setActiveAdminView] = useState(null);
  const [showBrandingEditor, setShowBrandingEditor] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Benutzerprofil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('employee_id, role, first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (!error) {
            setUserProfile(data);
            console.log('🔍 PartnerAppLayout - User Profile:', data);
          }
        } catch (err) {
          console.error('PartnerAppLayout - Error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Bestimme ob User Admin ist
  const isAdmin = userProfile?.employee_id === null || 
                 ['partner', 'admin', 'mitarbeiter'].includes(userProfile?.role?.toLowerCase());

  console.log('🎯 PartnerAppLayout - Is Admin:', isAdmin);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 🔧 KERN-FUNKTION: Handler für Admin-Panel-Aktionen
  const handleAdminAction = (action) => {
    if (!isAdmin) {
      console.warn('⚠️ Non-admin user attempted admin action:', action);
      return; // Sicherheitscheck
    }
    
    console.log('🎯 PartnerAppLayout - Admin Action:', action);
    
    // Schließe Branding-Editor falls offen
    setShowBrandingEditor(false);
    
    switch (action) {
      case 'dashboard':
        setActiveAdminView('dashboard');
        break;
      case 'add-user':
        setActiveAdminView('add-user');
        break;
      case 'support':
        setActiveAdminView('support');
        break;
      case 'license':
        setActiveAdminView('license');
        break;
      case 'branding':
        // Besonderheit: Branding öffnet rechte Sidebar, nicht Hauptinhalt
        setActiveAdminView(null); 
        setShowBrandingEditor(true);
        break;
      default:
        console.warn('⚠️ Unknown admin action:', action);
        setActiveAdminView(null);
        break;
    }
  };

  // Zurück zur normalen App-Ansicht
  const handleBackToApp = () => {
    console.log('🔄 Back to normal app view');
    setActiveAdminView(null);
    setShowBrandingEditor(false);
  };

  // Branding-Editor schließen
  const handleCloseBrandingEditor = () => {
    console.log('🎨 Closing branding editor');
    setShowBrandingEditor(false);
  };

  // 🔧 KERN-FUNKTION: Bestimme was im Hauptinhalt gerendert werden soll
  const renderMainContent = () => {
    // Wenn Admin-View aktiv ist, zeige Admin-Content
    if (isAdmin && activeAdminView) {
      console.log('🎯 Rendering admin view:', activeAdminView);
      
      try {
        switch (activeAdminView) {
          case 'dashboard':
            return <AdminDashboard onBack={handleBackToApp} />;
          case 'add-user':
            return <AddUserComponent onBack={handleBackToApp} />;
          case 'support':
            return <SupportComponent onBack={handleBackToApp} />;
          case 'license':
            return <LicenseComponent onBack={handleBackToApp} />;
          default:
            return <Outlet />; // Fallback zu normalen App-Routen
        }
      } catch (error) {
        console.warn('⚠️ Admin component not found, showing placeholder:', activeAdminView);
        // Fallback auf Platzhalter wenn Komponente noch nicht existiert
        const titles = {
          'dashboard': 'Admin Dashboard',
          'add-user': 'End-user hinzufügen',
          'support': 'Support Center',
          'license': 'Lizenz-Informationen'
        };
        return <PlaceholderComponent title={titles[activeAdminView]} onBack={handleBackToApp} />;
      }
    }
    
    // Normale App-Inhalte (TeamManagement, Tasks, etc.)
    console.log('🎯 Rendering normal app content');
    return <Outlet />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* 🔧 SIDEBAR: Mit Admin-Action Handler */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        onAdminAction={handleAdminAction} // 🎯 Wichtig: Admin-Actions weiterleiten
      />
      
      {/* 🔧 MAIN CONTENT AREA: Responsive Layout */}
      <div className={`flex-1 transition-all duration-300 ${
        isSidebarOpen ? 'ml-56' : 'ml-16'
      } ${
        showBrandingEditor ? 'mr-96' : ''
      }`}>
        <main className="p-6 h-full relative">
          {renderMainContent()}
        </main>
      </div>
      
      {/* 🔧 BRANDING EDITOR: Rechte Sidebar */}
      {showBrandingEditor && isAdmin && (
        <div className="fixed right-0 top-0 h-full w-96 z-40">
          <BrandingEditor 
            onClose={handleCloseBrandingEditor}
            className="w-full h-full bg-white border-l border-gray-200 shadow-lg"
          />
        </div>
      )}
      
      {/* 🔧 OVERLAY: Für mobile Branding Editor */}
      {showBrandingEditor && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30 lg:hidden"
          onClick={handleCloseBrandingEditor}
        />
      )}
    </div>
  );
};

export default PartnerAppLayout;