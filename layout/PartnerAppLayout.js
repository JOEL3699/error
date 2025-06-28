import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { supabase } from '../../components/SupaBase/supabaseClient';
import Sidebar from './Sidebar';
import BrandingEditor from '../AdminComponents/BrandingEditor';

const PartnerAppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showBrandingEditor, setShowBrandingEditor] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Benutzerprofil und prüfe URL Parameter
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
    
    // Prüfe URL Parameter für Branding-Editor
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('branding') === 'true') {
      setShowBrandingEditor(true);
      // URL Parameter entfernen ohne Page Reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, location.search]);

  // Bestimme ob User Admin ist
  const isAdmin = userProfile?.employee_id === null || 
                 ['partner', 'admin', 'mitarbeiter'].includes(userProfile?.role?.toLowerCase());

  console.log('🎯 PartnerAppLayout - Is Admin:', isAdmin);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Branding-Editor schließen
  const handleCloseBrandingEditor = () => {
    console.log('🎨 Closing branding editor');
    setShowBrandingEditor(false);
  };

  // 🔧 VEREINFACHT: Nur noch normale App-Inhalte rendern
  const renderMainContent = () => {
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
      {/* 🔧 SIDEBAR: Ohne Admin-Action Handler */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
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
      
      {/* 🔧 BRANDING EDITOR: Rechte Sidebar (Echt) */}
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