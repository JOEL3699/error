import React, { useState, useEffect } from 'react';
import { 
  Palette, Save, RotateCcw, Upload, X, Sun, Moon, Monitor,
  AlertCircle, CheckCircle, Globe, Sparkles, Eye, Paintbrush
} from 'lucide-react';
import { usePartnerBranding } from '../../context/PartnerBrandingContext';
import { supabase } from '../../components/SupaBase/supabaseClient';

const BrandingEditor = ({ onClose, className }) => {
  const { branding, loading, saveBranding } = usePartnerBranding();
  
  const [formData, setFormData] = useState({
    primary_color: '#3B82F6',
    secondary_color: '#1D4ED8', 
    accent_color: '#10B981',
    user_bubble_color: '#3B82F6',
    agent_bubble_color: '#E5E7EB',
    button_primary_color: '#3B82F6',
    button_secondary_color: '#6B7280',
    hover_color: '#2563EB',
    cmo_color: '#8B5CF6',
    cfo_color: '#F59E0B',
    coo_color: '#10B981',
    second_brain_color: '#3B82F6',
    theme_mode: 'light', // 'light', 'dark', 'auto'
    
    // ✨ NEUE: Theme-spezifische Hintergrundfarben
    light_bg_primary: '#FFFFFF',
    light_bg_secondary: '#F9FAFB',
    light_text_primary: '#111827',
    light_text_secondary: '#6B7280',
    
    dark_bg_primary: '#0F172A',
    dark_bg_secondary: '#1E293B',
    dark_text_primary: '#F1F5F9',
    dark_text_secondary: '#CBD5E1',
    
    favicon_url: null
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState('light'); // 'light', 'dark'

  // Neue States für Dropdown-Steuerung
  const [openSections, setOpenSections] = useState({
    colors: false,
    themes: false,
    agents: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Lade Daten aus Context und wende Live-Branding an
  useEffect(() => {
    if (branding) {
      const newFormData = {
        primary_color: branding.primary_color || '#3B82F6',
        secondary_color: branding.secondary_color || '#1D4ED8',
        accent_color: branding.accent_color || '#10B981',
        user_bubble_color: branding.user_bubble_color || '#3B82F6',
        agent_bubble_color: branding.agent_bubble_color || '#E5E7EB',
        button_primary_color: branding.button_primary_color || '#3B82F6',
        button_secondary_color: branding.button_secondary_color || '#6B7280',
        hover_color: branding.hover_color || '#2563EB',
        cmo_color: branding.cmo_color || '#8B5CF6',
        cfo_color: branding.cfo_color || '#F59E0B',
        coo_color: branding.coo_color || '#10B981',
        second_brain_color: branding.second_brain_color || '#3B82F6',
        theme_mode: branding.theme_mode || 'light',
        
        // Theme Background Colors
        light_bg_primary: branding.light_bg_primary || '#FFFFFF',
        light_bg_secondary: branding.light_bg_secondary || '#F9FAFB',
        light_text_primary: branding.light_text_primary || '#111827',
        light_text_secondary: branding.light_text_secondary || '#6B7280',
        
        dark_bg_primary: branding.dark_bg_primary || '#0F172A',
        dark_bg_secondary: branding.dark_bg_secondary || '#1E293B',
        dark_text_primary: branding.dark_text_primary || '#F1F5F9',
        dark_text_secondary: branding.dark_text_secondary || '#CBD5E1',
        
        favicon_url: branding.favicon_url || null
      };
      
      setFormData(newFormData);
      applyLiveBranding(newFormData);
    }
  }, [branding]);

  // ✨ ERWEITERT: Live-Branding mit Theme-Support
  const applyLiveBranding = (brandingData) => {
    const root = document.documentElement;
    
    const colorMappings = {
      '--primary-color': brandingData.primary_color,
      '--secondary-color': brandingData.secondary_color,
      '--accent-color': brandingData.accent_color,
      '--user-bubble-color': brandingData.user_bubble_color,
      '--agent-bubble-color': brandingData.agent_bubble_color,
      '--button-primary-color': brandingData.button_primary_color,
      '--button-secondary-color': brandingData.button_secondary_color,
      '--hover-color': brandingData.hover_color,
      '--cmo-color': brandingData.cmo_color,
      '--cfo-color': brandingData.cfo_color,
      '--coo-color': brandingData.coo_color,
      '--second-brain-color': brandingData.second_brain_color
    };

    // Theme-spezifische Farben basierend auf aktuellem Preview-Modus
    const currentTheme = previewMode;
    
    if (currentTheme === 'light') {
      colorMappings['--theme-bg'] = brandingData.light_bg_primary;
      colorMappings['--theme-surface'] = brandingData.light_bg_primary;
      colorMappings['--theme-surface-secondary'] = brandingData.light_bg_secondary;
      colorMappings['--theme-text'] = brandingData.light_text_primary;
      colorMappings['--theme-text-secondary'] = brandingData.light_text_secondary;
      colorMappings['--theme-text-muted'] = '#9CA3AF';
      colorMappings['--theme-border'] = '#E5E7EB';
      colorMappings['--theme-hover'] = '#F3F4F6';
      colorMappings['--theme-primary'] = brandingData.primary_color;
      colorMappings['--user-message-bg'] = brandingData.user_bubble_color;
      colorMappings['--agent-message-bg'] = brandingData.agent_bubble_color;
    } else {
      colorMappings['--theme-bg'] = brandingData.dark_bg_primary;
      colorMappings['--theme-surface'] = brandingData.dark_bg_secondary;
      colorMappings['--theme-surface-secondary'] = '#334155';
      colorMappings['--theme-text'] = brandingData.dark_text_primary;
      colorMappings['--theme-text-secondary'] = brandingData.dark_text_secondary;
      colorMappings['--theme-text-muted'] = '#94A3B8';
      colorMappings['--theme-border'] = '#334155';
      colorMappings['--theme-hover'] = '#334155';
      colorMappings['--theme-primary'] = '#60A5FA';
      colorMappings['--user-message-bg'] = brandingData.user_bubble_color;
      colorMappings['--agent-message-bg'] = '#374151';
    }

    Object.entries(colorMappings).forEach(([variable, value]) => {
      if (value) {
        root.style.setProperty(variable, value);
      }
    });

    // Theme-Klasse am Body setzen für globale Effekte
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);

    // Favicon setzen
    if (brandingData.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = brandingData.favicon_url;
    }
  };

  // Farbe ändern mit Live-Update
  const handleColorChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setHasChanges(true);
    // Sofort anwenden für Live-Preview
    applyLiveBranding(newFormData);
  };

  // Theme ändern
  const handleThemeChange = (theme) => {
    const newFormData = { ...formData, theme_mode: theme };
    setFormData(newFormData);
    setHasChanges(true);
    applyLiveBranding(newFormData);
  };

  // Preview Mode ändern - FIX: Sofortige Theme-Anwendung
  const handlePreviewModeChange = (mode) => {
    setPreviewMode(mode);
    // Sofort das Theme anwenden ohne auf Farbpalette zu warten
    setTimeout(() => applyLiveBranding(formData), 0);
  };

  // Favicon hochladen
  const handleFaviconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Datei zu groß. Maximum: 1MB');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        const newFormData = { ...formData, favicon_url: urlData.publicUrl };
        setFormData(newFormData);
        setHasChanges(true);
        applyLiveBranding(newFormData);
      }
    } catch (err) {
      console.error('Fehler beim Favicon-Upload:', err);
      setError('Fehler beim Hochladen des Favicons.');
    } finally {
      setUploading(false);
    }
  };

  // Speichern
  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      const result = await saveBranding(formData);
      
      if (result.success) {
        setSuccessMessage('Branding erfolgreich gespeichert!');
        setHasChanges(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setError(result.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      console.error('Speichern Fehler:', err);
      setError('Fehler beim Speichern der Branding-Einstellungen.');
    } finally {
      setSaving(false);
    }
  };

  // Zurücksetzen
  const handleReset = () => {
    const defaultData = {
      primary_color: '#3B82F6',
      secondary_color: '#1D4ED8',
      accent_color: '#10B981',
      user_bubble_color: '#3B82F6',
      agent_bubble_color: '#E5E7EB',
      button_primary_color: '#3B82F6',
      button_secondary_color: '#6B7280',
      hover_color: '#2563EB',
      cmo_color: '#8B5CF6',
      cfo_color: '#F59E0B',
      coo_color: '#10B981',
      second_brain_color: '#3B82F6',
      theme_mode: 'light',
      
      light_bg_primary: '#FFFFFF',
      light_bg_secondary: '#F9FAFB',
      light_text_primary: '#111827',
      light_text_secondary: '#6B7280',
      
      dark_bg_primary: '#0F172A',
      dark_bg_secondary: '#1E293B',
      dark_text_primary: '#F1F5F9',
      dark_text_secondary: '#CBD5E1',
      
      favicon_url: null
    };
    
    setFormData(defaultData);
    setHasChanges(true);
    applyLiveBranding(defaultData);
  };

  // Predefined Color Palettes - VOLLSTÄNDIG mit allen Agent-Farben
  const colorPalettes = [
    {
      name: 'Ocean Blue',
      colors: { 
        primary_color: '#3B82F6', 
        secondary_color: '#1D4ED8', 
        user_bubble_color: '#2563EB',
        agent_bubble_color: '#EFF6FF',
        second_brain_color: '#3B82F6',
        cmo_color: '#8B5CF6',
        cfo_color: '#0EA5E9',
        coo_color: '#06B6D4',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#F0F9FF',
        dark_bg_primary: '#0C1E3A',
        dark_bg_secondary: '#1E3A8A'
      }
    },
    {
      name: 'Forest Green',
      colors: { 
        primary_color: '#10B981', 
        secondary_color: '#059669', 
        user_bubble_color: '#047857',
        agent_bubble_color: '#ECFDF5',
        second_brain_color: '#10B981',
        cmo_color: '#8B5CF6',
        cfo_color: '#F59E0B',
        coo_color: '#34D399',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#F0FDF4',
        dark_bg_primary: '#022C22',
        dark_bg_secondary: '#064E3B'
      }
    },
    {
      name: 'Royal Purple',
      colors: { 
        primary_color: '#8B5CF6', 
        secondary_color: '#7C3AED', 
        user_bubble_color: '#6D28D9',
        agent_bubble_color: '#FAF5FF',
        second_brain_color: '#8B5CF6',
        cmo_color: '#A78BFA',
        cfo_color: '#F59E0B',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#FAF5FF',
        dark_bg_primary: '#2D1B69',
        dark_bg_secondary: '#4C1D95'
      }
    },
    {
      name: 'Sunset Orange',
      colors: { 
        primary_color: '#F59E0B', 
        secondary_color: '#D97706', 
        user_bubble_color: '#B45309',
        agent_bubble_color: '#FFFBEB',
        second_brain_color: '#F59E0B',
        cmo_color: '#8B5CF6',
        cfo_color: '#FBB02D',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#FFFBEB',
        dark_bg_primary: '#451A03',
        dark_bg_secondary: '#92400E'
      }
    },
    {
      name: 'Dark Mode Pro',
      colors: { 
        primary_color: '#60A5FA', 
        secondary_color: '#3B82F6', 
        user_bubble_color: '#2563EB',
        agent_bubble_color: '#1E293B',
        second_brain_color: '#60A5FA',
        cmo_color: '#A78BFA',
        cfo_color: '#FBBF24',
        coo_color: '#34D399',
        light_bg_primary: '#F8FAFC',
        light_bg_secondary: '#F1F5F9',
        dark_bg_primary: '#0F172A',
        dark_bg_secondary: '#1E293B'
      }
    },
    {
      name: 'Crimson Red',
      colors: { 
        primary_color: '#DC2626', 
        secondary_color: '#B91C1C', 
        user_bubble_color: '#991B1B',
        agent_bubble_color: '#FEF2F2',
        second_brain_color: '#DC2626',
        cmo_color: '#EC4899',
        cfo_color: '#F59E0B',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#FEF2F2',
        dark_bg_primary: '#450A0A',
        dark_bg_secondary: '#7F1D1D'
      }
    },
    {
      name: 'Teal Fresh',
      colors: { 
        primary_color: '#14B8A6', 
        secondary_color: '#0D9488', 
        user_bubble_color: '#0F766E',
        agent_bubble_color: '#F0FDFA',
        second_brain_color: '#14B8A6',
        cmo_color: '#8B5CF6',
        cfo_color: '#F59E0B',
        coo_color: '#34D399',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#F0FDFA',
        dark_bg_primary: '#042F2E',
        dark_bg_secondary: '#134E4A'
      }
    },
    {
      name: 'Rose Gold',
      colors: { 
        primary_color: '#EC4899', 
        secondary_color: '#DB2777', 
        user_bubble_color: '#BE185D',
        agent_bubble_color: '#FDF2F8',
        second_brain_color: '#EC4899',
        cmo_color: '#A78BFA',
        cfo_color: '#F59E0B',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#FDF2F8',
        dark_bg_primary: '#500724',
        dark_bg_secondary: '#831843'
      }
    },
    {
      name: 'Midnight Blue',
      colors: { 
        primary_color: '#1E40AF', 
        secondary_color: '#1D4ED8', 
        user_bubble_color: '#1E3A8A',
        agent_bubble_color: '#EFF6FF',
        second_brain_color: '#1E40AF',
        cmo_color: '#8B5CF6',
        cfo_color: '#F59E0B',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#EFF6FF',
        dark_bg_primary: '#0C1E3A',
        dark_bg_secondary: '#1E3A8A'
      }
    },
    {
      name: 'Warm Gray',
      colors: { 
        primary_color: '#6B7280', 
        secondary_color: '#4B5563', 
        user_bubble_color: '#374151',
        agent_bubble_color: '#F9FAFB',
        second_brain_color: '#6B7280',
        cmo_color: '#8B5CF6',
        cfo_color: '#F59E0B',
        coo_color: '#10B981',
        light_bg_primary: '#FFFFFF',
        light_bg_secondary: '#F9FAFB',
        dark_bg_primary: '#111827',
        dark_bg_secondary: '#374151'
      }
    }
  ];

  // Apply Color Palette - ERWEITERT: Setze ALLE Agent-Farben + Dark Mode Anpassung
  const applyColorPalette = (palette) => {
    // Hilfsfunktion zum Abdunkeln von Farben für Dark Mode
    const darkenColor = (hexColor, amount = 0.3) => {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      const newR = Math.floor(r * (1 - amount));
      const newG = Math.floor(g * (1 - amount));
      const newB = Math.floor(b * (1 - amount));
      
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    };

    // Im Dark Mode die Hauptfarben abdunkeln
    const adjustedColors = { ...palette.colors };
    if (previewMode === 'dark') {
      adjustedColors.primary_color = darkenColor(palette.colors.primary_color, 0.2);
      adjustedColors.secondary_color = darkenColor(palette.colors.secondary_color, 0.25);
      adjustedColors.user_bubble_color = darkenColor(palette.colors.user_bubble_color, 0.15);
    }

    // Komplette Palette mit allen KI-Agent Farben
    const completeFormData = {
      ...formData,
      ...adjustedColors,
      // Stelle sicher, dass ALLE Agent-Farben gesetzt werden
      cmo_color: palette.colors.cmo_color || adjustedColors.primary_color,
      cfo_color: palette.colors.cfo_color || '#F59E0B', // Fallback Orange
      coo_color: palette.colors.coo_color || '#10B981', // Fallback Green
      second_brain_color: palette.colors.second_brain_color || adjustedColors.primary_color,
      // Agent Bubble Color auch anpassen
      agent_bubble_color: palette.colors.agent_bubble_color || (previewMode === 'dark' ? '#374151' : '#E5E7EB')
    };
    
    setFormData(completeFormData);
    setHasChanges(true);
    applyLiveBranding(completeFormData);
  };

  // Farbfeld-Komponente - VEREINFACHT ohne Beschreibung
  const ColorField = ({ label, field, size = 'normal' }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-theme-text">{label}</label>
      <div className="flex items-center space-x-3">
        <div 
          className={`${size === 'small' ? 'w-6 h-6' : 'w-8 h-8'} rounded border-2 border-theme-border shadow-sm flex-shrink-0 cursor-pointer`}
          style={{ backgroundColor: formData[field] }}
          onClick={() => document.getElementById(`color-${field}`).click()}
        />
        <div className="flex-1 min-w-0">
          <input
            id={`color-${field}`}
            type="color"
            value={formData[field]}
            onChange={(e) => handleColorChange(field, e.target.value)}
            className="w-full h-8 border border-theme-border rounded cursor-pointer"
          />
          <input
            type="text"
            value={formData[field]}
            onChange={(e) => handleColorChange(field, e.target.value)}
            className="mt-1 w-full text-xs border border-theme-border rounded px-2 py-1 font-mono bg-theme-surface text-theme-text"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-theme-bg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
          <span className="mt-3 text-theme-text text-sm">Lade Branding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col h-full bg-theme-bg theme-transition`}>
      {/* Header */}
      <div className="p-6 border-b border-theme-border bg-theme-surface flex-shrink-0 theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme-text flex items-center">
            <Palette className="mr-2 text-theme-primary" size={20} />
            App-Branding
          </h3>
          
          <button
            onClick={onClose}
            className="p-1 text-theme-text-secondary hover:text-theme-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons - OHNE Theme Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center px-3 py-1.5 bg-theme-surface-secondary text-theme-text rounded-md hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center px-3 py-1.5 bg-theme-primary text-white rounded-md hover:bg-theme-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
            ) : (
              <Save size={14} className="mr-1" />
            )}
            {saving ? 'Speichert...' : 'Speichern'}
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mt-4 p-3 bg-theme-success-bg border border-theme-success-border text-theme-success rounded-md flex items-center text-sm">
            <CheckCircle size={16} className="mr-2" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-theme-error-bg border border-theme-error-border text-theme-error rounded-md flex items-center text-sm">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-theme-bg min-h-0 custom-scrollbar">
        
        {/* Color Palettes - IMMER OFFEN */}
        <div className="modern-card p-4 bg-theme-surface">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-theme-text flex items-center">
              <Sparkles size={16} className="mr-2 text-theme-primary" />
              Farbpaletten
            </h4>
            
            {/* Theme Toggle bei Farbpaletten */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreviewModeChange('light')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center ${
                  previewMode === 'light' 
                    ? 'bg-theme-primary text-white' 
                    : 'bg-theme-surface-secondary text-theme-text hover:bg-theme-hover'
                }`}
              >
                <Sun size={14} className="mr-1" />
                Hell
              </button>
              <button
                onClick={() => handlePreviewModeChange('dark')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center ${
                  previewMode === 'dark' 
                    ? 'bg-theme-primary text-white' 
                    : 'bg-theme-surface-secondary text-theme-text hover:bg-theme-hover'
                }`}
              >
                <Moon size={14} className="mr-1" />
                Dunkel
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {colorPalettes.map((palette, index) => (
              <button
                key={index}
                onClick={() => applyColorPalette(palette)}
                className="p-3 border border-theme-border rounded-lg hover:bg-theme-hover transition-colors bg-theme-surface-secondary group"
              >
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <div className="w-3 h-3 rounded-full border border-theme-border/50" style={{ backgroundColor: palette.colors.primary_color }}></div>
                  <div className="w-3 h-3 rounded-full border border-theme-border/50" style={{ backgroundColor: palette.colors.secondary_color }}></div>
                  <div className="w-3 h-3 rounded-full border border-theme-border/50" style={{ backgroundColor: palette.colors.cmo_color }}></div>
                </div>
                <div className="text-xs font-medium text-theme-text group-hover:text-theme-primary transition-colors">{palette.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hauptfarben - DROPDOWN */}
        <div className="modern-card bg-theme-surface">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full p-4 flex items-center justify-between hover:bg-theme-hover transition-colors"
          >
            <h4 className="text-md font-semibold text-theme-text flex items-center">
              <Paintbrush size={16} className="mr-2 text-theme-primary" />
              Hauptfarben
            </h4>
            <div className={`transform transition-transform ${openSections.colors ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSections.colors && (
            <div className="px-4 pb-4 border-t border-theme-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <ColorField label="Primärfarbe" field="primary_color" />
                <ColorField label="Sekundärfarbe" field="secondary_color" />
                <ColorField label="User Nachrichten" field="user_bubble_color" />
                <ColorField label="Agent Nachrichten" field="agent_bubble_color" />
              </div>
            </div>
          )}
        </div>

        {/* Theme Background Colors - DROPDOWN */}
        <div className="modern-card bg-theme-surface">
          <button
            onClick={() => toggleSection('themes')}
            className="w-full p-4 flex items-center justify-between hover:bg-theme-hover transition-colors"
          >
            <h4 className="text-md font-semibold text-theme-text flex items-center">
              <Sun size={16} className="mr-2 text-theme-primary" />
              Theme-Hintergrundfarben
            </h4>
            <div className={`transform transition-transform ${openSections.themes ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSections.themes && (
            <div className="px-4 pb-4 border-t border-theme-border">
              {/* Light Theme Colors */}
              <div className="mt-4 mb-6">
                <h5 className="text-sm font-medium text-theme-text mb-3 flex items-center">
                  <Sun size={14} className="mr-2" />
                  Heller Modus
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorField label="Haupthintergrund" field="light_bg_primary" size="small" />
                  <ColorField label="Sekundärer Hintergrund" field="light_bg_secondary" size="small" />
                  <ColorField label="Haupttext" field="light_text_primary" size="small" />
                  <ColorField label="Sekundärer Text" field="light_text_secondary" size="small" />
                </div>
              </div>

              {/* Dark Theme Colors */}
              <div>
                <h5 className="text-sm font-medium text-theme-text mb-3 flex items-center">
                  <Moon size={14} className="mr-2" />
                  Dunkler Modus
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorField label="Haupthintergrund" field="dark_bg_primary" size="small" />
                  <ColorField label="Sekundärer Hintergrund" field="dark_bg_secondary" size="small" />
                  <ColorField label="Haupttext" field="dark_text_primary" size="small" />
                  <ColorField label="Sekundärer Text" field="dark_text_secondary" size="small" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KI-Agent Farben - DROPDOWN */}
        <div className="modern-card bg-theme-surface">
          <button
            onClick={() => toggleSection('agents')}
            className="w-full p-4 flex items-center justify-between hover:bg-theme-hover transition-colors"
          >
            <h4 className="text-md font-semibold text-theme-text">🤖 KI-Agent Farben</h4>
            <div className={`transform transition-transform ${openSections.agents ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {openSections.agents && (
            <div className="px-4 pb-4 border-t border-theme-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <ColorField label="Second Brain" field="second_brain_color" size="small" />
                <ColorField label="CMO Agent" field="cmo_color" size="small" />
                <ColorField label="CFO Agent" field="cfo_color" size="small" />
                <ColorField label="COO Agent" field="coo_color" size="small" />
              </div>
            </div>
          )}
        </div>

        {/* Favicon */}
        <div className="modern-card p-4 bg-theme-surface">
          <h4 className="text-md font-semibold text-theme-text mb-4">Favicon</h4>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-theme-surface-secondary rounded border-2 border-theme-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {formData.favicon_url ? (
                <img 
                  src={formData.favicon_url} 
                  alt="Favicon" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Globe size={24} className="text-theme-text-secondary" />
              )}
            </div>

            <div className="flex-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`flex items-center px-4 py-3 border-2 border-dashed rounded-lg transition-colors text-sm ${
                  uploading 
                    ? 'border-theme-border bg-theme-surface-secondary cursor-not-allowed' 
                    : 'border-theme-border hover:border-theme-primary hover:bg-theme-primary/5'
                }`}>
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-theme-primary mr-3" />
                  ) : (
                    <Upload size={20} className="mr-3 text-theme-text-secondary" />
                  )}
                  <div>
                    <div className="font-medium text-theme-text">
                      {uploading ? 'Lädt...' : 'Favicon hochladen'}
                    </div>
                    <div className="text-theme-text-secondary text-xs">PNG, ICO, JPG (max. 1MB)</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="modern-card p-3 bg-theme-warning-bg border border-theme-warning-border">
            <div className="flex items-center text-theme-warning">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">Sie haben ungespeicherte Änderungen.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandingEditor;