'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { pinThread, lockThread, deleteThread } from '@/actions/adminActions';
import { Locale } from '@/i18n/settings';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type ModActionsProps = {
  threadId: string;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
  locale: Locale;
};

export default function ModActions({ threadId, categoryId, isPinned, isLocked, locale }: ModActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const t = translations[locale];
  
  // Check if user is a moderator or admin
  const isModerator = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  
  if (!isModerator) {
    return null;
  }
  
  const handlePinToggle = async () => {
    setIsLoading('pin');
    setError(null);
    setSuccess(null);
    
    try {
      const result = await pinThread(threadId, !isPinned);
      
      if (result.success) {
        setSuccess(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(locale === 'en' 
        ? 'Failed to update pin status' 
        : 'Fehler beim Aktualisieren des Pin-Status');
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleLockToggle = async () => {
    setIsLoading('lock');
    setError(null);
    setSuccess(null);
    
    try {
      const result = await lockThread(threadId, !isLocked);
      
      if (result.success) {
        setSuccess(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(locale === 'en' 
        ? 'Failed to update lock status' 
        : 'Fehler beim Aktualisieren des Sperrstatus');
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleDeleteThread = async () => {
    // Confirm before deleting
    if (!window.confirm(t.forum.confirm_delete_thread)) {
      return;
    }
    
    setIsLoading('delete');
    setError(null);
    setSuccess(null);
    
    try {
      const result = await deleteThread(threadId);
      
      if (result.success) {
        setSuccess(result.message);
        // Redirect back to category page after deletion
        setTimeout(() => {
          router.push(`/${locale}/forum/${categoryId}`);
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(locale === 'en' 
        ? 'Failed to delete thread' 
        : 'Fehler beim Löschen des Themas');
    } finally {
      setIsLoading(null);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {t.forum.moderation}
          </h3>
          
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePinToggle}
            disabled={isLoading !== null}
            className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
              isLoading === 'pin' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading === 'pin' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.common.loading}
              </>
            ) : (
              <>{isPinned ? t.forum.unpin_thread : t.forum.pin_thread}</>
            )}
          </button>
          
          <button
            onClick={handleLockToggle}
            disabled={isLoading !== null}
            className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
              isLoading === 'lock' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading === 'lock' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.common.loading}
              </>
            ) : (
              <>{isLocked ? t.forum.unlock_thread : t.forum.lock_thread}</>
            )}
          </button>
          
          <button
            onClick={handleDeleteThread}
            disabled={isLoading !== null}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${
              isLoading === 'delete' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading === 'delete' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.common.loading}
              </>
            ) : (
              t.forum.delete_thread
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
