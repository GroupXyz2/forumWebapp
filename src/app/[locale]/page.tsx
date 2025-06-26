import { Locale, locales } from "@/i18n/settings";
import Link from "next/link";
import Image from "next/image";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";
import { getSettings, initializeSettings } from "@/actions/settingsActions";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type HomePageProps = {
  params: { locale: Locale };
};

export default async function HomePage({ 
  params 
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await the entire params object first
  const resolvedParams = await params;
  const localeValue = resolvedParams.locale;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  // Initialize settings if needed and get homepage settings
  await initializeSettings();
  const settings = await getSettings('homepage');
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Helper to get localized setting value
  const getSetting = (key: string, defaultValue: string = '') => {
    const setting = settings[key];
    if (!setting) return defaultValue;
    
    if (typeof setting.value === 'object' && setting.value !== null) {
      return setting.value[localeValue] || setting.value.en || defaultValue;
    }
    
    return setting.value || defaultValue;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-8">
          <Image
            src="/globe.svg"
            alt="Forum Logo"
            fill
            className="dark:invert"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
          <span className="block">{t.app_name}</span>
          <span className="block text-blue-600 dark:text-blue-400">
            {getSetting('homepage_title', localeValue === 'en' ? 'Modern Discussion Platform' : 'Moderne Diskussionsplattform')}
          </span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          {getSetting('homepage_slogan', localeValue === 'en'
            ? 'Join our community to discuss your favorite topics in a modern, user-friendly environment.'
            : 'Tritt unserer Community bei, um deine Lieblingsthemen in einer modernen, benutzerfreundlichen Umgebung zu diskutieren.')}
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              href={`/${localeValue}/forum`}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              {getSetting('primary_cta_text', localeValue === 'en' ? 'Browse Forums' : 'Foren durchsuchen')}
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link
              href={`/${localeValue}/auth/signin`}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 dark:text-blue-400 dark:bg-gray-900 dark:hover:bg-gray-800 md:py-4 md:text-lg md:px-10"
            >
              {t.auth.signin}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 w-full max-w-5xl">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          {localeValue === 'en' ? 'Features' : 'Funktionen'}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {localeValue === 'en' ? 'Dark & Light Mode' : 'Dunkel- & Hellmodus'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {localeValue === 'en'
                ? 'Switch between dark and light theme to suit your preferences.'
                : 'Wechsle zwischen dunklem und hellem Design nach deinen Vorlieben.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {localeValue === 'en' ? 'Multilingual Support' : 'Mehrsprachige Unterstützung'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {localeValue === 'en'
                ? 'Full support for English and German languages.'
                : 'Vollständige Unterstützung für englische und deutsche Sprache.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {localeValue === 'en' ? 'Discord Authentication' : 'Discord-Authentifizierung'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {localeValue === 'en'
                ? 'Securely sign in with your Discord account.'
                : 'Melde dich sicher mit deinem Discord-Konto an.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
