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
  const [settings, setSettings] = useState<BrandingSettings>({});
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
          // Convert array of settings to an object with key-value pairs
          const brandingSettings: BrandingSettings = {};
          
          data.settings.forEach((setting: any) => {
            // Handle multilingual values
            if (setting.value && typeof setting.value === 'object' && (setting.value.en || setting.value.de)) {
              // Extract value for current locale, fallback to english, or empty string
              const localeStr = locale === 'de' ? 'de' : 'en';
              brandingSettings[setting.key] = setting.value[localeStr] || setting.value.en || '';
            } else {
              brandingSettings[setting.key] = setting.value || '';
            }
          });
          
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
