// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './pages/Auth/AuthContext';
import { PartnerBrandingProvider } from './context/PartnerBrandingContext';
import EnhancedErrorBoundary from './components/SupaBase/EnhancedErrorBoundary';

// Korrekte Imports aus deiner routes.js
import PartnerAppLayout from './components/layout/PartnerAppLayout';
import AdminPanelLayout from './components/layout/AdminPanelLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import SuperPanelRoute from './pages/Superpanel/SuperPanelRoute';

// Page components
import TeamManagement from './pages/TeamManagement/TeamManagement';
import AgentChatPage from './pages/TeamManagement/AgentChatPage';
import Tasks from './pages/Tasks/Tasks';
import Calendar from './pages/Calendar/Calendar';
import CalendarOAuthCallback from './pages/Calendar/CalendarOAuthCallback';
import UserManagement from './pages/UserManagement/UserManagement';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import SuperPanel from './pages/Superpanel/SuperPanel';
import ProfilePage from './pages/profilePage/ProfilePage';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import AuthLayout from './pages/Auth/AuthLayout';
import OAuthHandler from './pages/Auth/OAuthHandler';

function App() {
  return (
    <EnhancedErrorBoundary>
      <AuthProvider>
        <PartnerBrandingProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* 🔐 AUTH-ROUTES */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="callback" element={<OAuthHandler />} />
                  <Route path="calendar-callback" element={<CalendarOAuthCallback />} />
                </Route>

                {/* 🛡️ SUPER-ADMIN-PANEL */}
                <Route path="/super-admin" element={<SuperPanelRoute />}>
                  <Route path="" element={<SuperPanel />} />
                </Route>

                {/* 🔒 PROTECTED ROUTES */}
                <Route path="/" element={<ProtectedRoute />}>
                  {/* 🔧 ADMIN PANEL für Partner/Mitarbeiter */}
                  <Route path="admin-dashboard" element={<AdminPanelLayout />} />
                  
                  {/* 🔧 HAUPT-APP für alle User */}
                  <Route path="" element={<PartnerAppLayout />}>
                    <Route index element={<TeamManagement />} />
                    <Route path="agent-chat/:agentId" element={<AgentChatPage />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="user-management" element={<UserManagement />} />
                    <Route path="admin" element={<AdminPanel />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                </Route>
              </Routes>
            </div>
          </Router>
        </PartnerBrandingProvider>
      </AuthProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;