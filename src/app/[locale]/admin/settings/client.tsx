'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';
// Import branding image uploader
import BrandingImageUploader from '@/components/admin/BrandingImageUploader';

// Helper function for translation
const tr = (locale: string, key: string, section = 'admin') => {
  const localeStr = locale === 'de' ? 'de' : 'en';
  const translations = localeStr === 'de' ? deTranslations : enTranslations;
  const sectionObj = (translations as any)[section];
  
  if (!sectionObj) return key;
  
  const value = sectionObj[key];
  
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) return key;
  return typeof value === 'undefined' ? key : String(value);
};

// Helper function to safely extract setting value based on locale
const getSettingStringValue = (value: any, locale: string): string => {
  // Handle undefined or null
  if (value === null || value === undefined) return '';
  
  // Handle simple strings
  if (typeof value === 'string') return value;
  
  // Handle multilingual objects with en/de keys
  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    // For multilingual objects
    const localeStr = locale === 'de' ? 'de' : 'en';
    
    // Check if it has locale keys
    if (value.en !== undefined || value.de !== undefined) {
      return value[localeStr] || value.en || '';
    }
    
    // For other objects, avoid rendering them directly
    return '';
  }
  
  // Convert any other types to string
  return String(value);
};

const tc = (locale: string, key: string) => {
  return tr(locale, key, 'common');
};

interface Setting {
  _id: string;
  key: string;
  value: string | { en: string; de: string };
  type: 'string' | 'text' | 'color' | 'image';
  scope: 'homepage' | 'global' | 'forum';
  updatedAt: string;
}

interface SettingsClientProps {
  locale: string;
}

export default function SettingsClient({ locale }: SettingsClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push(`/${locale}/forum`);
      } else {
        fetchSettings();
      }
    } else if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/settings`);
    }
  }, [session, status, router, locale]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Fetch settings for homepage, content, legal pages, and branding
      const [homepageResponse, contentResponse, brandingResponse, pageTermsResponse, pagePrivacyResponse, pageContactResponse] = await Promise.all([
        fetch(`/${locale}/api/admin/settings?scope=homepage`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`/${locale}/api/admin/settings?scope=content`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`/${locale}/api/admin/settings?scope=branding`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`/${locale}/api/admin/settings?key=page_terms`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`/${locale}/api/admin/settings?key=page_privacy`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`/${locale}/api/admin/settings?key=page_contact`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ]);
      
      if (!homepageResponse.ok || !contentResponse.ok || !brandingResponse.ok) {
        throw new Error(`Failed to fetch settings`);
      }
      
      const homepageData = await homepageResponse.json();
      const contentData = await contentResponse.json();
      const brandingData = await brandingResponse.json();
      const pageTermsData = await pageTermsResponse.json();
      const pagePrivacyData = await pagePrivacyResponse.json();
      const pageContactData = await pageContactResponse.json();
      
      const allSettings = [
        ...(Array.isArray(homepageData.settings) ? homepageData.settings : []),
        ...(Array.isArray(contentData.settings) ? contentData.settings : []),
        ...(Array.isArray(brandingData.settings) ? brandingData.settings : []),
        ...(Array.isArray(pageTermsData.settings) ? pageTermsData.settings : []),
        ...(Array.isArray(pagePrivacyData.settings) ? pagePrivacyData.settings : []),
        ...(Array.isArray(pageContactData.settings) ? pageContactData.settings : [])
      ];
      
      if (allSettings.length > 0) {
        setSettings(allSettings);
      } else {
        setSettings([]);
        console.warn('Received invalid settings data');
      }
    } catch (err) {
      setError('Error loading settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      const formData = new FormData(event.currentTarget);
      
      // Process existing settings
      const updates = settings.map(setting => {
        const settingUpdates: any = { key: setting.key };
        
        if (typeof setting.value === 'object' && setting.value !== null) {
          // Handle multilingual settings
          settingUpdates.value = {
            en: formData.get(`${setting.key}_en`) as string || '',
            de: formData.get(`${setting.key}_de`) as string || '',
          };
        } else {
          // Handle single-language settings
          settingUpdates.value = formData.get(setting.key) as string || '';
        }
        
        return settingUpdates;
      });
      
      // Handle the new legal page settings
      const legalPageKeys = ['page_privacy', 'page_terms', 'page_contact'];
      const newLegalSettings = legalPageKeys.map(key => {
        // Check if this setting already exists
        const existingSetting = settings.find(s => s.key === key);
        
        return {
          key,
          value: {
            en: formData.get(`${key}_en`) as string || '',
            de: formData.get(`${key}_de`) as string || '',
          },
          // If the setting already exists, it will be updated through the updates array
          // Otherwise, we add it as a new setting with proper scope and type
          ...(existingSetting ? {} : { 
            type: 'text',
            scope: 'content'
          })
        };
      });
      
      // Filter out legal settings that already exist in the main settings
      const newLegalSettingsToAdd = newLegalSettings.filter(
        newSetting => !settings.some(s => s.key === newSetting.key)
      );
      // Combine existing settings updates with new legal settings
      const combinedUpdates = [...updates, ...newLegalSettingsToAdd];
      
      const response = await fetch(`/${locale}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: combinedUpdates }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`);
      }
      
      setSuccessMessage(tc(locale, 'settingsSaved') || 'Settings saved successfully');
      
      // Refetch settings to get the updated values
      fetchSettings();
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
      
      // Show success message for 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="flex justify-center items-center h-64">{tc(locale, 'loading')}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">          <div className="mb-6">
            <h1 className="text-2xl font-bold">{tr(locale, 'siteSettings', 'admin') || 'Site Settings'}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {tr(locale, 'siteSettingsDescription', 'admin') || 'Customize the pages and content of your forum'}
            </p>
          </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">{tc(locale, 'loading')}</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">{tr(locale, 'mainSection', 'admin') || 'Main Section'}</h2>
              
              {settings.filter(s => ['homepage_title', 'homepage_slogan'].includes(s.key)).map(setting => (
                <div key={setting.key} className="mb-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {tr(locale, setting.key.replace('homepage_', ''), 'admin') || setting.key}:
                    </label>
                  </div>
                  
                  {typeof setting.value === 'object' && setting.value !== null ? (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">EN:</span>
                          {setting.type === 'text' ? (
                            <textarea
                              name={`${setting.key}_en`}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.en || ''}
                            ></textarea>
                          ) : (
                            <input
                              type="text"
                              name={`${setting.key}_en`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.en || ''}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">DE:</span>
                          {setting.type === 'text' ? (
                            <textarea
                              name={`${setting.key}_de`}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.de || ''}
                            ></textarea>
                          ) : (
                            <input
                              type="text"
                              name={`${setting.key}_de`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.de || ''}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    setting.type === 'text' ? (
                      <textarea
                        name={setting.key}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={getSettingStringValue(setting.value, locale)}
                      ></textarea>
                    ) : (
                      <input
                        type="text"
                        name={setting.key}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={getSettingStringValue(setting.value, locale)}
                      />
                    )
                  )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">{tr(locale, 'featuresSection', 'admin') || 'Features Section'}</h2>
              
              {/* Feature Box 1 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{tr(locale, 'featureBox', 'admin') || 'Feature Box'} 1</h3>
                {settings
                  .filter(s => ['homepage_feature_1_title', 'homepage_feature_1_description'].includes(s.key))
                  .map(setting => (
                    <div key={setting.key} className="mb-4">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {setting.key.includes('title') ? 
                            (tr(locale, 'featureTitle', 'admin') || 'Title') : 
                            (tr(locale, 'featureDescription', 'admin') || 'Description')}:
                        </label>
                      </div>
                      
                      {typeof setting.value === 'object' && setting.value !== null ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">EN:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_en`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_en`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">DE:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_de`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_de`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          name={setting.key}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          defaultValue={getSettingStringValue(setting.value, locale)}
                        />
                      )}
                    </div>
                  ))}
              </div>
              
              {/* Feature Box 2 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{tr(locale, 'featureBox', 'admin') || 'Feature Box'} 2</h3>
                {settings
                  .filter(s => ['homepage_feature_2_title', 'homepage_feature_2_description'].includes(s.key))
                  .map(setting => (
                    <div key={setting.key} className="mb-4">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {setting.key.includes('title') ? 
                            (tr(locale, 'featureTitle', 'admin') || 'Title') : 
                            (tr(locale, 'featureDescription', 'admin') || 'Description')}:
                        </label>
                      </div>
                      
                      {typeof setting.value === 'object' && setting.value !== null ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">EN:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_en`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_en`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">DE:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_de`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_de`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          name={setting.key}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          defaultValue={getSettingStringValue(setting.value, locale)}
                        />
                      )}
                    </div>
                  ))}
              </div>
              
              {/* Feature Box 3 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{tr(locale, 'featureBox', 'admin') || 'Feature Box'} 3</h3>
                {settings
                  .filter(s => ['homepage_feature_3_title', 'homepage_feature_3_description'].includes(s.key))
                  .map(setting => (
                    <div key={setting.key} className="mb-4">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {setting.key.includes('title') ? 
                            (tr(locale, 'featureTitle', 'admin') || 'Title') : 
                            (tr(locale, 'featureDescription', 'admin') || 'Description')}:
                        </label>
                      </div>
                      
                      {typeof setting.value === 'object' && setting.value !== null ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">EN:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_en`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_en`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.en || ''}
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">DE:</span>
                              {setting.type === 'text' ? (
                                <textarea
                                  name={`${setting.key}_de`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                ></textarea>
                              ) : (
                                <input
                                  type="text"
                                  name={`${setting.key}_de`}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  defaultValue={setting.value.de || ''}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          name={setting.key}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          defaultValue={getSettingStringValue(setting.value, locale)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">{tr(locale, 'buttonsSection', 'admin') || 'Buttons'}</h2>
              {settings
                .filter(s => ['primary_cta_text'].includes(s.key))
                .map(setting => (
                  <div key={setting.key} className="mb-4">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tr(locale, 'primaryButtonText', 'admin') || 'Primary Button Text'}:
                      </label>
                    </div>
                    
                    {typeof setting.value === 'object' && setting.value !== null ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center">
                            <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">EN:</span>
                            <input
                              type="text"
                              name={`${setting.key}_en`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.en || ''}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">DE:</span>
                            <input
                              type="text"
                              name={`${setting.key}_de`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              defaultValue={setting.value.de || ''}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={setting.key}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={getSettingStringValue(setting.value, locale)}
                      />
                    )}
                  </div>
                ))}
            </div>

          {/* Legal & Contact Pages Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">{tr(locale, 'legalSection', 'admin') || 'Legal & Contact Pages'}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {tr(locale, 'legalDescription', 'admin') || 'Edit content for legal and contact pages. You can use Markdown syntax for formatting.'}
            </p>
            
            {/* Privacy Policy */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">{tr(locale, 'privacyPolicy', 'admin') || 'Privacy Policy'}</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'English Version' : 'Englische Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_privacy_en"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_privacy')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.en || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'German Version' : 'Deutsche Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_privacy_de"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_privacy')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.de || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Terms of Service */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">{tr(locale, 'termsOfService', 'admin') || 'Terms of Service'}</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'English Version' : 'Englische Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_terms_en"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_terms')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.en || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'German Version' : 'Deutsche Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_terms_de"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_terms')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.de || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">{tr(locale, 'contactInformation', 'admin') || 'Contact Information'}</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'English Version' : 'Englische Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_contact_en"
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_contact')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.en || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
                <div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'German Version' : 'Deutsche Version'}:
                    </label>
                  </div>
                  <textarea
                    name="page_contact_de"
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={
                      (() => {
                        const value = settings.find(s => s.key === 'page_contact')?.value;
                        if (typeof value === 'object' && value !== null) {
                          return value.de || '';
                        }
                        return '';
                      })()
                    }
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          {/* Branding & Images Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">{tr(locale, 'brandingSection', 'admin') || 'Branding & Images'}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {tr(locale, 'brandingDescription', 'admin') || 'Upload images for site branding and page backgrounds.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Logo Image */}                <BrandingImageUploader
                settingKey="branding_logo"
                currentImageUrl={getSettingStringValue(settings.find(s => s.key === 'branding_logo')?.value, locale)}
                title={tr(locale, 'logoTitle', 'admin') || 'Site Logo'}
                description={tr(locale, 'logoDescription', 'admin') || 'Upload a logo image for your site (recommended size: 200x60px)'}
                locale={locale as 'en' | 'de'}
                onComplete={fetchSettings}
              />
              
              {/* Banner Image */}                <BrandingImageUploader
                settingKey="branding_banner"
                currentImageUrl={getSettingStringValue(settings.find(s => s.key === 'branding_banner')?.value, locale)}
                title={tr(locale, 'bannerTitle', 'admin') || 'Header Banner'}
                description={tr(locale, 'bannerDescription', 'admin') || 'Upload a banner image for the site header (recommended size: 1200x200px)'}
                locale={locale as 'en' | 'de'}
                onComplete={fetchSettings}
              />
              
              {/* Homepage Background */}
              <BrandingImageUploader
                settingKey="homepage_background"
                currentImageUrl={getSettingStringValue(settings.find(s => s.key === 'homepage_background')?.value, locale)}
                title={tr(locale, 'homepageBackgroundTitle', 'admin') || 'Homepage Background'}
                description={tr(locale, 'homepageBackgroundDescription', 'admin') || 'Background image for the homepage (recommended size: 1920x1080px)'}
                locale={locale as 'en' | 'de'}
                onComplete={fetchSettings}
              />
              
              {/* Forum Background */}
              <BrandingImageUploader
                settingKey="forum_background"
                currentImageUrl={getSettingStringValue(settings.find(s => s.key === 'forum_background')?.value, locale)}
                title={tr(locale, 'forumBackgroundTitle', 'admin') || 'Forum Background'}
                description={tr(locale, 'forumBackgroundDescription', 'admin') || 'Background image for forum pages (recommended size: 1920x1080px)'}
                locale={locale as 'en' | 'de'}
                onComplete={fetchSettings}
              />
            </div>
          </div>
          
          {settings.filter(s => s.type === 'image').map(setting => (
  <input
    key={setting.key}
    type="hidden"
    name={setting.key}
    value={getSettingStringValue(setting.value, locale)}
  />
))}
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {tc(locale, 'saving')}
                </>
              ) : tc(locale, 'saveChanges')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
