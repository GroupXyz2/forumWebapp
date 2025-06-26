import { Locale, locales } from "@/i18n/settings";
import Link from "next/link";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type ErrorPageProps = {
  params: { locale: Locale };
  searchParams: { error?: string };
};

export default async function ErrorPage({ 
  params, 
  searchParams 
}: {
  params: Promise<{ locale: string }>;
  searchParams: { error?: string };
}) {
  // Await the entire params object first
  const resolvedParams = await params;
  const localeValue = resolvedParams.locale;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  const error = searchParams.error || "default";
  
  // Map error codes to messages
  const errorMessages = {
    default: {
      en: "An unknown error occurred during sign in.",
      de: "Bei der Anmeldung ist ein unbekannter Fehler aufgetreten."
    },
    Configuration: {
      en: "There is a problem with the server configuration.",
      de: "Es gibt ein Problem mit der Serverkonfiguration."
    },
    AccessDenied: {
      en: "Access denied. You might not have permission to sign in.",
      de: "Zugriff verweigert. Du hast möglicherweise keine Berechtigung zur Anmeldung."
    },
    Verification: {
      en: "The sign in link is no longer valid.",
      de: "Der Anmeldelink ist nicht mehr gültig."
    }
  };
  
  const errorMessage = errorMessages[error as keyof typeof errorMessages]?.[localeValue as keyof typeof errorMessages[keyof typeof errorMessages]] || 
    errorMessages.default[localeValue as keyof typeof errorMessages.default];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-6">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {localeValue === 'en' ? 'Authentication Error' : 'Authentifizierungsfehler'}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {errorMessage}
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center">
          <Link 
            href={`/${localeValue}/auth/signin`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t.auth.signin}
          </Link>
          <Link 
            href={`/${localeValue}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {localeValue === 'en' ? 'Back to Home' : 'Zurück zur Startseite'}
          </Link>
        </div>
      </div>
    </div>
  );
}
