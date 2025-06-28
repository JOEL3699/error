import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgentChat from './AgentChat';
import { TasksProvider } from '../Tasks/TasksContext';
import { Loader2 } from 'lucide-react';

/**
 * Modernisierte Seitenkomponente für den Agent-Chat mit TasksProvider
 * Stellt sicher, dass der AgentChat Zugriff auf den TasksContext hat
 * und fügt eine verbesserte Lade-Animation hinzu
 */
const AgentChatPage = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simuliere ein Laden für eine bessere UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Kurze Ladezeit für eine bessere visuelle Erfahrung
    
    return () => clearTimeout(timer);
  }, []);
  
  // Leite zu 404 weiter, wenn Agent ID nicht vorhanden ist
  useEffect(() => {
    if (!agentId) {
      navigate('/not-found');
    }
  }, [agentId, navigate]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <Loader2 size={40} className="text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 bg-gray-50 rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Verbinde mit dem Assistenten...</p>
        </div>
      </div>
    );
  }
  
  return (
    <TasksProvider>
      <div className="min-h-screen bg-gray-50">
        <AgentChat />
      </div>
    </TasksProvider>
  );
};

export default AgentChatPage;