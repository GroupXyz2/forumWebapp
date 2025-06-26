'use client';

import { useState, useEffect } from 'react';

interface BrandingSettings {
  branding_logo?: string;
  branding_banner?: string;
  homepage_background?: string;
  forum_background?: string;
  [key: string]: string | undefined;
}

export function useBrandingSettings(locale: string = 'en'): { 
  isLoading: boolean;
  settings: BrandingSettings;
  error: string | null 
} {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<BrandingSettings>({
    branding_logo: '',
    branding_banner: '',
    homepage_background: '',
    forum_background: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrandingSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/${locale}/api/branding?scope=branding`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch branding settings');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.settings)) {
          // Create a starting object with empty strings for all branding keys
          const brandingSettings: BrandingSettings = {
            branding_logo: '',
            branding_banner: '',
            homepage_background: '',
            forum_background: ''
          };
          
          // Process each setting safely
          for (const setting of data.settings) {
            try {
              // Skip settings with null/undefined keys
              if (!setting || !setting.key) continue;
              
              // Initialize with empty string for safety
              let processedValue = '';
              
              // Handle multilingual objects 
              if (setting.value && typeof setting.value === 'object' && !Array.isArray(setting.value)) {
                if (setting.value.en !== undefined || setting.value.de !== undefined) {
                  // Extract value for current locale, fallback to english
                  const localeStr = locale === 'de' ? 'de' : 'en';
                  processedValue = setting.value[localeStr] || setting.value.en || '';
                } else {
                  console.warn(`Setting ${setting.key} has an object value that is not a valid multilingual object`);
                }
              } else if (setting.value === null || setting.value === undefined) {
                // Keep empty string
                processedValue = '';
              } else if (typeof setting.value === 'string') {
                // Use string directly
                processedValue = setting.value;
              } else {
                // Convert any other type to string
                try {
                  processedValue = String(setting.value);
                } catch (e) {
                  console.error(`Failed to convert setting ${setting.key} to string:`, e);
                }
              }
              
              // Assign the processed value to the settings object
              brandingSettings[setting.key] = processedValue;
            } catch (err) {
              console.error(`Error processing setting ${setting?.key}:`, err);
            }
          }
          
          setSettings(brandingSettings);
        } else {
          console.warn('Received invalid branding settings data');
          setSettings({});
        }
      } catch (err) {
        console.error('Error fetching branding settings:', err);
        setError('Failed to load branding settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBrandingSettings();
  }, [locale]);

  return { isLoading, settings, error };
}
