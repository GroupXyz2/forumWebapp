export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getPreferredLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  const preferredLocales = acceptLanguage
    .split(',')
    .map((locale) => locale.split(';')[0].trim());
  
  for (const locale of preferredLocales) {
    const shortLocale = locale.split('-')[0];
    if (isValidLocale(shortLocale)) {
      return shortLocale;
    }
  }
  
  return defaultLocale;
}
