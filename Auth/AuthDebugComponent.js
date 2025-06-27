import React, { useState, useEffect } from 'react';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { useAuth } from './AuthContext';

const AuthDebugComponent = () => {
  const { user } = useAuth();
  const [authState, setAuthState] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [profileState, setProfileState] = useState(null);
  const [storageState, setStorageState] = useState(null);
  const [configState, setConfigState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const debugAuth = async () => {
      try {
        // 1. Check Supabase Configuration
        setConfigState({
          supabaseUrl: supabase.supabaseUrl || 'MISSING',
          supabaseKey: supabase.supabaseKey ? 'EXISTS (length: ' + supabase.supabaseKey.length + ')' : 'MISSING',
          projectRef: supabase.supabaseUrl ? supabase.supabaseUrl.split('//')[1]?.split('.')[0] : 'UNKNOWN'
        });

        // 2. Check Session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        setSessionState({
          session: sessionData.session,
          error: sessionError,
          hasSession: !!sessionData.session,
          accessToken: sessionData.session?.access_token ? 'EXISTS (exp: ' + new Date(sessionData.session.expires_at * 1000).toLocaleString() + ')' : 'MISSING',
          refreshToken: sessionData.session?.refresh_token ? 'EXISTS' : 'MISSING'
        });

        // 3. Check User
        const { data: userData, error: userError } = await supabase.auth.getUser();
        setAuthState({
          user: userData.user,
          error: userError,
          hasUser: !!userData.user,
          userId: userData.user?.id || 'MISSING',
          email: userData.user?.email || 'MISSING'
        });

        // 4. Check Profile Access (nur wenn User existiert)
        if (userData.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
            
            setProfileState({
              profile: profileData,
              error: profileError,
              hasProfile: !!profileData,
              errorCode: profileError?.code || null,
              errorMessage: profileError?.message || null
            });
          } catch (profileErr) {
            setProfileState({
              profile: null,
              error: profileErr,
              hasProfile: false,
              errorCode: 'CATCH_ERROR',
              errorMessage: profileErr.message
            });
          }
        }

        // 5. Check Storage Access
        try {
          const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
          setStorageState({
            buckets: buckets,
            error: storageError,
            hasBuckets: !!buckets && buckets.length > 0,
            errorCode: storageError?.statusCode || null,
            errorMessage: storageError?.message || null
          });
        } catch (storageErr) {
          setStorageState({
            buckets: null,
            error: storageErr,
            hasBuckets: false,
            errorCode: 'CATCH_ERROR',
            errorMessage: storageErr.message
          });
        }

      } catch (err) {
        setError(err);
      }
    };

    debugAuth();
  }, [user]);

  const testSupabaseConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      console.log('Supabase Connection Test:', { data, error });
      alert(`Connection Test: ${error ? 'FAILED - ' + error.message : 'SUCCESS'}`);
    } catch (err) {
      console.error('Connection Test Error:', err);
      alert(`Connection Test: ERROR - ${err.message}`);
    }
  };

  const testStorageAccess = async () => {
    try {
      // Test storage access
      const { data, error } = await supabase.storage
        .from('branding')
        .list('', { limit: 1 });
      
      console.log('Storage Test:', { data, error });
      alert(`Storage Test: ${error ? 'FAILED - ' + error.message : 'SUCCESS'}`);
    } catch (err) {
      console.error('Storage Test Error:', err);
      alert(`Storage Test: ERROR - ${err.message}`);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      console.log('Session Refresh Result:', { data, error });
      
      if (error) {
        alert(`Session Refresh Failed: ${error.message}`);
      } else {
        alert('Session Refreshed Successfully');
        window.location.reload();
      }
    } catch (err) {
      console.error('Session Refresh Error:', err);
      alert(`Session Refresh Error: ${err.message}`);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      alert('Session Cleared - Please login again');
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Clear Session Error:', err);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white border-2 border-red-500 p-4 rounded-lg shadow-lg z-50 max-w-md max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-red-600 mb-3">🔧 Auth Debug Panel</h3>
      
      {/* Supabase Configuration */}
      <div className="mb-3 p-2 bg-purple-100 rounded">
        <strong>Supabase Config:</strong>
        <div className="text-xs">
          URL: {configState?.supabaseUrl || 'CHECKING...'}<br/>
          Key: {configState?.supabaseKey || 'CHECKING...'}<br/>
          Project: {configState?.projectRef || 'CHECKING...'}
        </div>
      </div>

      {/* Context User */}
      <div className="mb-3 p-2 bg-gray-100 rounded">
        <strong>Context User:</strong>
        <div className="text-xs">
          ID: {user?.id || 'MISSING'}<br/>
          Email: {user?.email || 'MISSING'}
        </div>
      </div>

      {/* Session State */}
      <div className="mb-3 p-2 bg-blue-100 rounded">
        <strong>Session:</strong>
        <div className="text-xs">
          Has Session: {sessionState?.hasSession ? '✅' : '❌'}<br/>
          Access Token: {sessionState?.accessToken || 'CHECKING...'}<br/>
          Refresh Token: {sessionState?.refreshToken || 'CHECKING...'}<br/>
          Error: {sessionState?.error?.message || 'None'}
        </div>
      </div>

      {/* Auth State */}
      <div className="mb-3 p-2 bg-green-100 rounded">
        <strong>Auth User:</strong>
        <div className="text-xs">
          Has User: {authState?.hasUser ? '✅' : '❌'}<br/>
          User ID: {authState?.userId || 'CHECKING...'}<br/>
          Email: {authState?.email || 'CHECKING...'}<br/>
          Error: {authState?.error?.message || 'None'}
        </div>
      </div>

      {/* Profile State */}
      <div className="mb-3 p-2 bg-yellow-100 rounded">
        <strong>Profile Access:</strong>
        <div className="text-xs">
          Has Profile: {profileState?.hasProfile ? '✅' : '❌'}<br/>
          Error Code: {profileState?.errorCode || 'None'}<br/>
          Error: {profileState?.errorMessage || 'None'}
        </div>
      </div>

      {/* Storage State */}
      <div className="mb-3 p-2 bg-orange-100 rounded">
        <strong>Storage Access:</strong>
        <div className="text-xs">
          Has Buckets: {storageState?.hasBuckets ? '✅' : '❌'}<br/>
          Error Code: {storageState?.errorCode || 'None'}<br/>
          Error: {storageState?.errorMessage || 'None'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button 
          onClick={testSupabaseConnection}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Test DB Connection
        </button>
        <button 
          onClick={testStorageAccess}
          className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Storage Access
        </button>
        <button 
          onClick={refreshSession}
          className="bg-green-500 text-white px-2 py-1 rounded text-xs"
        >
          Refresh Session
        </button>
        <button 
          onClick={clearSession}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Clear & Restart
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-100 rounded">
          <strong>General Error:</strong>
          <div className="text-xs">{error.message}</div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugComponent;