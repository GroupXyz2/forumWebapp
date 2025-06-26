'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { createThread } from '@/actions/threadActions';
import { Locale, locales } from '@/i18n/settings';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export default function CreateThreadPage({ 
  params 
}: {
  params: { locale: string, categoryId: string };
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const localeValue = params.locale;
  const categoryId = params.categoryId;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Redirect to sign in if not authenticated
  if (status === 'unauthenticated') {
    router.push(`/${localeValue}/auth/signin`);
    return null;
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      setError(localeValue === 'en' 
        ? 'Title and content are required' 
        : 'Titel und Inhalt sind erforderlich');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createThread(categoryId, title, content);
      
      if (result.success && result.threadId) {
        // Immediately redirect to prevent potential double submissions
        // Use replace instead of push to prevent back button from returning to the form
        router.replace(`/${localeValue}/forum/${categoryId}/thread/${result.threadId}`);
        return; // Early return to prevent state updates after navigation
      } else {
        setError(result.message || (localeValue === 'en' 
          ? 'Failed to create thread' 
          : 'Fehler beim Erstellen des Themas'));
      }
    } catch (e) {
      setError(localeValue === 'en' 
        ? 'An error occurred while creating your thread' 
        : 'Beim Erstellen Ihres Themas ist ein Fehler aufgetreten');
      console.error('Thread creation error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/${localeValue}/forum/${categoryId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {localeValue === 'en' ? 'Back to Category' : 'Zurück zur Kategorie'}
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          {t.forum.create_thread}
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {localeValue === 'en' ? 'Thread Title' : 'Titel des Themas'}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
              placeholder={localeValue === 'en' ? 'Enter a descriptive title' : 'Geben Sie einen aussagekräftigen Titel ein'}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {localeValue === 'en' ? 'Thread Content' : 'Inhalt des Themas'}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
              placeholder={localeValue === 'en' ? 'Write your thread content here...' : 'Schreiben Sie den Inhalt Ihres Themas hier...'}
              disabled={isSubmitting}
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href={`/${localeValue}/forum/${categoryId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (isSubmitting || !title.trim() || !content.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.common.loading}
                </>
              ) : (
                t.common.submit
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
