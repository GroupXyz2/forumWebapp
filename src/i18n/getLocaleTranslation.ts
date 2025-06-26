import { defaultLocale, isValidLocale } from './settings';

// Simple utility to get nested values using dot notation
// e.g. getNestedValue(obj, 'admin.users.title')
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  return keys.reduce((acc: any, key) => {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);
}

// Get translations function
export async function getLocaleTranslation(locale: string) {
  // Validate and normalize locale
  const validLocale = isValidLocale(locale) ? locale : defaultLocale;
  
  try {
    // Dynamically import the locale file
    const localeModule = await import(`./locales/${validLocale}.json`);
    
    // Return a function that gets translations by key
    return function translate(key: string, placeholders?: Record<string, string>) {
      let value = getNestedValue(localeModule, key);
      
      // If value is not found, try from default locale
      if (value === undefined && validLocale !== defaultLocale) {
        const defaultLocaleModule = require(`./locales/${defaultLocale}.json`);
        value = getNestedValue(defaultLocaleModule, key);
      }
      
      // Return the key if translation is not found
      if (value === undefined) {
        return key;
      }
      
      // Replace placeholders if any
      if (placeholders) {
        return Object.entries(placeholders).reduce((str, [key, val]) => {
          return str.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }, value);
      }
      
      return value;
    };
  } catch (error) {
    console.error(`Failed to load locale: ${validLocale}`, error);
    
    // Return a function that returns the key as fallback
    return function translate(key: string) {
      return key;
    };
  }
}

// Client-side translation hook
export function useLocaleTranslation(locale: string, namespace: string) {
  // Convert namespace to lowercase to match our lowercase keys in locale files
  const normalizedNamespace = namespace.toLowerCase();
  
  return function translate(key: string, placeholders?: Record<string, string>) {
    try {
      // In client components, we can use require directly
      const localeModule = require(`./locales/${locale}.json`);
      
      // Get the value from the namespace
      let value = getNestedValue(localeModule, `${normalizedNamespace}.${key.toLowerCase()}`);
      
      // If value is not found and locale is not default, try from default locale
      if (value === undefined && locale !== defaultLocale) {
        const defaultLocaleModule = require(`./locales/${defaultLocale}.json`);
        value = getNestedValue(defaultLocaleModule, `${normalizedNamespace}.${key.toLowerCase()}`);
      }
      
      // Return the key if translation is not found
      if (value === undefined) {
        return key;
      }
      
      // Replace placeholders if any
      if (placeholders) {
        return Object.entries(placeholders).reduce((str, [key, val]) => {
          return str.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }, value);
      }
      
      return value;
    } catch (error) {
      console.error(`Failed to load locale: ${locale}`, error);
      return key;
    }
  };
}
