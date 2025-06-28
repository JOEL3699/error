import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, User, Brain, PieChart, BarChart, Settings, Plus } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

// Aktualisierte Agent-Daten mit Partner Branding
const agentsData = [
  {
    id: 'second-brain',
    name: 'Dein zweites Gehirn',
    role: 'Dein persönlicher KI-Assistent',
    bgColor: 'bg-theme-bg',
    color: 'bg-second-brain-brand',
    textColor: 'text-second-brain-brand',
    borderColor: 'border-second-brain-brand',
    icon: Brain,
    description: 'Allgemeiner intelligenter Assistent für alle Anfragen',
    initialMessage: 'Hallo, ich bin dein zweites Gehirn. Wie kann ich dir heute helfen?'
  },
  {
    id: 'cmo',
    name: 'Marketing-Assistent',
    role: 'Chief Marketing Officer',
    bgColor: 'bg-theme-bg',
    color: 'bg-cmo-brand',
    textColor: 'text-cmo-brand',
    borderColor: 'border-cmo-brand',
    icon: BarChart,
    description: 'Marketing-Strategien und Markenentwicklung',
    initialMessage: 'Hallo, ich bin dein CMO-Agent. Wie kann ich dir heute helfen?'
  },
  {
    id: 'cfo',
    name: 'Finanz-Assistent',
    role: 'Chief Financial Officer',
    bgColor: 'bg-theme-bg',
    color: 'bg-cfo-brand',
    textColor: 'text-cfo-brand',
    borderColor: 'border-cfo-brand',
    icon: PieChart,
    description: 'Finanzplanung und wirtschaftliche Beratung',
    initialMessage: 'Hallo, ich bin dein CFO-Agent. Wie kann ich dir heute helfen?'
  },
  {
    id: 'coo',
    name: 'Operations-Assistent',
    role: 'Chief Operations Officer',
    bgColor: 'bg-theme-bg',
    color: 'bg-coo-brand',
    textColor: 'text-coo-brand',
    borderColor: 'border-coo-brand',
    icon: Settings,
    description: 'Optimierung von Geschäftsprozessen',
    initialMessage: 'Hallo, ich bin dein COO-Agent. Wie kann ich dir heute helfen?'
  }
];

// Wir exportieren die Agenten-Daten, damit andere Komponenten sie verwenden können
export { agentsData };

const TeamManagement = () => {
  const navigate = useNavigate();
  const [hoverStates, setHoverStates] = useState({});
  const { user } = useAuth(); // Get current user from Auth context

  const handleAgentClick = (agentId) => {
    navigate(`/agent-chat/${agentId}`);
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

  return (
    <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
      <div className="p-6 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-theme-text mb-2">Deine KI-Assistenten</h1>
            <p className="text-theme-text-secondary">Wähle einen Assistenten für deine Aufgaben</p>
          </div>
          
          {/* Hauptassistent - mit dezenten Farbakzenten und dezenterem Icon */}
          <div 
            key={mainAgent.id} 
            className="bg-theme-surface border border-theme-border rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer relative mb-10 transition-all duration-200 theme-transition"
            onClick={() => handleAgentClick(mainAgent.id)}
            onMouseEnter={() => handleMouseEnter(mainAgent.id)}
            onMouseLeave={() => handleMouseLeave(mainAgent.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-second-brain-brand bg-opacity-10 text-second-brain-brand rounded-lg p-3 shadow-sm">
                  <Brain size={24} />
                </div>
                <div className="ml-5">
                  <h2 className="text-xl font-bold text-theme-text">
                    {mainAgent.name}
                  </h2>
                  <p className="text-second-brain-brand text-sm font-medium">{mainAgent.role}</p>
                  <p className="text-theme-text-secondary text-sm mt-1 max-w-lg">{mainAgent.description}</p>
                </div>
              </div>
              
              {/* Chatbutton - mit dezenten Farbakzenten */}
              <div className="flex items-center text-second-brain-brand font-medium transition-all duration-200 rounded-lg px-4 py-2 border border-second-brain-brand hover:bg-second-brain-brand hover:bg-opacity-10">
                <MessageSquare size={18} className="mr-2" />
                Chat starten
                <ChevronRight size={16} className={`ml-1 transition-transform duration-200 ${hoverStates[mainAgent.id] ? 'transform translate-x-1' : ''}`} />
              </div>
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-theme-text mb-4">Spezialisten</h2>
          
          {/* Spezialisten in einer Reihe - mit dezenten Farbakzenten */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialistAgents.map((agent) => {
              const AgentIcon = agent.icon;
              
              return (
                <div 
                  key={agent.id} 
                  className="bg-theme-surface border border-theme-border rounded-lg p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 theme-transition"
                  onClick={() => handleAgentClick(agent.id)}
                  onMouseEnter={() => handleMouseEnter(agent.id)}
                  onMouseLeave={() => handleMouseLeave(agent.id)}
                >
                  <div className="flex flex-col h-full">
                    {/* Header mit dezenterem Icon */}
                    <div className="flex items-center mb-4">
                      <div className={`${agent.color} bg-opacity-10 ${agent.textColor} rounded-lg p-2`}>
                        <AgentIcon size={18} />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-theme-text">
                          {agent.name}
                        </h3>
                        <p className={`${agent.textColor} text-xs font-medium`}>{agent.role}</p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-theme-text-secondary text-sm flex-grow mb-4">{agent.description}</p>
                    
                    {/* Chat Button - dezenter Farbakzent */}
                    <div className={`flex items-center justify-center ${agent.textColor} text-sm border ${agent.borderColor} rounded-lg py-2 mt-auto hover:${agent.color} hover:bg-opacity-10 transition-all`}>
                      <MessageSquare size={16} className="mr-2" />
                      Chat starten
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;