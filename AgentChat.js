import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, MoreHorizontal, X, Info, Database, Edit } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getAgentById, getConversationById, checkUserTokenLimit, supabase } from '../../components/SupaBase/supabaseClient';
import { getChatCompletion } from '../../OpenAI/openaiService';
import { useAuth } from '../Auth/AuthContext';
import { useTasksContext } from '../Tasks/TasksContext';
import TopicSelector from './TopicSelector';
import cooTopics from './agents/cooTopics';
import cfoTopics from './agents/cfoTopics';
import cmoTopics from './agents/cmoTopics';
import secondBrainTopics from './agents/secondBrainTopics';
import { buildTopicPrompt, buildIntroMessage } from './topicPromptBuilder';
import { 
  createConversation, 
  addMessage, 
  getMessagesByConversationId,
  getAgentSettings
} from '../../components/SupaBase/supabaseClient';

// NEU: Import des intelligenten Context-Systems
import { 
  getAllAvailableContext 
} from './intelligentContext';

const AgentChat = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Neue UI-bezogene States
  const [isTyping, setIsTyping] = useState(false);
  const [showAgentInfo, setShowAgentInfo] = useState(false);

  // Neue States für die Themenauswahl
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(null);
  
  // NEU: Context-System States
  const [availableContext, setAvailableContext] = useState({});
  const [showContextInfo, setShowContextInfo] = useState(false);
  
  // NEU: Permission-System States - VEREINFACHT
  const [permissionGranted, setPermissionGranted] = useState(null); // null = nicht gefragt, true = ja, false = nein
  const [showPermissionButtons, setShowPermissionButtons] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  
  // Task-Kontext für die Erstellung von Aufgaben
  const {
    createTask,
    createProject,
    createArea,
    availableAssignees,
    projects,
    areas
  } = useTasksContext();

  // Funktion zum Ermitteln der Branding-Klassen basierend auf agentId
  const getAgentBrandingClasses = (agentId) => {
    const brandingMap = {
      'second-brain': {
        bg: 'bg-second-brain-brand',
        text: 'text-second-brain-brand',
        border: 'border-second-brain-brand',
        bgLight: 'bg-second-brain-brand bg-opacity-10',
        bgLightSolid: 'bg-blue-50 dark:bg-blue-900/20',
        borderLight: 'border-blue-200 dark:border-blue-700',
        messageBg: 'bg-second-brain-message'
      },
      'cmo': {
        bg: 'bg-cmo-brand',
        text: 'text-cmo-brand',
        border: 'border-cmo-brand',
        bgLight: 'bg-cmo-brand bg-opacity-10',
        bgLightSolid: 'bg-purple-50 dark:bg-purple-900/20',
        borderLight: 'border-purple-200 dark:border-purple-700',
        messageBg: 'bg-cmo-message'
      },
      'cfo': {
        bg: 'bg-cfo-brand',
        text: 'text-cfo-brand',
        border: 'border-cfo-brand',
        bgLight: 'bg-cfo-brand bg-opacity-10',
        bgLightSolid: 'bg-amber-50 dark:bg-amber-900/20',
        borderLight: 'border-amber-200 dark:border-amber-700',
        messageBg: 'bg-cfo-message'
      },
      'coo': {
        bg: 'bg-coo-brand',
        text: 'text-coo-brand',
        border: 'border-coo-brand',
        bgLight: 'bg-coo-brand bg-opacity-10',
        bgLightSolid: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderLight: 'border-emerald-200 dark:border-emerald-700',
        messageBg: 'bg-coo-message'
      }
    };

    return brandingMap[agentId] || brandingMap['second-brain'];
  };

  // NEU: Funktion zum Laden der Context-Daten - ERWEITERT für Mock-Support
  const loadContextData = async () => {
    if (!user || !agentId) return;

    try {
      console.log('🧠 Lade Context-Daten für Agent:', agentId);
      
      // Lade Agent-Settings basierend auf Agent-Typ
      let agentSettings = null;
      let settingsSource = 'unbekannt';
      
      if (agentId === 'second-brain') {
        const { getSecondBrainSettings } = await import('../../components/SupaBase/supabaseClient');
        const result = await getSecondBrainSettings(user.id, agentId);
        agentSettings = result.settings;
        settingsSource = result.settings ? 'Datenbank' : 'Mock-Daten';
      } else if (agentId === 'cfo') {
        const { getCFOSettings } = await import('../../components/SupaBase/supabaseClient');
        const result = await getCFOSettings(user.id, agentId);
        agentSettings = result.settings;
        settingsSource = result.settings ? 'Datenbank' : 'Mock-Daten';
      } else if (agentId === 'cmo') {
        const { getCMOSettings } = await import('../../components/SupaBase/supabaseClient');
        const result = await getCMOSettings(user.id, agentId);
        agentSettings = result.settings;
        settingsSource = result.settings ? 'Datenbank' : 'Mock-Daten';
      } else if (agentId === 'coo') {
        const { getCOOSettings } = await import('../../components/SupaBase/supabaseClient');
        const result = await getCOOSettings(user.id, agentId);
        agentSettings = result.settings;
        settingsSource = result.settings ? 'Datenbank' : 'Mock-Daten';
      }

      console.log(`📊 Geladene Agent-Settings: ${agentSettings ? 'Erfolg' : 'Leer'} (Quelle: ${settingsSource})`);

      // WICHTIG: Sammle verfügbare Context-Daten AUCH aus Mock-Daten
      let contextData = {};
      
      if (agentSettings && Object.keys(agentSettings).length > 0) {
        contextData = getAllAvailableContext(agentSettings);
        console.log('✅ Context aus Settings extrahiert');
      } else {
        console.log('❌ Keine Settings verfügbar - Context bleibt leer');
        
        // DEBUG: Zeige Mock-Daten Details für Debugging
        if (agentSettings) {
          console.log('🔍 Debug - Agent Settings Struktur:');
          console.log('Keys:', Object.keys(agentSettings));
          console.log('Beispiel-Daten:', JSON.stringify(agentSettings, null, 2).substring(0, 500));
        }
      }
      
      console.log('🎯 Verfügbare Context-Daten:', Object.keys(contextData).length);
      
      if (Object.keys(contextData).length > 0) {
        console.log('📋 Context-Details im Chat verfügbar:');
        Object.entries(contextData).forEach(([key, data]) => {
          const preview = data.value ? data.value.toString().substring(0, 50) : 'leer';
          console.log(`  - ${key}: ${data.label} = ${preview}${preview.length >= 50 ? '...' : ''}`);
        });
      } else {
        console.log('⚠️ KEIN CONTEXT verfügbar - Agent wird generische Fragen stellen');
      }

      setAvailableContext(contextData);
      
    } catch (error) {
      console.warn('⚠️ Fehler beim Laden der Context-Daten:', error);
      setAvailableContext({});
    }
  };

  // NEU: Permission Handler - VEREINFACHT MIT DEBUG
  const handlePermissionChoice = async (granted) => {
    console.log('🎯 Permission Choice:', granted ? 'GRANTED' : 'DENIED');
    
    setPermissionGranted(granted);
    setShowPermissionButtons(false);
    
    if (granted) {
      console.log('✅ User hat Context-Nutzung erlaubt - verarbeite Nachricht mit Context...');
      
      // Verarbeite die wartende Nachricht mit Context
      if (pendingMessage) {
        await processMessageWithContext(pendingMessage);
        setPendingMessage('');
      }
    } else {
      console.log('❌ User hat Context-Nutzung abgelehnt - manueller Modus');
      
      // Verarbeite die wartende Nachricht ohne Context
      if (pendingMessage) {
        await processMessageWithoutContext(pendingMessage);
        setPendingMessage('');
      }
    }
  };

  // NEU: Erstelle GPT-Nachfrage nach Context-Permission
  const createContextPermissionMessage = () => {
    const agentNames = {
      'second-brain': 'Second Brain',  
      'cmo': 'CMO',
      'cfo': 'CFO',
      'coo': 'COO'
    };
    
    const contextExamples = {
      'second-brain': 'deine Vision, Geschäftsmodell und aktuelle Herausforderungen',
      'cmo': 'deine Zielgruppe, Produktstatus und Marketing-Ziele',
      'cfo': 'deine Finanzierungssituation, Kosten und Einnahmequellen',
      'coo': 'deine Team-Struktur, Prozesse und operative Herausforderungen'
    };
    
    const agentName = agentNames[agentId] || 'Agent';
    const examples = contextExamples[agentId] || 'deine hinterlegten Informationen';
    const contextCount = Object.keys(availableContext).length;
    
    return `Um dir passgenauere Empfehlungen zu geben, kann ich auf ${contextCount} deiner hinterlegten Informationen zugreifen (z.B. ${examples}). 

Soll ich diese Daten für meine Antwort verwenden, oder möchtest du die Informationen lieber manuell eingeben?`;
  };

  // Separate Funktionen für Context-Processing
  const processMessageWithContext = async (userMessage) => {
    console.log('🧠 Verarbeite Nachricht MIT Context-Daten');
    
    const systemContext = {
      userId: user?.id,
      availableContext: availableContext,
      useAdminSettings: true,
      permissionGranted: true
    };
    
    if (customSystemPrompt) {
      systemContext.customInstructions = customSystemPrompt;
    }
    
    setIsTyping(true);
    
    try {
      const rawAgentResponse = await getChatCompletion(
        agent,
        conversation,
        userMessage,
        systemContext
      );
      
      setIsTyping(false);
      
      const agentMessageObj = {
        sender_type: 'agent',
        content: rawAgentResponse,
        timestamp: new Date().toISOString(),
      };
      
      setConversation(prevConversation => [...prevConversation, agentMessageObj]);
      
      if (conversationId) {
        await addMessage(conversationId, 'agent', rawAgentResponse);
      }
      
      messageInputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Fehler beim Verarbeiten mit Context:', error);
      setError('Die Nachricht konnte nicht verarbeitet werden.');
      setIsTyping(false);
    }
  };

  const processMessageWithoutContext = async (userMessage) => {
    console.log('📝 Verarbeite Nachricht OHNE Context-Daten (manueller Modus)');
    
    const systemContext = {
      userId: user?.id,
      availableContext: {}, // Leer für manuellen Modus
      useAdminSettings: true,
      permissionGranted: false,
      manualMode: true // Flag für Agent
    };
    
    if (customSystemPrompt) {
      systemContext.customInstructions = customSystemPrompt;
    }
    
    setIsTyping(true);
    
    try {
      const rawAgentResponse = await getChatCompletion(
        agent,
        conversation,
        userMessage,
        systemContext
      );
      
      setIsTyping(false);
      
      const agentMessageObj = {
        sender_type: 'agent',
        content: rawAgentResponse,
        timestamp: new Date().toISOString(),
      };
      
      setConversation(prevConversation => [...prevConversation, agentMessageObj]);
      
      if (conversationId) {
        await addMessage(conversationId, 'agent', rawAgentResponse);
      }
      
      messageInputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Fehler beim Verarbeiten ohne Context:', error);
      setError('Die Nachricht konnte nicht verarbeitet werden.');
      setIsTyping(false);
    }
  };

  // Scrolle zum Ende des Chats
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Lade den Agenten und initialisiere die Konversation
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        console.log('Initialisiere Chat für Agent:', agentId);
        
        // Extrahiere conversationId aus den URL-Parametern, falls vorhanden
        const urlParams = new URLSearchParams(location.search);
        const urlConversationId = urlParams.get('conversationId');
        
        // Lade Agent-Daten
        const { agent: agentData, error: agentError } = await getAgentById(agentId);
        
        console.log('Geladene Agent-Daten:', agentData, agentError);
        
        if (agentError) {
          console.error('Fehler beim Laden des Agenten:', agentError);
          setError(`Der Agent konnte nicht geladen werden: ${agentError.message || 'Unbekannter Fehler'}`);
          setLoading(false);
          return;
        }
        
        if (!agentData) {
          setError('Agent nicht gefunden.');
          setLoading(false);
          return;
        }
        
        setAgent(agentData);
        
        // NEU: Lade Context-Daten nach dem Laden des Agenten
        await loadContextData();
        
        // Permission-States bei neuer Konversation zurücksetzen
        setPermissionGranted(null);
        setShowPermissionButtons(false);
        
        // Wenn eine Konversations-ID in der URL ist, laden wir diese bestehende Konversation
        if (urlConversationId) {
          console.log('Lade bestehende Konversation:', urlConversationId);
          
          // Setze die conversationId im State
          setConversationId(urlConversationId);
          
          // Lade die Nachrichten der Konversation
          const { messages, error: messagesError } = await getMessagesByConversationId(urlConversationId);
          
          if (messagesError) {
            console.error('Fehler beim Laden der Nachrichten:', messagesError);
            setError(`Die Nachrichten konnten nicht geladen werden: ${messagesError.message || 'Unbekannter Fehler'}`);
            // Zeige die Themenauswahl, statt direkt eine neue Konversation zu erstellen
            setShowTopicSelector(true);
          } else if (messages && messages.length > 0) {
            console.log('Geladene Nachrichten:', messages);
            setConversation(messages);
            
            // Fokussiere das Eingabefeld nach dem Laden
            setTimeout(() => {
              messageInputRef.current?.focus();
            }, 500);
          } else {
            // Wenn keine Nachrichten gefunden wurden, zeige die Themenauswahl
            console.log('Keine Nachrichten gefunden, zeige Themenauswahl');
            setShowTopicSelector(true);
          }
        } else {
          // Keine Konversation in der URL, zeige die Themenauswahl
          console.log('Neue Konversation, zeige Themenauswahl');
          setShowTopicSelector(true);
        }
        
        setError(null);
        
      } catch (err) {
        console.error('Unerwarteter Fehler:', err);
        setError(`Ein unerwarteter Fehler ist aufgetreten: ${err.message || 'Unbekannter Fehler'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeChat();
  }, [agentId, navigate, user, location.search]);

  // NEU: Lade Context-Daten neu, wenn sich der User oder Agent ändert
  useEffect(() => {
    loadContextData();
  }, [user, agentId]);

  // Neue Funktion zur Behandlung der Themenauswahl
  const handleTopicSelect = async (topic) => {
    if (!user || !agent) return;
    
    try {
      setLoading(true);
      setSelectedTopic(topic);
      
      console.log('Thema ausgewählt:', topic);
      
      // Lade Agenteneinstellungen für den aktuellen Benutzer
      let agentSettings = null;
      
      try {
        if (user) {
          const result = await getAgentSettings(agent.id);
          agentSettings = result.settings;
          
          if (result.error) {
            console.warn('Fehler beim Laden der Agenteneinstellungen:', result.error);
          }
        }
      } catch (settingsError) {
        console.warn('Fehler beim Laden der Agenteneinstellungen:', settingsError);
      }
      
      // Erstelle eine neue Konversation mit Themenbezug im Titel
      const { conversation: newConversation, error: conversationError } = await createConversation(
        user.id,
        agentId,
        `${agent.title}: ${topic.label}`
      );
      
      if (conversationError) {
        console.error('Fehler beim Erstellen der Konversation:', conversationError);
        setError(`Die Konversation konnte nicht erstellt werden: ${conversationError.message || 'Unbekannter Fehler'}`);
        return;
      }
      
      console.log('Neue Konversation erstellt:', newConversation);
      setConversationId(newConversation.id);
      
      // Generiere eine personalisierte Einleitungsnachricht basierend auf dem Thema
      const initialMessage = buildIntroMessage(topic, agent);
      
      // Speichere den angepassten Systemprompt für spätere Nachrichten
      const customPrompt = buildTopicPrompt(topic, agentSettings, agent);
      setCustomSystemPrompt(customPrompt);
      
      // Füge die initiale Nachricht des Agenten zur Datenbank hinzu
      const { error: messageError } = await addMessage(
        newConversation.id,
        'agent',
        initialMessage
      );
      
      if (messageError) {
        console.error('Fehler beim Speichern der Nachricht:', messageError);
      }
      
      // Setze die initiale Konversation im State
      setConversation([
        {
          sender_type: 'agent',
          content: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      
      // Verstecke die Themenauswahl
      setShowTopicSelector(false);
      
      // Fokussiere das Eingabefeld nach dem Laden
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 500);
      
      // Aktualisiere die URL mit der neuen Konversations-ID
      navigate(`/agent-chat/${agentId}?conversationId=${newConversation.id}`, { replace: true });
      
    } catch (error) {
      console.error('Fehler bei der Themenauswahl:', error);
      setError(`Ein Fehler ist aufgetreten: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  // Scrolle zum Ende des Chats nach Änderungen in der Konversation
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);
  
  // Sende die Nachricht mit Enter-Taste oder durch Klicken auf die Senden-Schaltfläche
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

// ===== KORRIGIERTE HANDLESENDMESSAGE MIT NATÜRLICHER PERMISSION =====
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  if (message.trim() === '' || !agent || loading) return;
  
  try {
    setLoading(true);
    
    // Benutzernachricht zur Konversation hinzufügen
    const userMessage = {
      sender_type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Aktualisiere UI sofort
    setConversation(prevConversation => [...prevConversation, userMessage]);
    
    // Speicher für die ursprüngliche Nachricht
    const originalMessage = message;
    setMessage('');
    
    // Speichere Benutzernachricht in der Datenbank
    if (conversationId) {
      await addMessage(conversationId, 'user', originalMessage);
    }
    
    // ===== KORRIGIERTE PERMISSION-LOGIK =====
    
    console.log('🔍 Debug Permission Check:', {
      permissionGranted,
      availableContextCount: Object.keys(availableContext).length,
      availableContextKeys: Object.keys(availableContext),
      showPermissionButtons
    });
    
    // WICHTIG: Prüfe ob Context-Daten vorhanden sind UND keine Permission-Entscheidung getroffen wurde
    if (permissionGranted === null && Object.keys(availableContext).length > 0) {
      console.log('🛡️ Context verfügbar aber keine Permission - erstelle natürliche Nachfrage');
      
      // Warte kurz, damit die User-Nachricht korrekt angezeigt wird
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Erstelle GPT-Nachfrage nach Permission
      const permissionMessage = createContextPermissionMessage();
      
      console.log('📝 Permission Message erstellt:', permissionMessage);
      
      // Füge GPT-Nachfrage zur Konversation hinzu
      const agentMessageObj = {
        sender_type: 'agent',
        content: permissionMessage,
        timestamp: new Date().toISOString(),
      };
      
      setConversation(prevConversation => [...prevConversation, agentMessageObj]);
      
      // Speichere GPT-Nachfrage in der Datenbank
      if (conversationId) {
        await addMessage(conversationId, 'agent', permissionMessage);
      }
      
      // WICHTIG: Zeige Permission-Buttons NACH der Nachricht
      console.log('🔘 Setze showPermissionButtons auf true');
      setShowPermissionButtons(true);
      setLoading(false);
      
      // Speichere die Nachricht für späteren Processing
      setPendingMessage(originalMessage);
      
      // Scroll to bottom nach kurzer Verzögerung
      setTimeout(() => {
        scrollToBottom();
      }, 200);
      
      return;
    }
    
    // Falls Permission bereits erteilt oder keine Context-Daten verfügbar
    if (permissionGranted === true) {
      console.log('✅ Processing with context');
      await processMessageWithContext(originalMessage);
    } else if (permissionGranted === false) {
      console.log('❌ Processing without context (user denied)');
      await processMessageWithoutContext(originalMessage);
    } else {
      // Keine Context-Daten verfügbar - normale Verarbeitung
      console.log('ℹ️ No context data available - processing normally');
      const systemContext = {
        userId: user?.id,
        availableContext: {},
        useAdminSettings: true,
        permissionGranted: null
      };
      
      if (customSystemPrompt) {
        systemContext.customInstructions = customSystemPrompt;
      }
      
      setIsTyping(true);
      
      try {
        const rawAgentResponse = await getChatCompletion(
          agent,
          conversation,
          originalMessage,
          systemContext
        );
        
        setIsTyping(false);
        
        const agentMessageObj = {
          sender_type: 'agent',
          content: rawAgentResponse,
          timestamp: new Date().toISOString(),
        };
        
        setConversation(prevConversation => [...prevConversation, agentMessageObj]);
        
        if (conversationId) {
          await addMessage(conversationId, 'agent', rawAgentResponse);
        }
        
        messageInputRef.current?.focus();
        
      } catch (error) {
        console.error('❌ Fehler beim normalen Processing:', error);
        setError('Die Nachricht konnte nicht verarbeitet werden.');
        setIsTyping(false);
      }
    }
    
  } catch (err) {
    console.error('❌ Fehler beim Senden der Nachricht:', err);
    setError('Die Nachricht konnte nicht gesendet werden.');
    setIsTyping(false);
  } finally {
    setLoading(false);
  }
};
  
  // Formatiere Text mit Markdown (einfache Implementierung)
  const formatMessage = (text) => {
    // Für eine richtige Markdown-Implementierung sollte eine Bibliothek wie react-markdown verwendet werden
    // Dies ist eine vereinfachte Version für die Darstellung
    
    // Zeilenumbrüche durch <br> ersetzen
    return text.replace(/\n/g, '<br>');
  };
  
  // Formatiere Zeitstempel für die Anzeige
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // NEU: Context-Status-Anzeige
  const ContextStatusIndicator = () => {
    const contextCount = Object.keys(availableContext || {}).length;
    
    if (contextCount === 0) return null;
    
    return (
      <div 
        className="flex items-center text-xs text-theme-text-secondary mb-2 cursor-pointer hover:text-theme-text transition-colors"
        onClick={() => setShowContextInfo(!showContextInfo)}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span>{contextCount} Kontext-Daten verfügbar</span>
        <Info size={14} className="ml-1" />
      </div>
    );
  };

  // NEU: Context-Info Panel
  const ContextInfoPanel = () => {
    if (!showContextInfo || Object.keys(availableContext).length === 0) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Info size={16} className="text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Verfügbare Kontext-Daten</span>
          </div>
          <button 
            onClick={() => setShowContextInfo(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="text-blue-700 space-y-1">
          {Object.entries(availableContext).map(([key, data]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{data.label}:</span>
              <span className="truncate ml-2 max-w-32">
                {data.value.length > 30 ? data.value.substring(0, 30) + '...' : data.value}
              </span>
            </div>
          ))}
        </div>
        <p className="text-blue-600 text-xs mt-2">
          Der Agent nutzt diese Informationen automatisch für personalisierte Antworten.
        </p>
      </div>
    );
  };

  // NEU: Permission Buttons Component
  const PermissionButtons = () => {
    if (!showPermissionButtons) return null;
    
    const brandingClasses = getAgentBrandingClasses(agentId);
    
    return (
      <div className="flex justify-start mb-4">
        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
          <button
            onClick={() => handlePermissionChoice(true)}
            className={`${brandingClasses.bg} text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center font-medium`}
          >
            <Database size={18} className="mr-2" />
            Ja, gerne
          </button>
          
          <button
            onClick={() => handlePermissionChoice(false)}
            className="bg-theme-surface border border-theme-border text-theme-text px-6 py-3 rounded-lg hover:bg-theme-hover transition-colors flex items-center justify-center font-medium"
          >
            <Edit size={18} className="mr-2" />
            Nein, ich schreibe selbst
          </button>
        </div>
      </div>
    );
  };
  
  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-bg">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-theme-primary" size={32} />
          <p className="text-theme-text">Verbinde mit Assistent...</p>
        </div>
      </div>
    );
  }
  
  if (error && !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-theme-bg">
        <div className="bg-theme-surface border border-theme-border text-theme-text p-4 m-4 rounded-xl shadow-sm max-w-md">
          <p className="font-bold mb-2 text-theme-error">Fehler</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 bg-theme-primary text-white px-5 py-2 rounded-lg hover:bg-theme-primary-hover transition-colors shadow-sm flex items-center"
        >
          <ArrowLeft size={18} className="mr-2" />
          Zurück zur Übersicht
        </button>
      </div>
    );
  }
  
  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-bg">
        <div className="bg-theme-surface border border-theme-border text-theme-text p-4 rounded-xl shadow-sm">
          Agent konnte nicht geladen werden.
        </div>
      </div>
    );
  }
  
  // Branding-Klassen für den aktuellen Agenten abrufen
  const brandingClasses = getAgentBrandingClasses(agentId);

  return (
    <div className="fixed inset-0 flex flex-col bg-theme-bg overflow-hidden">
      {/* Header - Modern Dark/Light Theme */}
      <div className="bg-theme-surface text-theme-text p-4 flex items-center justify-between border-b border-theme-border flex-shrink-0 backdrop-blur-lg bg-opacity-90">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-theme-hover mr-3 transition-colors"
            aria-label="Zurück"
          >
            <ArrowLeft size={20} className="text-theme-text-secondary" />
          </button>
          <div>
            <div className="font-semibold text-theme-text">{agent.title} - {agent.full_title}</div>
            <div className="text-sm text-theme-text-secondary">{agent.description}</div>
            {/* NEU: Context-Status-Anzeige */}
            <ContextStatusIndicator />
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setShowAgentInfo(!showAgentInfo)}
            className="p-2 rounded-full hover:bg-theme-hover transition-colors"
            aria-label="Agent Info"
          >
            <MoreHorizontal size={20} className="text-theme-text-secondary" />
          </button>
        </div>
      </div>
      
      {/* Agent Info Panel - Modern Design */}
      {showAgentInfo && (
        <div className="bg-theme-surface shadow-sm p-4 border-b border-theme-border animate-slideDown backdrop-blur-lg bg-opacity-95">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-theme-text">Über diesen Assistenten</h3>
            <button 
              onClick={() => setShowAgentInfo(false)}
              className="text-theme-text-secondary hover:text-theme-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-theme-text-secondary mb-1">Expertise</p>
              <ul className="list-disc list-inside text-theme-text">
                <li className="text-xs mb-1">Strategisches Denken</li>
                <li className="text-xs mb-1">Problemanalyse & kritische Reflexion</li>
                <li className="text-xs mb-1">Strukturierung komplexer Ideen</li>
                <li className="text-xs mb-1">Argumentationsaufbau & Entscheidungslogik</li>
                <li className="text-xs mb-1">Bewertung von Chancen und Risiken</li>
              </ul>
            </div>
            
            <div>
              <p className="text-theme-text-secondary mb-1">Hilfreiche Prompts</p>
              <ul className="list-disc list-inside text-theme-text">
                <li className="text-xs mb-1">„Ich brauche eine rationale Einschätzung zu dieser Idee."</li>
                <li className="text-xs mb-1">„Gibt es Denkfehler oder blinde Flecken in meinem Ansatz?"</li>
                <li className="text-xs mb-1">„Wie würde ein erfahrener Geschäftspartner dieses Problem analysieren?"</li>
                <li className="text-xs mb-1">„Spiele mit mir ein strategisches Szenario durch."</li>
                <li className="text-xs mb-1">„Welche Argumente sprechen wirklich für und gegen diesen Weg?"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Fehlermeldung - Modern Design */}
      {error && (
        <div className="bg-theme-error-bg border border-theme-error-border text-theme-error p-3 mx-4 mt-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center">
            <X size={18} className="mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* NEU: Context-Info Panel */}
      <ContextInfoPanel />
      
      {/* Themenauswahl - Modern Design */}
      {showTopicSelector && agent && (
        <div className="flex-1 overflow-y-auto bg-theme-bg">
          <TopicSelector 
            agentId={agent.id}
            topics={
              agent.id === 'coo' ? cooTopics : 
              agent.id === 'cfo' ? cfoTopics : 
              agent.id === 'cmo' ? cmoTopics : 
              agent.id === 'second-brain' ? secondBrainTopics : 
              []
            }
            onTopicSelect={handleTopicSelect}
            agentColor={brandingClasses.bg}
            agentLightColor={brandingClasses.bgLight}
            agentTextColor={brandingClasses.text}
          />
        </div>
      )}
      
      {/* Konversation - Modern Chat Layout wie ChatGPT */}
      {!showTopicSelector && (
        <div 
          className="flex-1 overflow-y-auto bg-theme-bg min-h-0"
          ref={chatContainerRef}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'} relative group`}
              >
                <div className="flex flex-col max-w-[90%] relative">
                  {/* Nachrichteninhalt - Modern Bubble Design */}
                  <div 
                    className={`rounded-3xl px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
                      msg.sender_type === 'user' 
                        ? 'bg-user-message text-white' 
                        : msg.sender_type === 'system'
                          ? 'bg-theme-surface text-theme-text-secondary italic text-sm border border-theme-border'
                          : `${brandingClasses.messageBg} text-theme-text border border-theme-border/50`
                    }`}
                  >
                    <div 
                      className={`leading-relaxed ${msg.sender_type === 'user' ? 'text-white' : 'text-theme-text'}`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} 
                    />
                  </div>
                  
                  {/* Zeitstempel - Elegant positioned */}
                  <div className={`text-xs text-theme-text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    msg.sender_type === 'user' ? 'text-right mr-2' : 'ml-2'
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* NEU: Permission Buttons - direkt nach der letzten Agent-Nachricht */}
            <PermissionButtons />
            
            {/* Typing Indicator - Modern Animation */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`${brandingClasses.messageBg} rounded-3xl px-6 py-4 inline-flex items-center shadow-lg backdrop-blur-sm border border-theme-border/50`}>
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* Message Input - Modern Floating Design */}
      {!showTopicSelector && (
        <div className="border-t border-theme-border bg-theme-surface/80 backdrop-blur-lg p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <div className="relative flex-1">
                <textarea
                  ref={messageInputRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nachricht an ${agent.title}...`}
                  className={`w-full border border-theme-border rounded-3xl px-6 py-4 focus:outline-none resize-none bg-theme-surface text-theme-text text-base shadow-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-theme-text-muted`}
                  style={{ 
                    minHeight: '56px',
                    maxHeight: '160px',
                    paddingRight: '70px'
                  }}
                  disabled={loading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <button 
                    type="submit"
                    className={`${brandingClasses.bg} text-white rounded-full p-3 hover:opacity-90 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105`}
                    disabled={loading || message.trim() === ''}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Enhanced CSS für moderne Animationen und Theme */}
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          height: 20px;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 3px;
          border-radius: 50%;
          background-color: var(--theme-text-secondary);
          opacity: 0.6;
          display: inline-block;
          animation: typing 1.5s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        @keyframes typing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }
        
        /* Animation für Agent-Info Panel */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        /* Smooth message appearance */
        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .message-appear {
          animation: messageAppear 0.3s ease-out forwards;
        }
        
        /* Enhanced scroll behavior */
        .smooth-scroll {
          scroll-behavior: smooth;
        }
        
        /* Modern glassmorphism effects */
        .glass-effect {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Enhanced focus states */
        .enhanced-focus:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          border-color: var(--theme-primary);
        }
      `}</style>
    </div>
  );
};

export default AgentChat;