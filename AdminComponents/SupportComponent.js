import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MessageSquare, Send, Clock, CheckCircle2, 
  Plus, RefreshCw, Filter, Search, X, Settings, 
  Wrench, FileText, CreditCard, HelpCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../components/SupaBase/supabaseClient';
import { useAuth } from '../../pages/Auth/AuthContext';

// Ticket-Kategorien mit Icons und Farben
const ticketCategories = {
  setup_anfragen: { 
    name: 'Setup-Anfragen', 
    icon: Settings, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  technische_probleme: { 
    name: 'Technische Probleme', 
    icon: Wrench, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  branding_aenderungen: { 
    name: 'Branding-Änderungen', 
    icon: FileText, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  lizenz_upgrades: { 
    name: 'Lizenz-Upgrades', 
    icon: CreditCard, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  sonstige: { 
    name: 'Sonstige', 
    icon: HelpCircle, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

const SupportComponent = ({ onBack }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Neues Ticket Formular
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: '',
    category: 'sonstige',
    priority: 'mittel'
  });
  
  // Antwort auf Ticket
  const [replyMessage, setReplyMessage] = useState('');
  
  // Loading und Fehlerbehandlung
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Tickets beim Mount laden
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      setError('');

      // Tickets des Benutzers abrufen
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Fehler beim Laden der Tickets:', ticketsError);
        setError('Tickets konnten nicht geladen werden.');
        return;
      }

      // Für jedes Ticket die zugehörigen Nachrichten abrufen
      const ticketsWithMessages = await Promise.all(ticketsData.map(async (ticket) => {
        const { data: messagesData, error: messagesError } = await supabase
          .from('support_messages')
          .select(`
            *,
            profiles:sender_id(first_name, last_name)
          `)
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Fehler beim Laden der Nachrichten:', messagesError);
          return {
            ...ticket,
            messages: []
          };
        }

        // Nachrichten formatieren
        const formattedMessages = messagesData.map(message => ({
          id: message.id,
          from: message.is_from_admin ? 'support' : 'user',
          content: message.content,
          timestamp: message.created_at,
          sender_name: message.is_from_admin && message.profiles 
            ? `${message.profiles.first_name || ''} ${message.profiles.last_name || ''}`.trim() 
            : 'Sie'
        }));

        return {
          ...ticket,
          messages: formattedMessages
        };
      }));

      setTickets(ticketsWithMessages);
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Tickets:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleNewTicketSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Neues Ticket in der Datenbank erstellen
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user.id,
            subject: newTicketForm.subject,
            category: newTicketForm.category,
            status: 'offen',
            priority: newTicketForm.priority
          }
        ])
        .select();
      
      if (ticketError) {
        console.error('Fehler beim Erstellen des Tickets:', ticketError);
        setError('Ticket konnte nicht erstellt werden.');
        return;
      }
      
      // Erste Nachricht zum Ticket hinzufügen
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert([
          {
            ticket_id: ticketData[0].id,
            sender_id: user.id,
            content: newTicketForm.message,
            is_from_admin: false
          }
        ]);
      
      if (messageError) {
        console.error('Fehler beim Erstellen der Nachricht:', messageError);
        setError('Nachricht konnte nicht erstellt werden.');
        return;
      }
      
      // Erfolg anzeigen und Formular zurücksetzen
      setSuccessMessage('Ticket wurde erfolgreich erstellt.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      setNewTicketForm({ subject: '', message: '', category: 'sonstige', priority: 'mittel' });
      setShowNewTicketForm(false);
      
      // Tickets neu laden
      await fetchTickets();
      
    } catch (err) {
      console.error('Unerwarteter Fehler beim Erstellen des Tickets:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Neue Antwort in der Datenbank erstellen
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert([
          {
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            content: replyMessage,
            is_from_admin: false
          }
        ]);
      
      if (messageError) {
        console.error('Fehler beim Erstellen der Antwort:', messageError);
        setError('Antwort konnte nicht gesendet werden.');
        return;
      }
      
      // Status des Tickets auf "offen" setzen, falls es geschlossen war
      if (selectedTicket.status === 'geschlossen') {
        await supabase
          .from('support_tickets')
          .update({ status: 'offen', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }
      
      setReplyMessage('');
      setSuccessMessage('Antwort wurde gesendet.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Tickets neu laden und ausgewähltes Ticket aktualisieren
      await fetchTickets();
      
      // Ausgewähltes Ticket in der Liste finden und aktualisieren
      const updatedTickets = await Promise.all(tickets.map(async (ticket) => {
        if (ticket.id === selectedTicket.id) {
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select(`
              *,
              profiles:sender_id(first_name, last_name)
            `)
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
          
          const formattedMessages = messagesData.map(message => ({
            id: message.id,
            from: message.is_from_admin ? 'support' : 'user',
            content: message.content,
            timestamp: message.created_at,
            sender_name: message.is_from_admin && message.profiles 
              ? `${message.profiles.first_name || ''} ${message.profiles.last_name || ''}`.trim() 
              : 'Sie'
          }));
          
          const updatedTicket = { ...ticket, messages: formattedMessages };
          setSelectedTicket(updatedTicket);
          return updatedTicket;
        }
        return ticket;
      }));
      
    } catch (err) {
      console.error('Unerwarteter Fehler beim Senden der Antwort:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter-Funktionen
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'offen': 'bg-yellow-100 text-yellow-800',
      'geschlossen': 'bg-green-100 text-green-800',
      'bearbeitung': 'bg-blue-100 text-blue-800'
    };
    return `px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      'hoch': 'bg-red-100 text-red-800',
      'mittel': 'bg-yellow-100 text-yellow-800',
      'niedrig': 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 text-xs rounded-full ${styles[priority] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">Support Center</h1>
            <p className="text-gray-500">Tickets verwalten und Support anfordern</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Neues Ticket
          </button>
          <button
            onClick={fetchTickets}
            disabled={ticketsLoading}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} className={`mr-2 ${ticketsLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center shadow-sm">
          <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center shadow-sm">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800 font-medium">Offene Tickets</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {tickets.filter(t => t.status === 'offen').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">Gelöst</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {tickets.filter(t => t.status === 'geschlossen').length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800 font-medium">In Bearbeitung</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {tickets.filter(t => t.status === 'bearbeitung').length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-sm text-gray-800 font-medium">Gesamt</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{tickets.length}</p>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tickets durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status</option>
              <option value="offen">Offen</option>
              <option value="bearbeitung">In Bearbeitung</option>
              <option value="geschlossen">Geschlossen</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Kategorien</option>
              {Object.entries(ticketCategories).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Liste */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">
            Meine Tickets ({filteredTickets.length})
          </h3>
        </div>
        
        {ticketsLoading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Tickets werden geladen...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map(ticket => {
              const category = ticketCategories[ticket.category] || ticketCategories.sonstige;
              const CategoryIcon = category.icon;
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <CategoryIcon size={16} className={category.color} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{ticket.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          Erstellt: {formatDateTime(ticket.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={getStatusBadge(ticket.status)}>
                        {ticket.status === 'offen' ? 'Offen' : 
                         ticket.status === 'geschlossen' ? 'Geschlossen' : 'In Bearbeitung'}
                      </span>
                      <span className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Keine Tickets gefunden</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? 
                'Keine Tickets entsprechen den aktuellen Filterkriterien.' : 
                'Sie haben noch keine Support-Tickets erstellt.'}
            </p>
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Erstes Ticket erstellen
            </button>
          </div>
        )}
      </div>

      {/* Neues Ticket Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Neues Support-Ticket</h2>
                <button
                  onClick={() => setShowNewTicketForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleNewTicketSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({...newTicketForm, subject: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kurze Beschreibung Ihres Anliegens"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({...newTicketForm, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ticketCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({...newTicketForm, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="niedrig">Niedrig</option>
                    <option value="mittel">Mittel</option>
                    <option value="hoch">Hoch</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                <textarea
                  value={newTicketForm.message}
                  onChange={(e) => setNewTicketForm({...newTicketForm, message: e.target.value})}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Beschreiben Sie Ihr Anliegen detailliert..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Ticket erstellen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-2">
                    {(() => {
                      const category = ticketCategories[selectedTicket.category] || ticketCategories.sonstige;
                      const CategoryIcon = category.icon;
                      return <CategoryIcon size={20} className={`mr-2 ${category.color}`} />;
                    })()}
                    <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getStatusBadge(selectedTicket.status)}>
                      {selectedTicket.status === 'offen' ? 'Offen' : 
                       selectedTicket.status === 'geschlossen' ? 'Geschlossen' : 'In Bearbeitung'}
                    </span>
                    <span className={getPriorityBadge(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Erstellt: {formatDateTime(selectedTicket.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col h-[calc(90vh-200px)]">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.from === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">
                            {message.sender_name || (message.from === 'user' ? 'Sie' : 'Support')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.from === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatDateTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Keine Nachrichten gefunden</p>
                  </div>
                )}
              </div>
              
              {selectedTicket.status !== 'geschlossen' && (
                <div className="p-6 border-t border-gray-200">
                  <form onSubmit={handleReplySubmit} className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Ihre Antwort..."
                      rows={3}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !replyMessage.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportComponent;