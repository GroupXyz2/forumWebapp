'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { deletePost } from '@/actions/adminActions';
import { Locale } from '@/i18n/settings';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type ModPostActionProps = {
  postId: string;
  threadId: string;
  categoryId: string;
  locale: Locale;
};

export default function ModPostAction({ postId, threadId, categoryId, locale }: ModPostActionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  const t = translations[locale];
  
  // Check if user is a moderator or admin
  const isModerator = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  
  if (!isModerator) {
    return null;
  }
  
  const handleDeletePost = async () => {
    // Confirm before deleting
    if (!window.confirm(t.forum.confirm_delete_post)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await deletePost(postId);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert(locale === 'en' 
        ? 'Failed to delete post' 
        : 'Fehler beim Löschen des Beitrags');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleDeletePost}
      disabled={isLoading}
      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 ml-4"
    >
      {isLoading ? (
        <>
          <svg className="inline-block animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t.common.loading}
        </>
      ) : (
        t.forum.delete_post
      )}
    </button>
  );
}
