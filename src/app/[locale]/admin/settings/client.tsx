'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

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
      const response = await fetch(`/${locale}/api/admin/settings?scope=homepage`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.settings)) {
        setSettings(data.settings);
      } else {
        setSettings([]);
        console.warn('Received invalid settings data:', data);
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
      
      const response = await fetch(`/${locale}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: updates }),
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
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{tr(locale, 'homepageSettings', 'admin') || 'Homepage Settings'}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {tr(locale, 'homepageSettingsDescription', 'admin') || 'Customize the main page of your forum'}
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
                        defaultValue={setting.value as string || ''}
                      ></textarea>
                    ) : (
                      <input
                        type="text"
                        name={setting.key}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue={setting.value as string || ''}
                      />
                    )
                  )}
                </div>
              ))}
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
                          defaultValue={setting.value as string || ''}
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
                          defaultValue={setting.value as string || ''}
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
                          defaultValue={setting.value as string || ''}
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
                        defaultValue={setting.value as string || ''}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
          
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
