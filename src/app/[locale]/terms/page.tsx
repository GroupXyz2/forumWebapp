'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

// Helper function for translation
const tr = (locale: string, key: string, section = 'common') => {
  const localeStr = locale === 'de' ? 'de' : 'en';
  const translations = localeStr === 'de' ? deTranslations : enTranslations;
  const sectionObj = (translations as any)[section];
  
  if (!sectionObj) return key;
  
  const value = sectionObj[key];
  
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) return key;
  return typeof value === 'undefined' ? key : String(value);
};

// Helper for getting a string value from a potentially multi-lingual setting
const getStringValue = (value: any, locale: string) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value[locale] || value.en || '';
  }
  return '';
};

interface TermsPageProps {
  params: {
    locale: string;
  };
}

export default function TermsPage({ params }: TermsPageProps) {
  const { locale } = params;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/${locale}/api/admin/settings?key=page_terms`);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.settings && data.settings.length > 0) {
            setContent(getStringValue(data.settings[0].value, locale));
          } else {
            setContent(tr(locale, 'termsPlaceholder', 'common'));
          }
        } else {
          setContent(tr(locale, 'termsPlaceholder', 'common'));
        }
      } catch (err) {
        console.error('Error fetching terms content:', err);
        setContent(tr(locale, 'termsPlaceholder', 'common'));
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [locale]);

  return (
    <main className="flex flex-col items-center justify-between py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{tr(locale, 'terms', 'common')}</h1>
          <Link href={`/${locale}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            &larr; {tr(locale, 'backToHome', 'common')}
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-5/6"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-4/5"></div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}
      </div>
    </main>
  );
}
