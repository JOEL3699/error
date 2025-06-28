import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, MoreVertical, X, Mail, CheckCircle, 
  AlertCircle, Edit2, Save, User, Trash2, PenSquare 
} from 'lucide-react';

const UserManagement = () => {
  // State
  const [employees, setEmployees] = useState([
    {
      id: '1',
      firstName: 'Test',
      lastName: 'Test',
      name: 'Test Test',
      email: 'kontakt@testtest.de',
      created_at: '18.5.2025'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    employeeId: null
  });
  
  // Suche
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gefilterte Mitarbeiter
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal öffnen/schließen
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    });
    setError(null);
  };

  // Mitarbeiter bearbeiten
  const startEditing = (employee) => {
    setEditingEmployee(employee.id);
    setEditFormData({
      firstName: employee.firstName,
      lastName: employee.lastName
    });
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setEditFormData({
      firstName: '',
      lastName: ''
    });
  };

  // Mitarbeiter speichern
  const saveEmployeeEdit = async (employeeId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update local state
      setEmployees(employees.map(emp => {
        if (emp.id === employeeId) {
          const newName = `${editFormData.firstName} ${editFormData.lastName}`.trim();
          return {
            ...emp,
            firstName: editFormData.firstName,
            lastName: editFormData.lastName,
            name: newName || 'Kein Name'
          };
        }
        return emp;
      }));
      
      // Show success message
      setSuccessMessage('Mitarbeiter wurde erfolgreich aktualisiert.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Exit edit mode
      cancelEditing();
      
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Mitarbeiters:', err);
      setError(`Fehler beim Aktualisieren des Mitarbeiters: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Löschen-Dialog
  const openDeleteConfirmation = (employeeId) => {
    setConfirmDialog({
      isOpen: true,
      employeeId
    });
  };
  
  const closeDeleteConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      employeeId: null
    });
  };

  // Mitarbeiter löschen
  const deleteEmployee = async (employeeId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update local state
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      
      // Show success message
      setSuccessMessage('Mitarbeiter wurde erfolgreich entfernt.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Close the confirmation dialog
      closeDeleteConfirmation();
      
    } catch (err) {
      console.error('Fehler beim Entfernen des Mitarbeiters:', err);
      setError(`Fehler beim Entfernen des Mitarbeiters: ${err.message}`);
      closeDeleteConfirmation();
    } finally {
      setIsLoading(false);
    }
  };

  // Mitarbeiter erstellen
  const handleCreateEmployee = () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Validierung
      if (!formData.firstName.trim() || !formData.lastName.trim() || 
          !formData.email.trim() || !formData.password.trim()) {
        setError('Bitte füllen Sie alle Pflichtfelder aus.');
        setIsLoading(false);
        return;
      }
      
      const newEmployee = {
        id: `new-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        created_at: new Date().toLocaleDateString('de-DE')
      };
      
      setEmployees([...employees, newEmployee]);
      
      // Erfolgreich!
      closeModal();
      
      // Erfolgsbenachrichtigung anzeigen
      setSuccessMessage('Mitarbeiter wurde erfolgreich erstellt und kann sich jetzt anmelden.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
    } catch (err) {
      console.error('Fehler beim Erstellen des Mitarbeiters:', err);
      
      // Benutzerfreundliche Fehlermeldung
      if (err.message && err.message.includes('duplicate key')) {
        setError('Diese E-Mail-Adresse wird bereits verwendet.');
      } else if (err.message && err.message.includes('password')) {
        setError('Das Passwort entspricht nicht den Anforderungen (mindestens 6 Zeichen).');
      } else {
        setError(`Fehler beim Erstellen des Mitarbeiters: ${err.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hauptkomponente
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Benutzerverwaltung</h1>
          
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              onClick={openModal}
            >
              <UserPlus size={18} className="mr-2" />
              Benutzer hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Erfolgsbenachrichtigung */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center shadow-sm">
            <CheckCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Fehlermeldung */}
        {error && !isModalOpen && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center shadow-sm">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ladezustand */}
        {isLoading && !isModalOpen && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Mitarbeiterkarten */}
        {!isLoading && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {editingEmployee === emp.id ? (
                    // Edit mode
                    <div className="p-5">
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                          <input
                            type="text"
                            name="firstName"
                            value={editFormData.firstName}
                            onChange={handleEditInputChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                          <input
                            type="text"
                            name="lastName"
                            value={editFormData.lastName}
                            onChange={handleEditInputChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <X size={16} className="mr-1" />
                          Abbrechen
                        </button>
                        <button
                          onClick={() => saveEmployeeEdit(emp.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                          ) : (
                            <Save size={16} className="mr-1" />
                          )}
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{emp.name || 'Kein Name'}</h3>
                            <p className="text-gray-600">{emp.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(emp)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50"
                            title="Bearbeiten"
                          >
                            <PenSquare size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(emp.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-md hover:bg-red-50"
                            title="Löschen"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Erstellt am</h4>
                          <p className="text-gray-700">{emp.created_at}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <User size={32} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {searchTerm ? "Keine Ergebnisse gefunden" : "Keine Mitarbeiter vorhanden"}
                </h2>
                <p className="text-gray-500 max-w-md mb-6">
                  {searchTerm 
                    ? `Es wurden keine Mitarbeiter gefunden, die "${searchTerm}" entsprechen.`
                    : "Beginnen Sie damit, Mitarbeiter hinzuzufügen, um diese hier zu sehen."
                  }
                </p>
                {!searchTerm && (
                  <button 
                    onClick={openModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Mitarbeiter hinzufügen
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md m-4">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">Mitarbeiter entfernen</h2>
              <p className="mt-2 text-gray-600">Sind Sie sicher, dass Sie diesen Mitarbeiter entfernen möchten? Der Benutzer kann sich weiterhin anmelden, wird jedoch nicht mehr als Ihr Mitarbeiter geführt.</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmation}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => deleteEmployee(confirmDialog.employeeId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 size={16} className="mr-2" />
                )}
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zum Hinzufügen eines neuen Benutzers */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">Mitarbeiter hinzufügen</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Mindestens 6 Zeichen</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-1" />
                      Mitarbeiter anlegen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;