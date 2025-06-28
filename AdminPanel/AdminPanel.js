import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Info, Loader, ChevronRight, Brain, PieChart, BarChart, Settings } from 'lucide-react';
import { agentsData } from '../TeamManagement/TeamManagement';
import { 
  saveSecondBrainSettings, 
  saveCFOSettings, 
  saveCMOSettings, 
  saveCOOSettings 
} from '../../components/SupaBase/supabaseClient';
import { useAuth } from '../Auth/AuthContext';
import ZweitesGehirn from './Zweitesgehirn/ZweitesGehirn';
import CMO from './CMO/CMO';
import CFO from './CFO/CFO';
import COO from './COO/COO';

const AdminPanel = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeInfoCard, setActiveInfoCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverStates, setHoverStates] = useState({});
  const { user } = useAuth();

  // WICHTIG: Theme-Styles beim Mount forcieren
  useEffect(() => {
    // Stelle sicher, dass die CSS-Variablen geladen sind
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    const themeBg = computedStyles.getPropertyValue('--theme-bg');
    
    console.log('Theme background:', themeBg);
    
    // Fallback: Wenn CSS-Variablen nicht geladen sind, setze sie manuell
    if (!themeBg || themeBg.trim() === '') {
      root.style.setProperty('--theme-bg', '#FFFFFF');
      root.style.setProperty('--theme-surface', '#FFFFFF');
      root.style.setProperty('--theme-text', '#111827');
      root.style.setProperty('--theme-text-secondary', '#6B7280');
      root.style.setProperty('--theme-border', '#E5E7EB');
    }
  }, []);
  
  // Funktion zum Speichern der Einstellungen
  const saveAgentSettings = async (settings) => {
    console.log('Speichere Einstellungen für', selectedAgent?.name);
    
    setIsLoading(true);
    try {
      if (!user) {
        setSaveStatus('Fehler beim Speichern: Benutzer nicht angemeldet');
        setTimeout(() => setSaveStatus(''), 5000);
        return;
      }
      
      let result;
      
      // Je nach Agent-Typ die richtige Speicherfunktion aufrufen
      if (selectedAgent.id === 'second-brain') {
        result = await saveSecondBrainSettings(
          user.id,
          selectedAgent.id, 
          settings, 
          'gpt-3.5-turbo'
        );
      } else if (selectedAgent.id === 'cfo') {
        result = await saveCFOSettings(
          user.id,
          selectedAgent.id, 
          settings, 
          'gpt-3.5-turbo'
        );
      } else if (selectedAgent.id === 'cmo') {
        result = await saveCMOSettings(
          user.id,
          selectedAgent.id, 
          settings, 
          'gpt-3.5-turbo'
        );
      } else if (selectedAgent.id === 'coo') {
        result = await saveCOOSettings(
          user.id,
          selectedAgent.id, 
          settings, 
          'gpt-3.5-turbo'
        );
      } else {
        // Fallback: Fehlermeldung
        setSaveStatus('Für diesen Agenten ist noch keine Speicherfunktion implementiert');
        setTimeout(() => setSaveStatus(''), 5000);
        return;
      }
      
      if (result.success) {
        setSaveStatus('Einstellungen erfolgreich gespeichert');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus(`Fehler beim Speichern: ${result.error?.message || 'Unbekannter Fehler'}`);
        setTimeout(() => setSaveStatus(''), 5000);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSaveStatus('Ein unerwarteter Fehler ist aufgetreten');
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum Zurücksetzen der Einstellungen
  const resetAgentSettings = () => {
    setSaveStatus('Zurückgesetzt');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // Funktion zum Togglen der Info-Karten
  const toggleInfoCard = (cardId) => {
    if (activeInfoCard === cardId) {
      setActiveInfoCard(null);
    } else {
      setActiveInfoCard(cardId);
    }
  };

  const handleMouseEnter = (agentId) => {
    setHoverStates(prev => ({ ...prev, [agentId]: true }));
  };

  const handleMouseLeave = (agentId) => {
    setHoverStates(prev => ({ ...prev, [agentId]: false }));
  };

  // Hauptassistent und Spezialisten trennen
  const mainAgent = agentsData[0];
  const specialistAgents = agentsData.slice(1);

  // Info-Texte für die verschiedenen Agenten
  const infoContent = {
    'second-brain': {
      title: 'Second Brain',
      description: 'Dein strategischer Berater für Business-Entwicklung und Innovation',
      example: 'Beispiel-Nutzung: "Analysiere den Markttrend für nachhaltige Verpackungen" oder "Erstelle eine Stärken-Schwächen-Analyse für unser neues Produkt"',
      besonders: 'Besonders geeignet für strategische Fragestellungen, Marktanalysen und Innovationsprojekte.'
    },
    'cmo': {
      title: 'Chief Marketing Officer',
      description: 'Dein Marketing-Experte für Kampagnen, Content-Strategien und Markenentwicklung',
      example: 'Beispiel-Nutzung: "Entwickle einen Social-Media-Plan für unser neues Produkt" oder "Wie kann ich die Conversion-Rate meiner Landing Page verbessern?"',
      besonders: 'Besonders geeignet für Content-Planung, Marketing-Kampagnen und Zielgruppen-Analyse.'
    },
    'cfo': {
      title: 'Chief Financial Officer',
      description: 'Dein Finanzberater für Budgetplanung, Investitionsanalysen und Liquiditätsmanagement',
      example: 'Beispiel-Nutzung: "Berechne unseren Break-Even-Point" oder "Erstelle eine Cashflow-Prognose für die nächsten 6 Monate"',
      besonders: 'Besonders geeignet für Budgetplanungen, Finanzanalysen und Investitionsentscheidungen.'
    },
    'coo': {
      title: 'Chief Operations Officer',
      description: 'Dein Operations-Experte für Prozessoptimierung, Effizienzsteigerung und Ressourcenplanung',
      example: 'Beispiel-Nutzung: "Optimiere unseren Kundenservice-Workflow" oder "Welche KPIs sollten wir für unser Produktionsteam festlegen?"',
      besonders: 'Besonders geeignet für Prozessanalysen, Workflow-Optimierung und Ressourceneffizienz.'
    }
  };

  // Rendere die richtige Komponente basierend auf dem ausgewählten Agenten
  const renderAgentComponent = () => {
    if (!selectedAgent) {
      return null;
    }

    // Agent-spezifische Farben zuweisen
    const getAgentColor = (agentId) => {
      const colorMap = {
        'second-brain': 'second-brain',
        'cmo': 'cmo',
        'cfo': 'cfo',
        'coo': 'coo'
      };
      return colorMap[agentId] || 'primary';
    };

    const agentColor = getAgentColor(selectedAgent.id);

    const commonProps = {
      agent: selectedAgent,
      saveStatus: saveStatus,
      onSave: saveAgentSettings,
      onReset: resetAgentSettings,
      isLoading: isLoading,
      hideTestTab: true,
      agentColor: agentColor
    };

    switch (selectedAgent.id) {
      case 'second-brain':
        return <ZweitesGehirn {...commonProps} textColor={`text-${agentColor}-brand`} />;
      case 'cmo':
        return <CMO {...commonProps} textColor={`text-${agentColor}-brand`} />;
      case 'cfo':
        return <CFO {...commonProps} textColor={`text-${agentColor}-brand`} />;
      case 'coo':
        return <COO {...commonProps} textColor={`text-${agentColor}-brand`} />;
      default:
        return null;
    }
  };

  // Info-Karte Komponente
  const InfoCard = ({ agentId }) => {
    const info = infoContent[agentId];
    if (!info) return null;

    return (
      <div className={`absolute top-full left-0 right-0 mt-2 p-4 bg-theme-surface border border-theme-border rounded-lg shadow-lg z-10 ${activeInfoCard === agentId ? 'block' : 'hidden'}`}>
        <h3 className="font-medium text-theme-text mb-2">{info.title}</h3>
        <p className="text-sm text-theme-text-secondary mb-3">{info.description}</p>
        <div className="text-xs text-theme-text-secondary mb-2">
          <p className="font-medium mb-1">Anwendungsbeispiele:</p>
          <p className="italic">{info.example}</p>
        </div>
        <p className="text-xs text-theme-text-secondary mt-2">{info.besonders}</p>
      </div>
    );
  };

  return (
    // GEÄNDERT: Verwende direkte CSS-Styles als Fallback + force das Theme
    <div 
      className="theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]"
      style={{
        backgroundColor: 'var(--theme-bg, #FFFFFF)',
        color: 'var(--theme-text, #111827)',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      <div 
        className="p-6 min-h-full"
        style={{
          backgroundColor: 'var(--theme-bg, #FFFFFF)'
        }}
      >
        <div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--theme-text, #111827)' }}
          >
            KI-Assistenten konfigurieren
          </h1>
          <p 
            className="mb-8"
            style={{ color: 'var(--theme-text-secondary, #6B7280)' }}
          >
            Wähle einen Assistenten für die Konfiguration
          </p>
          
          {/* Hauptassistent - mit dem Design von TeamManagement */}
          <div 
            key={mainAgent.id} 
            className="border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer relative mb-10 transition-all duration-200 theme-transition"
            style={{
              backgroundColor: 'var(--theme-surface, #FFFFFF)',
              borderColor: 'var(--theme-border, #E5E7EB)'
            }}
            onClick={() => setSelectedAgent(mainAgent)}
            onMouseEnter={() => handleMouseEnter(mainAgent.id)}
            onMouseLeave={() => handleMouseLeave(mainAgent.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-second-brain-brand bg-opacity-10 text-second-brain-brand rounded-lg p-3 shadow-sm">
                  <Brain size={24} />
                </div>
                <div className="ml-5">
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: 'var(--theme-text, #111827)' }}
                  >
                    {mainAgent.name}
                  </h2>
                  <p className="text-second-brain-brand text-sm font-medium">{mainAgent.role}</p>
                  <p 
                    className="text-sm mt-1 max-w-lg"
                    style={{ color: 'var(--theme-text-secondary, #6B7280)' }}
                  >
                    {mainAgent.description}
                  </p>
                </div>
              </div>
              
              {/* Konfigurieren button - mit dezenten Farbakzenten */}
              <div className="flex items-center text-second-brain-brand font-medium transition-all duration-200 rounded-lg px-4 py-2 border border-second-brain-brand border-opacity-20 hover:bg-second-brain-brand hover:bg-opacity-5">
                <MessageSquare size={18} className="mr-2" />
                Konfigurieren
                <ChevronRight size={16} className={`ml-1 transition-transform duration-200 ${hoverStates[mainAgent.id] ? 'transform translate-x-1' : ''}`} />
              </div>
            </div>
          </div>
          
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--theme-text, #111827)' }}
          >
            Spezialisten
          </h2>
          
          {/* Spezialisten in einer Reihe - mit dem Design von TeamManagement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialistAgents.map((agent) => {
              const AgentIcon = agent.icon;
              const agentColorMap = {
                'cmo': 'cmo',
                'cfo': 'cfo', 
                'coo': 'coo'
              };
              const agentColor = agentColorMap[agent.id] || 'primary';
              
              return (
                <div 
                  key={agent.id} 
                  className="border rounded-lg p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 theme-transition"
                  style={{
                    backgroundColor: 'var(--theme-surface, #FFFFFF)',
                    borderColor: 'var(--theme-border, #E5E7EB)'
                  }}
                  onClick={() => setSelectedAgent(agent)}
                  onMouseEnter={() => handleMouseEnter(agent.id)}
                  onMouseLeave={() => handleMouseLeave(agent.id)}
                >
                  <div className="flex flex-col h-full">
                    {/* Header mit dezenterem Icon */}
                    <div className="flex items-center mb-4">
                      <div className={`bg-${agentColor}-brand bg-opacity-10 text-${agentColor}-brand rounded-lg p-2`}>
                        <AgentIcon size={18} />
                      </div>
                      <div className="ml-3">
                        <h3 
                          className="font-semibold"
                          style={{ color: 'var(--theme-text, #111827)' }}
                        >
                          {agent.name}
                        </h3>
                        <p className={`text-${agentColor}-brand text-xs font-medium`}>{agent.role}</p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p 
                      className="text-sm flex-grow mb-4"
                      style={{ color: 'var(--theme-text-secondary, #6B7280)' }}
                    >
                      {agent.description}
                    </p>
                    
                    {/* Konfigurieren Button - dezenter Farbakzent */}
                    <div className={`flex items-center justify-center text-${agentColor}-brand text-sm border border-${agentColor}-brand border-opacity-20 rounded-lg py-2 mt-auto hover:bg-${agentColor}-brand hover:bg-opacity-5 transition-all`}>
                      <MessageSquare size={16} className="mr-2" />
                      Konfigurieren
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div 
                className="p-6 rounded-lg shadow-xl flex items-center space-x-4 theme-transition"
                style={{
                  backgroundColor: 'var(--theme-surface, #FFFFFF)'
                }}
              >
                <Loader className="animate-spin text-theme-primary" size={24} />
                <span 
                  style={{ color: 'var(--theme-text, #111827)' }}
                >
                  Speichere Einstellungen...
                </span>
              </div>
            </div>
          )}

          {/* Render der ausgewählten Agenten-Komponente */}
          {renderAgentComponent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;