import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { 
  LayoutDashboard, UserPlus, MessageSquare, CreditCard, 
  Palette, LogOut, Settings, Menu, X, User
} from 'lucide-react';

// Import Admin Components
import AdminDashboard from '../AdminComponents/AdminDashboard';
import AddUserComponent from '../AdminComponents/AddUserComponent';
import SupportComponent from '../AdminComponents/SupportComponent';
import LicenseComponent from '../AdminComponents/LicenseComponent';

const AdminPanelLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Panel Navigation Items
  const adminItems = [
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      icon: LayoutDashboard, 
      color: 'text-blue-600'
    },
    { 
      id: 'add-user', 
      title: 'End-user hinzufügen', 
      icon: UserPlus, 
      color: 'text-green-600'
    },
    { 
      id: 'support', 
      title: 'Support Center', 
      icon: MessageSquare, 
      color: 'text-purple-600'
    },
    { 
      id: 'license', 
      title: 'Lizenz-Informationen', 
      icon: CreditCard, 
      color: 'text-orange-600'
    }
  ];

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
          }
        } catch (err) {
          console.error('AdminPanelLayout - Error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Prüfe Admin-Berechtigung
  const isAdmin = userProfile?.employee_id === null || 
                 ['partner', 'admin', 'mitarbeiter'].includes(userProfile?.role?.toLowerCase());

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  const handleAppCustomize = () => {
    // Wechsel zur normalen App mit Branding-Editor
    console.log('🎨 Wechsel zu App-Anpassung');
    navigate('/?branding=true');
  };

  // Render der aktiven Admin-Komponente
  const renderActiveComponent = () => {
    const handleBack = () => setActiveView('dashboard');
    
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard onBack={null} />; // Kein Back-Button im Dashboard
      case 'add-user':
        return <AddUserComponent onBack={handleBack} />;
      case 'support':
        return <SupportComponent onBack={handleBack} />;
      case 'license':
        return <LicenseComponent onBack={handleBack} />;
      default:
        return <AdminDashboard onBack={null} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Sicherheitscheck: Nur Admins haben Zugriff
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für das Admin Panel.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zur App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Admin Sidebar */}
      <div 
        className={`text-white ${isSidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300 flex flex-col h-screen fixed`}
        style={{ 
          backgroundColor: 'var(--primary-color, #3B82F6)',
          color: 'var(--sidebar-text-color, #ffffff)'
        }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white border-opacity-20">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold">Admin Panel</h1>
          )}
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md transition-colors hover:bg-white hover:bg-opacity-10"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* User Profile */}
        {user && (
          <div 
            className={`${isSidebarOpen ? 'mx-3 p-3' : 'mx-1 p-2'} my-4 rounded-lg flex flex-col items-center`}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center justify-center mb-2">
              <div 
                className={`${isSidebarOpen ? 'w-12 h-12' : 'w-9 h-9'} rounded-full flex items-center justify-center text-white`}
                style={{ backgroundColor: 'var(--secondary-color, #1D4ED8)' }}
              >
                <User size={isSidebarOpen ? 20 : 16} />
              </div>
            </div>
            
            {isSidebarOpen && (
              <div className="text-center">
                <p className="font-medium text-sm">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs opacity-75">{user.email}</p>
                <p className="text-xs text-yellow-300 mt-1">Administrator</p>
              </div>
            )}
          </div>
        )}
        
        {/* Admin Navigation */}
        <nav className="flex-1 overflow-y-auto px-2">
          <ul className="space-y-2">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center ${
                      isSidebarOpen ? 'justify-start' : 'justify-center'
                    } w-full p-3 rounded-md transition-all ${
                      isActive 
                        ? 'text-white' 
                        : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                    style={isActive ? {
                      backgroundColor: 'var(--secondary-color, #1D4ED8)'
                    } : {}}
                  >
                    <Icon size={20} />
                    {isSidebarOpen && (
                      <div className="ml-3 text-left">
                        <div className="font-medium">{item.title}</div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* App-Anpassen Button */}
        <div className="p-4 border-t border-white border-opacity-20">
          <button
            onClick={handleAppCustomize}
            className={`flex items-center ${
              isSidebarOpen ? 'justify-start' : 'justify-center'
            } w-full p-3 rounded-md transition-all bg-green-600 hover:bg-green-700 mb-2`}
          >
            <Palette size={20} />
            {isSidebarOpen && <span className="ml-3">App-Anpassen</span>}
          </button>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center ${
              isSidebarOpen ? 'justify-start' : 'justify-center'
            } w-full p-3 rounded-md transition-all bg-red-600 hover:bg-red-700`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3">Abmelden</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        isSidebarOpen ? 'ml-72' : 'ml-16'
      }`}>
        <main className="p-6 min-h-screen">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanelLayout;