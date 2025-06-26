'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createReply } from '@/actions/threadActions';
import { Locale } from '@/i18n/settings';
import { AlertTriangle, ImageIcon } from 'lucide-react';
import { countImagesInContent } from '@/lib/contentUtils';
import ImageUploader from '@/components/forum/ImageUploader';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

// Helper function to format date
function formatDate(date: string | Date | null | undefined) {
  if (!date) return null;
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("default", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

type ReplyFormProps = {
  threadId: string;
  categoryId: string;
  locale: Locale;
};

export default function ReplyForm({ threadId, categoryId, locale }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [imageWarning, setImageWarning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const t = translations[locale as keyof typeof translations];
  
  // Count images whenever content changes
  useEffect(() => {
    const count = countImagesInContent(content);
    setImageCount(count);
    setImageWarning(count > 1);
  }, [content]);
  
  // Check if user is banned or muted
  const isBanned = session?.user?.isBanned;
  const isMuted = session?.user?.isMuted;
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (status !== 'authenticated') {
      router.push(`/${locale}/auth/signin`);
      return;
    }
    
    // Check for bans/mutes client-side to avoid unnecessary requests
    if (isBanned) {
      setError(session.user.banReason || t.admin.userIsBanned);
      return;
    }
    
    if (isMuted) {
      const mutedUntil = session.user.mutedUntil 
        ? t.admin.mutedUntil + ": " + formatDate(session.user.mutedUntil)
        : t.admin.userIsMuted;
        
      setError(mutedUntil);
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
  
  // Show ban notification
  if (isBanned) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 dark:text-red-400 font-medium">
            {t.admin.banned}
          </p>
          <p className="text-red-600 dark:text-red-500 text-sm mt-1">
            {session?.user.banReason || t.admin.userIsBanned}
          </p>
          {session?.user.bannedUntil ? (
            <p className="text-red-600/80 dark:text-red-500/80 text-sm mt-1">
              {t.admin.bannedUntil}: {formatDate(session.user.bannedUntil)}
            </p>
          ) : (
            <p className="text-red-600/80 dark:text-red-500/80 text-sm mt-1">
              {t.admin.bannedPermanently}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Show mute notification
  if (isMuted) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-700 dark:text-yellow-400 font-medium">
            {t.admin.muted}
          </p>
          <p className="text-yellow-600 dark:text-yellow-500 text-sm mt-1">
            {t.admin.userIsMuted}
          </p>
          {session?.user.mutedUntil && (
            <p className="text-yellow-600/80 dark:text-yellow-500/80 text-sm mt-1">
              {t.admin.mutedUntil}: {formatDate(session.user.mutedUntil)}
            </p>
          )}
        </div>
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
      
      {imageWarning && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded flex items-start gap-2">
          <ImageIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-yellow-700 dark:text-yellow-400">
            <p className="font-medium">
              {t.forum.image_limit.title}
            </p>
            <p className="text-sm">
              {t.forum.image_limit.message}
            </p>
            <p className="text-xs mt-1">
              {t.forum.image_limit.count.replace('{{count}}', imageCount.toString())}
            </p>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="content" className="sr-only">
          {t.forum.reply}
        </label>
        <textarea
          id="content"
          name="content"
          rows={4}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-4 py-3 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={locale === 'en' ? 'Type your reply here...' : 'Geben Sie hier Ihre Antwort ein...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        
        {/* Image uploader */}
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.forum.image_upload.title}
          </p>
          
          {uploadError && (
            <div className="p-3 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {uploadError}
            </div>
          )}
          
          <ImageUploader 
            locale={locale}
            onImageUploaded={(imageUrl) => {
              if (imageUrl) {
                // Insert the image at the end of the content
                setContent(prev => {
                  const newContent = prev.trim() ? 
                    `${prev}\n\n![${t.forum.image_upload.insert_text}](${imageUrl})` : 
                    `![${t.forum.image_upload.insert_text}](${imageUrl})`;
                  return newContent;
                });
              }
            }}
            onError={(errorMessage) => {
              setUploadError(errorMessage);
              // Clear error after 5 seconds
              setTimeout(() => setUploadError(null), 5000);
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || imageWarning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {locale === 'en' ? 'Submitting...' : 'Wird gesendet...'}
            </>
          ) : (
            t.forum.reply
          )}
        </button>
      </div>
    </form>
  );
}
