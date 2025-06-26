'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createReply } from '@/actions/threadActions';
import { Locale } from '@/i18n/settings';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type ReplyFormProps = {
  threadId: string;
  categoryId: string;
  locale: Locale;
};

export default function ReplyForm({ threadId, categoryId, locale }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const t = translations[locale as keyof typeof translations];
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (status !== 'authenticated') {
      router.push(`/${locale}/auth/signin`);
      return;
    }
    
    if (!content.trim()) {
      setError(locale === 'en' ? 'Reply cannot be empty' : 'Antwort darf nicht leer sein');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createReply(threadId, content);
      
      if (result.success) {
        setContent('');
        // Force a refresh to show the new reply
        router.refresh();
      } else {
        setError(result.message || (locale === 'en' ? 'Failed to post reply' : 'Fehler beim Senden der Antwort'));
      }
    } catch (e) {
      setError(locale === 'en' ? 'An error occurred while posting your reply' : 'Beim Senden Ihrer Antwort ist ein Fehler aufgetreten');
      console.error('Reply submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-4">
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-blue-700 dark:text-blue-400">
          {locale === 'en' 
            ? 'You need to be signed in to reply to this thread.' 
            : 'Sie müssen angemeldet sein, um auf dieses Thema zu antworten.'
          }
        </p>
        <button
          onClick={() => router.push(`/${locale}/auth/signin`)}
          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {t.auth.signin}
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
          placeholder={locale === 'en' ? 'Write your reply here...' : 'Schreiben Sie Ihre Antwort hier...'}
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            (isSubmitting || !content.trim()) ? 'opacity-50 cursor-not-allowed' : ''
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
            t.forum.reply
          )}
        </button>
      </div>
    </form>
  );
}
