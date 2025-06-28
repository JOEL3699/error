import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Circle, Clock, Plus, X, User, Calendar, 
  Trash2, Folder, Layers, ChevronDown, ChevronRight,
  Filter, Hash, Search, ListFilter, Loader
} from 'lucide-react';
import { TasksProvider, useTasksContext } from './TasksContext';
import { getStatusIcon, getStatusClass, getStatusText, getAssigneeName, formatDate, isOverdue } from './TaskUtils';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';

const TasksContent = () => {
  const { 
    tasks, projects, areas, availableTags, availableAssignees,
    filters, searchQuery, isLoading, hasContent,
    expandedProjects, expandedAreas,
    createTask, createProject, createArea,
    updateTaskStatus, deleteItem,
    getTasksForProject, getProjectsForArea, getUnassignedTasks, getUnassignedProjects,
    toggleProject, toggleArea,
    setSearchQuery, setFilters
  } = useTasksContext();

  // UI States
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [formType, setFormType] = useState(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAddMenuOpen && !event.target.closest('.add-menu-container')) {
        setIsAddMenuOpen(false);
      }
      
      if (isFiltersOpen && !event.target.closest('.filter-menu-container')) {
        setIsFiltersOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen, isFiltersOpen]);

  // Form handlers
  const openTaskForm = (projectId = null) => {
    setFormType('task');
    setSelectedProjectId(projectId);
    setIsTaskModalOpen(true);
  };

  const openProjectForm = (areaId = null) => {
    setFormType('project');
    setSelectedAreaId(areaId);
    setIsProjectModalOpen(true);
  };

  const openAreaForm = () => {
    setFormType('area');
    setIsAreaModalOpen(true);
  };

  const closeTaskForm = () => setIsTaskModalOpen(false);
  const closeProjectForm = () => setIsProjectModalOpen(false);
  const closeAreaForm = () => setIsAreaModalOpen(false);
  
  // Filter and search handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Loading state
  if (isLoading && !hasContent) {
    return (
      <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
        <div className="p-6 min-h-full">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader size={32} className="animate-spin mx-auto mb-3 text-theme-primary" />
              <p className="text-theme-text-secondary">Daten werden geladen...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg theme-transition -m-6 min-h-[calc(100vh-0px)] w-[calc(100%+3rem)]">
      <div className="pb-16 min-h-full">
        {/* Header - modernisiertes Design */}
        <div className="sticky top-0 z-20 bg-theme-surface shadow-sm theme-transition">
          <div className="max-w-6xl mx-auto">
            <div className="px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-bold text-theme-text">Task Manager</h1>
              
              <div className="flex items-center gap-3">
                {/* Search bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 pr-3 py-2 rounded-lg border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-primary w-56 bg-theme-surface text-theme-text theme-transition"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-muted" />
                </div>
                
                {/* Filter button */}
                <div className="relative filter-menu-container">
                  <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`py-2 px-3 rounded-lg flex items-center gap-2 transition-colors ${
                      isFiltersOpen 
                        ? 'text-white bg-theme-primary'
                        : 'bg-theme-surface border border-theme-border text-theme-text hover:bg-theme-hover'
                    }`}
                  >
                    <ListFilter size={16} />
                    <span className="text-sm">Filter</span>
                    <ChevronDown size={14} className={`transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isFiltersOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-theme-surface rounded-lg shadow-lg z-10 border border-theme-border p-3 theme-transition">
                      <h3 className="text-sm font-medium text-theme-text mb-2">Filter anwenden</h3>
                      
                      <div className="space-y-3">
                        {/* Status filter */}
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Status</label>
                          <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full py-2 px-3 rounded-lg border border-theme-border text-sm focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text"
                          >
                            <option value="all">Alle Status</option>
                            <option value="pending">Ausstehend</option>
                            <option value="in-progress">In Bearbeitung</option>
                            <option value="completed">Abgeschlossen</option>
                          </select>
                        </div>
                        
                        {/* Assignee filter */}
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Zugewiesen an</label>
                          <select
                            name="assignee"
                            value={filters.assignee}
                            onChange={handleFilterChange}
                            className="w-full py-2 px-3 rounded-lg border border-theme-border text-sm focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text"
                          >
                            <option value="all">Alle Personen</option>
                            {availableAssignees.map(assignee => (
                              <option key={assignee.id} value={assignee.id}>
                                {assignee.name} {assignee.isSelf ? '(Ich)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Tag filter */}
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Tag</label>
                          <select
                            name="tag"
                            value={filters.tag}
                            onChange={handleFilterChange}
                            className="w-full py-2 px-3 rounded-lg border border-theme-border text-sm focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text"
                          >
                            <option value="all">Alle Tags</option>
                            {availableTags.map(tag => (
                              <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-theme-border flex justify-end">
                        <button
                          onClick={() => {
                            setFilters({
                              status: 'all',
                              assignee: 'all',
                              tag: 'all'
                            });
                            setIsFiltersOpen(false);
                          }}
                          className="text-xs text-theme-primary hover:opacity-80"
                        >
                          Filter zurücksetzen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content container */}
        <div className="max-w-6xl mx-auto py-6 px-4">
          {/* Add button */}
          <div className="fixed bottom-6 right-6 z-10 add-menu-container">
            <button 
              className="text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-theme-primary-hover transition-colors bg-theme-primary"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            >
              <Plus size={24} />
            </button>
            
            {/* Dropdown menu */}
            {isAddMenuOpen && (
              <div className="absolute right-0 bottom-16 w-56 bg-theme-surface rounded-lg shadow-lg z-10 overflow-hidden border border-theme-border theme-transition">
                <button 
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-theme-hover text-left border-b border-theme-border transition-colors"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    openTaskForm();
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-theme-primary">
                    <Plus size={16} />
                  </div>
                  <span className="text-theme-text">Neue Aufgabe</span>
                </button>
                
                <button 
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-theme-hover text-left border-b border-theme-border transition-colors"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    openProjectForm();
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-theme-primary">
                    <Folder size={16} />
                  </div>
                  <span className="text-theme-text">Neues Projekt</span>
                </button>
                
                <button 
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-theme-hover text-left transition-colors"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    openAreaForm();
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-theme-success">
                    <Layers size={16} />
                  </div>
                  <span className="text-theme-text">Neuer Bereich</span>
                </button>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!hasContent && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-theme-primary bg-opacity-10">
                <Layers size={32} className="text-theme-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-theme-text">Keine Inhalte gefunden</h2>
              <p className="text-theme-text-secondary max-w-md mb-6">
                Beginnen Sie mit der Erstellung von Bereichen, Projekten oder Aufgaben.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={openAreaForm}
                  className="px-4 py-2 text-white rounded-lg transition-colors shadow-sm bg-theme-primary hover:bg-theme-primary-hover"
                >
                  <Plus size={16} className="inline mr-1" />
                  Bereich erstellen
                </button>
                <button
                  onClick={openTaskForm}
                  className="px-4 py-2 border border-theme-border rounded-lg hover:bg-theme-hover text-theme-text transition-colors"
                >
                  <Plus size={16} className="inline mr-1" />
                  Aufgabe erstellen
                </button>
              </div>
            </div>
          )}

          {/* Content sections */}
          {hasContent && (
            <div className="space-y-6">
              {/* Areas */}
              {areas.map(area => {
                const areaProjects = getProjectsForArea(area.id);
                return (
                  <div key={`area-${area.id}`} className="bg-theme-surface rounded-lg overflow-hidden shadow-sm border border-theme-border theme-transition">
                    <div 
                      className="p-4" 
                      style={{ 
                        borderLeft: `4px solid ${area.color || 'var(--theme-border)'}`,
                        backgroundColor: area.color ? `${area.color}08` : 'transparent' 
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center text-theme-text">
                          <div className="w-7 h-7 rounded-full mr-2 flex items-center justify-center text-white" 
                            style={{ backgroundColor: area.color || 'var(--theme-text-muted)' }}>
                            <Layers size={14} />
                          </div>
                          {area.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openProjectForm(area.id)}
                            className="text-sm p-1.5 rounded-lg hover:bg-theme-hover transition-colors text-theme-primary"
                            title="Projekt hinzufügen"
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => toggleArea(area.id)}
                            className="text-theme-text-muted p-1.5 rounded-lg hover:bg-theme-hover transition-colors"
                            title={expandedAreas[area.id] ? "Einklappen" : "Ausklappen"}
                          >
                            {expandedAreas[area.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <button 
                            onClick={() => deleteItem(area.id, 'area')}
                            className="text-theme-text-muted hover:text-theme-error p-1.5 rounded-lg hover:bg-theme-hover transition-colors"
                            title="Bereich löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {area.description && (
                        <p className="mt-1 text-sm text-theme-text-secondary ml-9">
                          {area.description}
                        </p>
                      )}
                    </div>
                    
                    {expandedAreas[area.id] && (
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-theme-text-secondary flex items-center">
                            <Folder size={14} className="mr-1 text-theme-text-muted" />
                            Projekte ({areaProjects.length})
                          </h4>
                        </div>
                        
                        {areaProjects.length > 0 ? (
                          <div className="space-y-4">
                            {areaProjects.map(project => {
                              const projectTasks = getTasksForProject(project.id);
                              return (
                                <div key={`project-${project.id}`} className="border border-theme-border rounded-lg p-3 hover:shadow-sm bg-theme-surface-secondary transition-shadow theme-transition">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-theme-text flex items-center">
                                        <Folder size={16} className="inline mr-1 text-theme-primary" />
                                        {project.name}
                                        <span className="ml-2 text-xs px-2 py-0.5 bg-theme-hover rounded text-theme-text-secondary font-normal">
                                          {projectTasks.length} Aufgaben
                                        </span>
                                      </h5>
                                      
                                      {/* Project tags */}
                                      {project.tags && project.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 ml-5">
                                          {project.tags.map(tag => (
                                            <span 
                                              key={`project-tag-${tag.id}`}
                                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                                              style={{ 
                                                backgroundColor: `${tag.color}15`, 
                                                color: tag.color
                                              }}
                                            >
                                              <Hash size={10} className="mr-1" />
                                              {tag.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center">
                                      <button
                                        onClick={() => toggleProject(project.id)}
                                        className="text-theme-text-muted hover:text-theme-text p-1 rounded hover:bg-theme-hover transition-colors"
                                        title={expandedProjects[project.id] ? "Einklappen" : "Ausklappen"}
                                      >
                                        {expandedProjects[project.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                      <button 
                                        onClick={() => deleteItem(project.id, 'project')}
                                        className="text-theme-text-muted hover:text-theme-error p-1 rounded hover:bg-theme-hover ml-1 transition-colors"
                                        title="Projekt löschen"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {expandedProjects[project.id] && (
                                    <div className="mt-3">
                                      {projectTasks.length > 0 ? (
                                        <ul className="mb-3 border-t border-theme-border">
                                          {projectTasks.map(task => (
                                            <li 
                                              key={`task-${task.id}`} 
                                              className="border-b border-theme-border py-2 hover:bg-theme-hover cursor-pointer transition-colors"
                                              onClick={() => setSelectedTask(task)}
                                            >
                                              <div className="flex justify-between">
                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                  <div className="flex-shrink-0">
                                                    {getStatusIcon(task.status)}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center">
                                                      <span className="font-medium text-theme-text truncate mr-2">
                                                        {task.title}
                                                      </span>
                                                      {isOverdue(task.due_date, task.status) && (
                                                        <span className="text-theme-error text-xs">
                                                          Überfällig
                                                        </span>
                                                      )}
                                                    </div>
                                                    
                                                    {/* Task tags - simplified */}
                                                    {task.tags && task.tags.length > 0 && (
                                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {task.tags.slice(0, 2).map(tag => (
                                                          <span 
                                                            key={`task-tag-${tag.id}`}
                                                            className="text-xs inline-flex"
                                                            style={{color: tag.color}}
                                                          >
                                                            #{tag.name}
                                                          </span>
                                                        ))}
                                                        {task.tags.length > 2 && (
                                                          <span className="text-xs text-theme-text-muted">+{task.tags.length - 2}</span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                  <div className="flex items-center text-theme-text-muted text-xs">
                                                    <Calendar size={12} className="mr-1" />
                                                    <span>{formatDate(task.due_date)}</span>
                                                  </div>
                                                  <select
                                                    value={task.status}
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      updateTaskStatus(task.id, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`text-xs rounded px-2 py-1 border border-theme-border bg-theme-surface ${getStatusClass(task.status)}`}
                                                  >
                                                    <option value="pending">Ausstehend</option>
                                                    <option value="in-progress">In Bearbeitung</option>
                                                    <option value="completed">Abgeschlossen</option>
                                                  </select>
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      deleteItem(task.id, 'task');
                                                    }}
                                                    className="text-theme-text-muted hover:text-theme-error p-1 transition-colors"
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </div>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-theme-text-muted py-2 px-3 mb-2">
                                          Keine Aufgaben in diesem Projekt.
                                        </p>
                                      )}
                                      
                                      <button 
                                        className="text-sm text-white flex items-center w-full justify-center py-1.5 rounded-lg hover:bg-theme-primary-hover transition-colors bg-theme-primary"
                                        onClick={() => openTaskForm(project.id)}
                                      >
                                        <Plus size={14} className="mr-1" />
                                        Aufgabe hinzufügen
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-theme-surface-secondary rounded-lg p-4 text-center">
                            <Folder size={24} className="mx-auto mb-2 text-theme-text-muted" />
                            <p className="text-theme-text-muted text-sm mb-3">Keine Projekte in diesem Bereich.</p>
                            <button 
                              className="text-sm px-3 py-1.5 bg-theme-surface rounded-lg border border-theme-primary hover:bg-theme-hover inline-flex items-center transition-colors text-theme-primary"
                              onClick={() => openProjectForm(area.id)}
                            >
                              <Plus size={14} className="mr-1" />
                              Projekt erstellen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Unassigned Projects */}
              {getUnassignedProjects().length > 0 && (
                <div className="bg-theme-surface rounded-lg overflow-hidden shadow-sm border border-theme-border theme-transition">
                  <div className="p-4 bg-theme-surface-secondary border-b border-theme-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center text-theme-text">
                        <div className="w-7 h-7 rounded-full mr-2 flex items-center justify-center text-white bg-theme-primary">
                          <Folder size={14} />
                        </div>
                        Projekte ohne Bereich
                      </h3>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openProjectForm()}
                          className="text-sm p-1.5 rounded-lg hover:bg-theme-hover transition-colors text-theme-primary"
                          title="Projekt hinzufügen"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => toggleArea('unassigned')}
                          className="text-theme-text-muted p-1.5 rounded-lg hover:bg-theme-hover transition-colors"
                          title={expandedAreas['unassigned'] ? "Einklappen" : "Ausklappen"}
                        >
                          {expandedAreas['unassigned'] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {expandedAreas['unassigned'] && (
                    <div className="p-4">
                      <div className="space-y-4">
                        {getUnassignedProjects().map(project => {
                          const projectTasks = getTasksForProject(project.id);
                          return (
                            <div key={`unassigned-project-${project.id}`} className="border border-theme-border rounded-lg p-3 hover:shadow-sm bg-theme-surface-secondary transition-shadow theme-transition">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-medium text-theme-text flex items-center">
                                    <Folder size={16} className="inline mr-1 text-theme-primary" />
                                    {project.name}
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-theme-hover rounded text-theme-text-secondary font-normal">
                                      {projectTasks.length} Aufgaben
                                    </span>
                                  </h5>
                                  
                                  {/* Project tags */}
                                  {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 ml-5">
                                      {project.tags.map(tag => (
                                        <span 
                                          key={`project-tag-${tag.id}`}
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                                          style={{ 
                                            backgroundColor: `${tag.color}15`, 
                                            color: tag.color
                                          }}
                                        >
                                          <Hash size={10} className="mr-1" />
                                          {tag.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleProject(project.id)}
                                    className="text-theme-text-muted hover:text-theme-text p-1 rounded hover:bg-theme-hover transition-colors"
                                    title={expandedProjects[project.id] ? "Einklappen" : "Ausklappen"}
                                  >
                                    {expandedProjects[project.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </button>
                                  <button 
                                    onClick={() => deleteItem(project.id, 'project')}
                                    className="text-theme-text-muted hover:text-theme-error p-1 rounded hover:bg-theme-hover ml-1 transition-colors"
                                    title="Projekt löschen"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              {expandedProjects[project.id] && (
                                <div className="mt-3">
                                  {projectTasks.length > 0 ? (
                                    <ul className="mb-3 border-t border-theme-border">
                                      {projectTasks.map(task => (
                                        <li 
                                          key={`task-${task.id}`} 
                                          className="border-b border-theme-border py-2 hover:bg-theme-hover cursor-pointer transition-colors"
                                          onClick={() => setSelectedTask(task)}
                                        >
                                          <div className="flex justify-between">
                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                              <div className="flex-shrink-0">
                                                {getStatusIcon(task.status)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center">
                                                  <span className="font-medium text-theme-text truncate mr-2">
                                                    {task.title}
                                                  </span>
                                                  {isOverdue(task.due_date, task.status) && (
                                                    <span className="text-theme-error text-xs">
                                                      Überfällig
                                                    </span>
                                                  )}
                                                </div>
                                                
                                                {/* Task tags - simplified */}
                                                {task.tags && task.tags.length > 0 && (
                                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {task.tags.slice(0, 2).map(tag => (
                                                      <span 
                                                        key={`task-tag-${tag.id}`}
                                                        className="text-xs inline-flex"
                                                        style={{color: tag.color}}
                                                      >
                                                        #{tag.name}
                                                      </span>
                                                    ))}
                                                    {task.tags.length > 2 && (
                                                      <span className="text-xs text-theme-text-muted">+{task.tags.length - 2}</span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <div className="flex items-center text-theme-text-muted text-xs">
                                                <Calendar size={12} className="mr-1" />
                                                <span>{formatDate(task.due_date)}</span>
                                              </div>
                                              <select
                                                value={task.status}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  updateTaskStatus(task.id, e.target.value);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`text-xs rounded px-2 py-1 border border-theme-border bg-theme-surface ${getStatusClass(task.status)}`}
                                              >
                                                <option value="pending">Ausstehend</option>
                                                <option value="in-progress">In Bearbeitung</option>
                                                <option value="completed">Abgeschlossen</option>
                                              </select>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteItem(task.id, 'task');
                                                }}
                                                className="text-theme-text-muted hover:text-theme-error p-1 transition-colors"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-theme-text-muted py-2 px-3 mb-2">
                                      Keine Aufgaben in diesem Projekt.
                                    </p>
                                  )}
                                  
                                  <button 
                                    className="text-sm text-white flex items-center w-full justify-center py-1.5 rounded-lg hover:bg-theme-primary-hover transition-colors bg-theme-primary"
                                    onClick={() => openTaskForm(project.id)}
                                  >
                                    <Plus size={14} className="mr-1" />
                                    Aufgabe hinzufügen
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Unassigned Tasks */}
              {getUnassignedTasks().length > 0 && (
                <div className="bg-theme-surface rounded-lg overflow-hidden shadow-sm border border-theme-border theme-transition">
                  <div className="p-4 bg-theme-surface-secondary border-b border-theme-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center text-theme-text">
                        <div className="w-7 h-7 rounded-full mr-2 flex items-center justify-center text-white bg-theme-primary">
                          <CheckCircle size={14} />
                        </div>
                        Einzelne Aufgaben
                      </h3>
                      <button 
                        onClick={() => openTaskForm()}
                        className="text-sm flex items-center px-3 py-1.5 hover:bg-theme-hover rounded-lg transition-colors text-theme-primary"
                      >
                        <Plus size={14} className="mr-1" />
                        Neue Aufgabe
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-2 divide-y divide-theme-border">
                      {getUnassignedTasks().map(task => (
                        <div 
                          key={`unassigned-task-${task.id}`} 
                          className="flex items-center justify-between py-2 px-2 hover:bg-theme-hover rounded-lg cursor-pointer transition-colors"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium text-theme-text truncate mr-2">
                                  {task.title}
                                </span>
                                {isOverdue(task.due_date, task.status) && (
                                  <span className="px-1.5 py-0.5 text-xs rounded border text-theme-error bg-theme-error-bg border-theme-error-border">
                                    Überfällig
                                  </span>
                                )}
                              </div>
                              
                              {task.description && (
                                <p className="text-xs text-theme-text-muted mt-1 truncate">{task.description}</p>
                              )}
                              
                              {/* Task tags */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {task.tags.slice(0, 2).map(tag => (
                                    <span 
                                      key={`task-tag-${tag.id}`}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
                                      style={{ 
                                        backgroundColor: `${tag.color}15`, 
                                        color: tag.color
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {task.tags.length > 2 && (
                                    <span className="text-xs text-theme-text-muted">+{task.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center text-theme-text-muted text-xs">
                              <Calendar size={12} className="mr-1" />
                              <span>{formatDate(task.due_date)}</span>
                            </div>
                            <div className="flex items-center text-theme-text-muted text-xs">
                              <User size={12} className="mr-1" />
                              <span className="truncate max-w-[100px]">{getAssigneeName(task)}</span>
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(task.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs rounded px-2 py-1 border border-theme-border bg-theme-surface ${getStatusClass(task.status)}`}
                            >
                              <option value="pending">Ausstehend</option>
                              <option value="in-progress">In Bearbeitung</option>
                              <option value="completed">Abgeschlossen</option>
                            </select>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(task.id, 'task');
                              }}
                              className="text-theme-text-muted hover:text-theme-error p-1 rounded hover:bg-theme-hover transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TaskForm Modals */}
        {isTaskModalOpen && (
          <TaskForm 
            type="task" 
            onClose={closeTaskForm} 
            initialProjectId={selectedProjectId}
          />
        )}
        
        {isProjectModalOpen && (
          <TaskForm 
            type="project" 
            onClose={closeProjectForm} 
            initialAreaId={selectedAreaId}
          />
        )}
        
        {isAreaModalOpen && (
          <TaskForm 
            type="area" 
            onClose={closeAreaForm}
          />
        )}

        {/* Task Detail */}
        {selectedTask && (
          <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </div>
    </div>
  );
};

// Wrapper component with context provider
const Tasks = () => {
  return (
    <TasksProvider>
      <TasksContent />
    </TasksProvider>
  );
};

export default Tasks;