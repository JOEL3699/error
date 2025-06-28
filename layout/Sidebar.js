import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckSquare, Calendar, Settings, LogOut,
  Menu, X, LayoutDashboard, MessageSquare, UserPlus,
  CreditCard, Palette, HelpCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../pages/Auth/AuthContext';
import { supabase, getRecentConversationsByUserId } from '../../components/SupaBase/supabaseClient';
import { agentsData } from '../../pages/TeamManagement/TeamManagement';

const Sidebar = ({ isSidebarOpen, toggleSidebar, isPreviewMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // 🔧 STATES mit besserer Struktur zur Vermeidung von Loops
  const [userStatus, setUserStatus] = useState({
    profile: null,
    isAdmin: false,
    isEndUser: false,
    checked: false,
    loading: true
  });
  
  const [recentChats, setRecentChats] = useState([]);
  const [isChatsLoading, setIsChatsLoading] = useState(true);

  // 🔧 REFS zur Vermeidung von Endlos-Schleifen
  const profileLoadingRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const chatsLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Mock User Data für Preview
  const mockUser = isPreviewMode ? {
    id: 'preview-user-123',
    email: 'max.mustermann@preview.com',
    user_metadata: {
      first_name: 'Max',
      last_name: 'Mustermann'
    }
  } : null;
  
  const currentUser = isPreviewMode ? mockUser : user;

  // Hide scrollbars with CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .sidebar-no-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `;
    style.setAttribute('data-sidebar-scrollbar-hide', 'true');
    
    if (!document.head.querySelector('style[data-sidebar-scrollbar-hide]')) {
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.head.querySelector('style[data-sidebar-scrollbar-hide]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []); // 🔧 Empty dependencies - nur einmal ausführen

  // Mock-Daten für Preview-Modus
  const mockData = isPreviewMode ? {
    recentChats: [
      {
        id: 'preview-chat-1',
        agentId: 'second-brain',
        agentName: 'AI Assistent',
        lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
        hasUserMessages: true
      },
      {
        id: 'preview-chat-2', 
        agentId: 'cmo',
        agentName: 'Marketing Experte',
        lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
        hasUserMessages: true
      },
      {
        id: 'preview-chat-3',
        agentId: 'cfo', 
        agentName: 'Finanz Berater',
        lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
        hasUserMessages: true
      }
    ]
  } : null;

  // 🔧 VERBESSERTE FUNKTION: User Profile abrufen - nur einmal pro User
  useEffect(() => {
    const fetchUserProfile = async () => {
      // 🔧 Verhindere mehrfache Profile-Loads für denselben User
      if (!currentUser?.id || 
          profileLoadingRef.current || 
          currentUserIdRef.current === currentUser.id ||
          userStatus.checked) {
        console.log('🔧 Sidebar: Profile loading skipped for user:', currentUser?.id);
        return;
      }

      if (isPreviewMode) {
        // Im Preview-Modus: Mock-Admin-Profil
        setUserStatus({
          profile: { employee_id: null, role: 'partner' },
          isAdmin: true,
          isEndUser: false,
          checked: true,
          loading: false
        });
        return;
      }

      try {
        profileLoadingRef.current = true;
        currentUserIdRef.current = currentUser.id;
        
        console.log('🔧 Sidebar: Loading profile for user:', currentUser.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('employee_id, role, first_name, last_name')
          .eq('id', currentUser.id)
          .single();
        
        if (!mountedRef.current) return; // Component unmounted check
        
        if (error) {
          console.error('Error fetching user profile:', error);
          setUserStatus({
            profile: null,
            isAdmin: false,
            isEndUser: true, // Fallback to end user
            checked: true,
            loading: false
          });
        } else {
          console.log('🔍 Sidebar - User Profile:', data);
          
          // Bestimme User-Typ basierend auf Profil
          const isAdmin = data?.employee_id === null || 
                         ['partner', 'admin', 'mitarbeiter'].includes(data?.role?.toLowerCase());
          const isEndUser = !isAdmin;
          
          setUserStatus({
            profile: data,
            isAdmin,
            isEndUser,
            checked: true,
            loading: false
          });
        }
      } catch (err) {
        console.error('Error:', err);
        if (mountedRef.current) {
          setUserStatus({
            profile: null,
            isAdmin: false,
            isEndUser: true,
            checked: true,
            loading: false
          });
        }
      } finally {
        profileLoadingRef.current = false;
      }
    };
    
    fetchUserProfile();
  }, [currentUser?.id, isPreviewMode]); // 🔧 Nur bei User-ID-Änderung, nicht bei user-Objekt-Änderung

  // 🔧 VERBESSERTE FUNKTION: Recent Chats laden - nur einmal pro User
  const fetchRecentChats = async () => {
    // 🔧 Verhindere mehrfache Chat-Loads für denselben User
    if (!currentUser?.id || 
        chatsLoadingRef.current || 
        (currentUserIdRef.current === currentUser.id && recentChats.length > 0)) {
      console.log('🔧 Sidebar: Chat loading skipped for user:', currentUser?.id);
      setIsChatsLoading(false);
      return;
    }

    if (isPreviewMode) {
      // Im Preview-Modus: Mock-Daten verwenden
      if (mockData?.recentChats) {
        setRecentChats(mockData.recentChats);
      }
      setIsChatsLoading(false);
      return;
    }
    
    try {
      chatsLoadingRef.current = true;
      setIsChatsLoading(true);
      
      console.log('🔧 Sidebar: Loading chats for user:', currentUser.id);
      
      const { conversations, error } = await getRecentConversationsByUserId(currentUser.id, 10);
      
      if (!mountedRef.current) return; // Component unmounted check
      
      if (error) {
        console.error('Fehler beim Laden der Konversationen:', error);
        setIsChatsLoading(false);
        return;
      }
      
      if (!conversations || conversations.length === 0) {
        setRecentChats([]);
        setIsChatsLoading(false);
        return;
      }
      
      const formattedChats = conversations.map(conv => {
        const agent = agentsData.find(a => a.id === conv.agent_id) || {
          name: 'Unbekannter Agent'
        };
        
        const lastMessage = conv.lastMessage;
        
        return {
          id: conv.id,
          agentId: conv.agent_id,
          agentName: agent.name,
          lastMessageTime: lastMessage?.timestamp || lastMessage?.created_at || conv.updated_at
        };
      });
      
      setRecentChats(formattedChats);
      setIsChatsLoading(false);
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden der Konversationen:', error);
      if (mountedRef.current) {
        setIsChatsLoading(false);
      }
    } finally {
      chatsLoadingRef.current = false;
    }
  };
  
  useEffect(() => {
    // 🔧 Chats nur laden wenn User-Status bereits gecheckt wurde
    if (currentUser?.id && userStatus.checked && !userStatus.loading) {
      fetchRecentChats();
    } else {
      setIsChatsLoading(false);
    }
  }, [currentUser?.id, userStatus.checked, userStatus.loading]); // 🔧 Abhängig von User-Status

  // 🔧 Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Standard-Menüelemente (für alle User)
  const menuItems = [
    { title: 'Führungsteam', icon: <Users size={20} />, path: '/' },
    { title: 'Aufgaben', icon: <CheckSquare size={20} />, path: '/tasks' },
    { title: 'Kalender', icon: <Calendar size={20} />, path: '/calendar' },
    { title: 'Verwaltung', icon: <Settings size={20} />, path: '/admin' },
  ];

  // 🆕 Dashboard-Button für Partner/Mitarbeiter (zurück zum Admin Panel)
  const dashboardButton = userStatus.isAdmin ? {
    title: 'Admin Dashboard',
    icon: <LayoutDashboard size={16} />,
    action: 'admin-dashboard',
    description: 'Zurück zum Admin Panel'
  } : null;

  const handleAdminAction = (action) => {
    console.log('🎯 Sidebar - Admin Action:', action);
    if (action === 'admin-dashboard') {
      // Navigation zum Admin Dashboard
      if (isPreviewMode) {
        console.log('Preview: Admin Dashboard clicked');
        return;
      }
      navigate('/admin-dashboard');
      return;
    }
  };

  const handleChatClick = (conversationId, agentId) => {
    if (isPreviewMode) {
      console.log('Preview: Chat clicked', { conversationId, agentId });
      return;
    }
    navigate(`/agent-chat/${agentId}?conversationId=${conversationId}`);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const handleLogout = async () => {
    if (isPreviewMode) {
      console.log('Preview: Logout clicked');
      return;
    }
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  const handleNavigation = (path) => {
    if (isPreviewMode) {
      console.log('Preview: Navigation to', path);
      return;
    }
    navigate(path);
  };

  return (
    <div 
      className={`text-white ${isSidebarOpen ? 'w-56' : 'w-16'} transition-all duration-300 flex flex-col h-screen ${isPreviewMode ? 'relative' : 'fixed'}`}
      style={{ 
        backgroundColor: 'var(--primary-color, #3B82F6)',
        color: 'var(--sidebar-text-color, #ffffff)'
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {isSidebarOpen && (
          <h1 className="text-xl font-bold">
            {isPreviewMode ? 'Preview' : 'Dashboard'}
          </h1>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-md transition-colors"
          style={{ 
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Preview-Mode Indicator */}
      {isPreviewMode && isSidebarOpen && (
        <div className="mx-3 mb-2 px-2 py-1 bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded text-xs text-yellow-100 text-center">
          Vorschau-Modus
        </div>
      )}
      
      {/* User Profile */}
      {currentUser && (
        <div 
          className={`${isSidebarOpen ? 'mx-3 p-3' : 'mx-1 p-2'} my-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors`}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onClick={() => !isPreviewMode && handleNavigation('/profile')}
        >
          <div className="flex items-center justify-center mb-2">
            <div 
              className={`${isSidebarOpen ? 'w-10 h-10' : 'w-9 h-9'} rounded-full flex items-center justify-center text-white`}
              style={{ backgroundColor: 'var(--secondary-color, #1D4ED8)' }}
            >
              {currentUser.user_metadata?.first_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
            </div>
          </div>
          
          {isSidebarOpen && (
            <div className="text-center">
              <p className="font-medium text-sm">
                {currentUser.user_metadata?.first_name} {currentUser.user_metadata?.last_name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text-muted, #f0f0f0)' }}>
                {currentUser.email}
              </p>
              {userStatus.isAdmin && <p className="text-xs text-yellow-300">Admin</p>}
              {isPreviewMode && <p className="text-xs text-yellow-300">Demo User</p>}
            </div>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto sidebar-no-scrollbar"
      >
        <ul className="space-y-2 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.title}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center ${
                    isSidebarOpen ? 'justify-start' : 'justify-center'
                  } w-full p-3 rounded-md transition-all relative ${
                    isActive
                      ? 'text-white' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                  style={isActive ? {
                    backgroundColor: 'var(--secondary-color, #1D4ED8)'
                  } : {}}
                >
                  <span>{item.icon}</span>
                  {isSidebarOpen && <span className="ml-3">{item.title}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* 🔧 NEUE SEKTION: Recent Chats (für alle User) */}
        {isSidebarOpen && currentUser && (
          <div className="mt-6 px-2">
            <h3 className="text-sm uppercase font-semibold mb-2 px-2" style={{ color: 'var(--sidebar-text-muted, #f0f0f0)' }}>
              💬 Kürzliche Chats
            </h3>
            
            {/* Recent Chats für alle User */}
            <div>
              {isChatsLoading ? (
                <div className="flex items-center justify-center py-4" style={{ color: 'var(--sidebar-text-muted, #f0f0f0)' }}>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm">Lade Chats...</p>
                </div>
              ) : recentChats.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--sidebar-text-muted, #f0f0f0)' }}>
                  <p className="text-sm">{isPreviewMode ? 'Demo Chats werden geladen...' : 'Keine Chats vorhanden'}</p>
                </div>
              ) : (
                <div 
                  className="space-y-2 max-h-60 overflow-y-auto sidebar-no-scrollbar"
                >
                  {recentChats.map((chat) => (
                    <div 
                      key={chat.id}
                      className="flex items-center justify-between p-3 rounded-md cursor-pointer transition-all hover:bg-white hover:bg-opacity-10"
                      onClick={() => handleChatClick(chat.id, chat.agentId)}
                    >
                      <p className="text-sm font-medium text-white truncate">{chat.agentName}</p>
                      <span className="text-xs" style={{ color: 'var(--sidebar-text-muted, #f0f0f0)' }}>
                        {formatTimestamp(chat.lastMessageTime)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Dashboard Button für Admins + Logout */}
      <div className="p-4 space-y-2">
        {/* Dashboard Button (nur für Admins) */}
        {userStatus.isAdmin && dashboardButton && (
          <button
            onClick={() => handleAdminAction(dashboardButton.action)}
            className={`flex items-center ${
              isSidebarOpen ? 'justify-start' : 'justify-center'
            } w-full p-3 rounded-md transition-all bg-yellow-600 hover:bg-yellow-700 text-white`}
          >
            {dashboardButton.icon}
            {isSidebarOpen && <span className="ml-3">{dashboardButton.title}</span>}
          </button>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            isSidebarOpen ? 'justify-start' : 'justify-center'
          } w-full p-3 rounded-md transition-all ${
            isPreviewMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
          }`}
          style={{ backgroundColor: '#ef4444', color: 'white' }}
          onMouseEnter={(e) => {
            if (!isPreviewMode) {
              e.target.style.backgroundColor = '#dc2626';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ef4444';
          }}
          disabled={isPreviewMode}
        >
          <LogOut size={20} />
          {isSidebarOpen && <span className="ml-3">{isPreviewMode ? 'Demo' : 'Abmelden'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;