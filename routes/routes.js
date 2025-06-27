import { Navigate } from 'react-router-dom';
import PartnerAppLayout from '../components/layout/PartnerAppLayout';
import AdminPanelLayout from '../components/layout/AdminPanelLayout';
import ProtectedRoute from './ProtectedRoute';
import SuperPanelRoute from '../pages/Superpanel/SuperPanelRoute';

// Page components
import TeamManagement from '../pages/TeamManagement/TeamManagement';
import AgentChatPage from '../pages/TeamManagement/AgentChatPage';
import Tasks from '../pages/Tasks/Tasks';
import Calendar from '../pages/Calendar/Calendar';
import CalendarOAuthCallback from '../pages/Calendar/CalendarOAuthCallback';
import UserManagement from '../pages/UserManagement/UserManagement';
import AdminPanel from '../pages/AdminPanel/AdminPanel';
import SuperPanel from '../pages/Superpanel/SuperPanel';
import ProfilePage from '../pages/profilePage/ProfilePage';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import AuthLayout from '../pages/Auth/AuthLayout';
import OAuthHandler from '../pages/Auth/OAuthHandler';

const routes = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        // 🔧 ADMIN PANEL: Dediziertes Layout für Partner/Mitarbeiter
        path: '/admin-dashboard',
        element: <AdminPanelLayout />
      },
      
      {
        // 🔧 HAUPT-APP: Für ALLE User (Partner, Mitarbeiter, End-user)
        // Unterschied liegt in den Sidebar-Features, nicht in der Route
        path: '/',
        element: <PartnerAppLayout />,
        children: [
          { path: '/', element: <TeamManagement /> },
          { path: '/agent-chat/:agentId', element: <AgentChatPage /> },
          { path: '/tasks', element: <Tasks /> },
          { path: '/calendar', element: <Calendar /> },
          { path: '/user-management', element: <UserManagement /> },
          { path: '/admin', element: <AdminPanel /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      
      // 🔄 FALLBACK: Alte Panel-Links zur App umleiten
      { path: '/panel', element: <Navigate to="/" replace /> },
      { path: '/panel/*', element: <Navigate to="/" replace /> },
      
      // 🔄 DEFAULT: Alle unbekannten Pfade zur App
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  {
    // 🛡️ SUPER-ADMIN-PANEL: Bleibt unverändert für Super-Admins
    path: '/super-admin',
    element: <SuperPanelRoute />,
    children: [
      {
        path: '',
        element: <SuperPanel />
      }
    ],
  },
  {
    // 🔐 AUTH-ROUTES: Bleiben unverändert
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: '', element: <Navigate to="/auth/login" /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'callback', element: <OAuthHandler /> },
      { path: 'calendar-callback', element: <CalendarOAuthCallback /> },
    ],
  },
];

export default routes;