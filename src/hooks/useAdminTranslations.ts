"use client";

import { useLocaleTranslation } from '@/i18n/getLocaleTranslation';

// Custom hook for admin translations
export function useAdminTranslations(locale: string) {
  const translate = useLocaleTranslation(locale, 'admin');
  return translate;
}
