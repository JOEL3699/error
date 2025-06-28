import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { Loader, Shield } from 'lucide-react';

const SuperPanelRoute = () => {
  const { user, loading, isSuperAdmin } = useAuth();

  // Während Ladezustand zeige Loading-Spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-300">Laden...</p>
        </div>
      </div>
    );
  }

  // Weiterleitung zur Login-Seite, wenn Benutzer nicht eingeloggt ist
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Wenn der Benutzer kein Super-Admin ist, zeige eine Zugriffsverweigerungsseite
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full border border-gray-700">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-4">Zugriff verweigert</h1>
          <p className="text-gray-300 text-center mb-6">
            Sie haben keine Berechtigung, auf das Super-Admin-Panel zuzugreifen.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zurück zum Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Benutzer ist ein Super-Admin, erlaube den Zugriff
  return <Outlet />;
};

export default SuperPanelRoute;