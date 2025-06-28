import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../components/SupaBase/supabaseClient';
import { useAuth } from '../pages/Auth/AuthContext';

const PartnerBrandingContext = createContext();

export const usePartnerBranding = () => {
  const context = useContext(PartnerBrandingContext);
  if (!context) {
    throw new Error('usePartnerBranding must be used within PartnerBrandingProvider');
  }
  return context;
};

export const PartnerBrandingProvider = ({ children }) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState(null);

  // 🔧 REFS zur Vermeidung von Endlos-Schleifen
  const brandingLoadingRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const mountedRef = useRef(true);

  // 🔧 VERBESSERTE loadBranding Funktion - nur einmal pro User
  const loadBranding = useCallback(async () => {
    // 🔧 Verhindere mehrfache Branding-Loads für denselben User
    if (!user?.id || 
        brandingLoadingRef.current || 
        currentUserIdRef.current === user.id) {
      console.log('🔧 DEBUG - Branding loading skipped for user:', user?.id);
      setLoading(false);
      return;
    }
    
    try {
      brandingLoadingRef.current = true;
      currentUserIdRef.current = user.id;
      
      console.log('🔍 DEBUG - Loading branding for user:', user.id);
      console.log('🔍 DEBUG - User email:', user.email);
      
      // 🔧 STEP 1: Determine if user is employee or admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', user.id)
        .single();

      console.log('🔍 DEBUG - Profile Data:', profileData);
      console.log('🔍 DEBUG - Profile Error:', profileError);

      if (profileError) {
        console.error('❌ DEBUG - Error loading user profile:', profileError);
        // Continue with user.id as fallback
      }

      // 🔧 STEP 2: Use employee_id if exists (user is employee), otherwise use user.id (user is admin)
      const actualPartnerId = profileData?.employee_id || user.id;
      setPartnerId(actualPartnerId);
      
      console.log('🔍 DEBUG - Actual Partner ID:', actualPartnerId);
      console.log('🎯 DEBUG - User is:', profileData?.employee_id ? 'EMPLOYEE' : 'ADMIN/PARTNER');
      console.log('🎯 DEBUG - Employee ID:', profileData?.employee_id || 'NULL');
      
      // STEP 3: Load branding for the partner (admin)
      console.log('🔍 DEBUG - Querying partner_branding for partner_id:', actualPartnerId);
      
      const { data: brandingData, error: brandingError } = await supabase
        .from('partner_branding')
        .select('*')
        .eq('partner_id', actualPartnerId)
        .eq('is_active', true)
        .single();

      console.log('🔍 DEBUG - Branding Query Result:');
      console.log('  - Data:', brandingData);
      console.log('  - Error:', brandingError);

      if (!mountedRef.current) return; // Component unmounted check

      if (!brandingError && brandingData) {
        console.log('✅ DEBUG - Branding loaded from partner_branding!');
        console.log('🎨 DEBUG - Primary Color:', brandingData.primary_color);
        console.log('🎨 DEBUG - Secondary Color:', brandingData.secondary_color);
        console.log('🎨 DEBUG - User Bubble Color:', brandingData.user_bubble_color);
        
        setBranding(brandingData);
        applyBranding(brandingData);
        setLoading(false);
        return;
      } else {
        console.log('❌ DEBUG - No branding in partner_branding, trying license fallback...');
        console.log('❌ DEBUG - Branding Error Details:', brandingError);
      }
      
      // STEP 4: Fallback - Load from partner_licenses.branding_config
      console.log('🔍 DEBUG - Querying partner_licenses for user_id:', actualPartnerId);
      
      const { data: licenseData, error: licenseError } = await supabase
        .from('partner_licenses')
        .select('branding_config')
        .eq('user_id', actualPartnerId)
        .single();

      console.log('🔍 DEBUG - License Query Result:');
      console.log('  - Data:', licenseData);
      console.log('  - Error:', licenseError);

      if (!mountedRef.current) return; // Component unmounted check

      if (!licenseError && licenseData?.branding_config) {
        console.log('✅ DEBUG - Branding loaded from license fallback:', licenseData.branding_config);
        setBranding(licenseData.branding_config);
        applyBranding(licenseData.branding_config);
      } else {
        console.log('❌ DEBUG - No branding found anywhere, using defaults');
        console.log('❌ DEBUG - License Error Details:', licenseError);
      }
    } catch (err) {
      console.error('❌ DEBUG - Branding load error:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      brandingLoadingRef.current = false;
    }
  }, [user?.id]); // 🔧 Nur user.id als Dependency, nicht das ganze user-Objekt

  const applyBranding = useCallback((branding) => {
    if (!branding) {
      console.log('❌ DEBUG - No branding data to apply');
      return;
    }
    
    console.log('🎨 DEBUG - Starting to apply branding:', branding);
    console.log('🎨 DEBUG - Primary color being applied:', branding.primary_color);
    
    // Erweiterte Farbmappings für alle UI-Elemente
    const colorMappings = {
      // Haupt-Farben
      '--primary-color': branding.primary_color || '#96d35f',
      '--secondary-color': branding.secondary_color || '#4f7a28', 
      '--accent-color': branding.accent_color || '#ffffff',
      
      // Sidebar-spezifische Farben (NEU!)
      '--sidebar-bg-color': branding.primary_color || '#96d35f', // Verwende Primary für Sidebar BG
      '--sidebar-text-color': '#ffffff', // Weiß für bessere Lesbarkeit
      '--sidebar-text-muted': '#f0f0f0', // Helles Grau für sekundären Text
      '--sidebar-active-color': branding.secondary_color || '#4f7a28',
      '--sidebar-hover-color': branding.secondary_color || '#4f7a28',
      
      // Dashboard Farben
      '--dashboard-bg-color': '#f9fafb',
      '--card-bg-color': '#ffffff',
      
      // Button Farben
      '--button-primary-color': branding.primary_color || '#96d35f',
      '--button-secondary-color': branding.secondary_color || '#4f7a28',
      '--button-text-color': '#ffffff',
      '--hover-color': branding.secondary_color || '#4f7a28',
      
      // Chat Farben
      '--user-bubble-color': branding.user_bubble_color || branding.primary_color || '#96d35f',
      '--agent-bubble-color': '#E5E7EB',
      '--chat-bg-color': '#f9fafb',
      
      // Agent-spezifische Farben
      '--cmo-color': branding.cmo_color || '#c3d117',
      '--cfo-color': branding.cfo_color || '#7a4a00', 
      '--coo-color': branding.coo_color || '#ff8647',
      '--second-brain-color': branding.second_brain_color || branding.primary_color || '#96d35f',
      
      // Text Farben
      '--text-primary-color': '#111827',
      '--text-secondary-color': '#6b7280',
      '--text-muted-color': '#9ca3af',
      '--text-inverse-color': '#ffffff', // Für dunkle Hintergründe
      
      // Border und Schatten
      '--border-color': '#e5e7eb',
      '--border-hover-color': branding.primary_color || '#96d35f',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)',
      
      // Status Farben
      '--success-color': '#10b981',
      '--warning-color': '#f59e0b', 
      '--error-color': '#ef4444',
      '--info-color': branding.primary_color || '#96d35f'
    };
    
    console.log('🎨 DEBUG - Color mappings to apply:', colorMappings);
    
    // CSS-Variablen auf :root Element anwenden
    const root = document.documentElement;
    Object.entries(colorMappings).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
      console.log(`🎨 DEBUG - Successfully set ${variable} to ${value}`);
    });
    
    // Zusätzliche Klassen für spezielle Styling
    root.classList.add('partner-branded');
    root.classList.add('sidebar-styled');
    
    // Favicon setzen
    if (branding.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon_url;
      console.log('🔗 DEBUG - Favicon set to:', branding.favicon_url);
    } else {
      console.log('⚠️ DEBUG - No favicon URL provided');
    }

    // Final check: Log what CSS variables are actually set
    console.log('🎨 DEBUG - Final CSS Variables Check:');
    Object.keys(colorMappings).forEach(cssVar => {
      const value = getComputedStyle(root).getPropertyValue(cssVar);
      console.log(`  ${cssVar}: ${value || 'NOT SET'}`);
    });
    
    console.log('🎨 DEBUG - All CSS variables applied successfully');
  }, []);

  // 🔧 UPDATED: Only allow admins to save branding (not employees)
  const saveBranding = async (newBranding) => {
    if (!user) return { success: false, error: 'No user' };
    
    console.log('🚀 DEBUG - saveBranding called by user:', user.id);
    
    // 🔧 Check if current user is admin (not employee)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('id', user.id)
      .single();

    console.log('🔍 DEBUG - Save: Profile check result:', profileData);

    if (profileData?.employee_id) {
      console.log('❌ DEBUG - Save blocked: User is employee, not admin');
      return { 
        success: false, 
        error: 'Only admins can modify branding settings. Please contact your administrator.' 
      };
    }
    
    try {
      console.log('🚀 DEBUG - Saving branding for admin:', user.id);
      console.log('🎨 DEBUG - Branding data to save:', newBranding);

      // Use user.id directly since we confirmed user is admin
      const actualPartnerId = user.id;

      // STEP 1: Try UPDATE first (if entry exists)
      console.log('📝 DEBUG - Trying UPDATE first for partner_id:', actualPartnerId);
      const { data: updateData, error: updateError } = await supabase
        .from('partner_branding')
        .update({
          ...newBranding,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('partner_id', actualPartnerId)
        .select();

      console.log('📝 DEBUG - UPDATE result:', { updateData, updateError });

      // If UPDATE was successful (at least one row affected)
      if (!updateError && updateData && updateData.length > 0) {
        console.log('✅ DEBUG - Branding updated successfully:', updateData);
        
        // Also update partner_licenses.branding_config as backup
        const { error: licenseError } = await supabase
          .from('partner_licenses')
          .update({ 
            branding_config: newBranding,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', actualPartnerId);

        if (licenseError) {
          console.warn('⚠️ DEBUG - License branding_config update failed:', licenseError);
        } else {
          console.log('✅ DEBUG - License backup updated successfully');
        }

        setBranding(newBranding);
        applyBranding(newBranding);
        
        return { success: true, data: updateData };
      }

      // STEP 2: If UPDATE affected no rows → INSERT
      console.log('➕ DEBUG - No existing entry found, creating new one...');
      const { data: insertData, error: insertError } = await supabase
        .from('partner_branding')
        .insert({
          partner_id: actualPartnerId,
          ...newBranding,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      console.log('➕ DEBUG - INSERT result:', { insertData, insertError });

      if (insertError) {
        console.error('❌ DEBUG - Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ DEBUG - Branding created successfully:', insertData);

      // Also update partner_licenses.branding_config as backup
      const { error: licenseError } = await supabase
        .from('partner_licenses')
        .update({ 
          branding_config: newBranding,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', actualPartnerId);

      if (licenseError) {
        console.warn('⚠️ DEBUG - License branding_config update failed:', licenseError);
      } else {
        console.log('✅ DEBUG - License backup updated successfully');
      }

      setBranding(newBranding);
      applyBranding(newBranding);
      
      return { success: true, data: insertData };
    } catch (error) {
      console.error('❌ DEBUG - Branding save error:', error);
      return { success: false, error: error.message };
    }
  };

  // 🔧 HAUPTINITIALISIERUNG - nur einmal pro User ausführen
  useEffect(() => {
    console.log('🔄 DEBUG - useEffect triggered, user:', user?.id);
    if (user?.id) {
      loadBranding();
    } else {
      // Reset states when no user
      currentUserIdRef.current = null;
      setBranding(null);
      setPartnerId(null);
      setLoading(false);
    }
  }, [user?.id, loadBranding]); // 🔧 Nur user.id als Dependency

  // 🔧 Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <PartnerBrandingContext.Provider value={{ 
      branding, 
      loading, 
      partnerId,
      reload: loadBranding,
      saveBranding 
    }}>
      {children}
    </PartnerBrandingContext.Provider>
  );
};