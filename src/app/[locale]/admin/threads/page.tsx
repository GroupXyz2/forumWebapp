'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Locale } from '@/i18n/settings';
import Link from 'next/link';
import Image from 'next/image';
import { getAllThreads, pinThread, lockThread, deleteThread } from '@/actions/adminActions';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type AdminThreadsPageProps = {
  params: { locale: Locale };
};

export default function AdminThreadsPage({ params: { locale } }: AdminThreadsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = translations[locale];

  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Redirect if not admin or moderator
    if (status === 'authenticated') {
      if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
        router.push(`/${locale}`);
      } else {
        loadThreads();
      }
    } else if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/threads`);
    }
  }, [session, status, router, locale, filter, page]);

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // If not admin or moderator, don't render the page
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'moderator') {
    return null;
  }

  async function loadThreads() {
    setLoading(true);
    try {
      const result = await getAllThreads(page, 10, filter);
      if (result.success) {
        setThreads(result.threads);
        setPagination(result.pagination);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to load threads' });
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setMessage({ type: 'error', text: 'An error occurred while loading threads' });
    } finally {
      setLoading(false);
    }
  }

  // Handler for pinning/unpinning threads
  async function handlePinToggle(threadId: string, currentStatus: boolean) {
    if (actionInProgress) return;
    setActionInProgress(threadId);

    try {
      const result = await pinThread(threadId, !currentStatus);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Update the thread in the local state
        setThreads(threads.map(thread => 
          thread.id === threadId ? { ...thread, isPinned: !currentStatus } : thread
        ));
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      setMessage({ type: 'error', text: 'Failed to update thread pin status' });
    } finally {
      setActionInProgress(null);
    }
  }

  // Handler for locking/unlocking threads
  async function handleLockToggle(threadId: string, currentStatus: boolean) {
    if (actionInProgress) return;
    setActionInProgress(threadId);

    try {
      const result = await lockThread(threadId, !currentStatus);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Update the thread in the local state
        setThreads(threads.map(thread => 
          thread.id === threadId ? { ...thread, isLocked: !currentStatus } : thread
        ));
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error toggling lock status:', error);
      setMessage({ type: 'error', text: 'Failed to update thread lock status' });
    } finally {
      setActionInProgress(null);
    }
  }

  // Handler for deleting threads
  async function handleDeleteThread(threadId: string) {
    if (actionInProgress) return;
    
    if (!confirm(locale === 'en' 
      ? 'Are you sure you want to delete this thread? This will remove all posts within the thread and cannot be undone.'
      : 'Sind Sie sicher, dass Sie diesen Thread löschen möchten? Dies entfernt alle Beiträge im Thread und kann nicht rückgängig gemacht werden.'
    )) {
      return;
    }

    setActionInProgress(threadId);

    try {
      const result = await deleteThread(threadId);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Remove the thread from the local state
        setThreads(threads.filter(thread => thread.id !== threadId));
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      setMessage({ type: 'error', text: 'Failed to delete thread' });
    } finally {
      setActionInProgress(null);
    }
  }

  // Format date for display
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.admin.threads}
        </h1>
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {t.common.back}
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="ml-2 text-sm font-medium"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="block w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="all">{locale === 'en' ? 'All Threads' : 'Alle Threads'}</option>
                <option value="pinned">{locale === 'en' ? 'Pinned Threads' : 'Angepinnte Threads'}</option>
                <option value="locked">{locale === 'en' ? 'Locked Threads' : 'Gesperrte Threads'}</option>
              </select>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className={`px-3 py-1 border rounded-md ${
                  page === 1
                    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {locale === 'en' ? 'Previous' : 'Zurück'}
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                {locale === 'en' 
                  ? `Page ${page} of ${pagination.totalPages || 1}` 
                  : `Seite ${page} von ${pagination.totalPages || 1}`}
              </span>
              <button
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage(Math.min(pagination.totalPages || 1, page + 1))}
                className={`px-3 py-1 border rounded-md ${
                  page >= (pagination.totalPages || 1)
                    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {locale === 'en' ? 'Next' : 'Weiter'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {locale === 'en' ? 'No threads found.' : 'Keine Threads gefunden.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Thread' : 'Thread'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Author' : 'Autor'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Category' : 'Kategorie'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Status' : 'Status'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Created' : 'Erstellt'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Actions' : 'Aktionen'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {threads.map((thread) => (
                  <tr key={thread.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Link 
                          href={`/${locale}/forum/${thread.category.slug}/thread/${thread.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {thread.title}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {thread.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {thread.author.image ? (
                          <Image
                            src={thread.author.image}
                            alt={thread.author.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {thread.author.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {thread.author.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {thread.category.name[locale] || thread.category.name.en || thread.category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {thread.isPinned && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
                            {locale === 'en' ? 'Pinned' : 'Angepinnt'}
                          </span>
                        )}
                        {thread.isLocked && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                            {locale === 'en' ? 'Locked' : 'Gesperrt'}
                          </span>
                        )}
                        {!thread.isPinned && !thread.isLocked && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                            {locale === 'en' ? 'Active' : 'Aktiv'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(thread.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePinToggle(thread.id, thread.isPinned)}
                          disabled={actionInProgress === thread.id}
                          className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                            actionInProgress === thread.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {thread.isPinned 
                            ? (locale === 'en' ? 'Unpin' : 'Lösen') 
                            : (locale === 'en' ? 'Pin' : 'Anpinnen')}
                        </button>
                        <button
                          onClick={() => handleLockToggle(thread.id, thread.isLocked)}
                          disabled={actionInProgress === thread.id}
                          className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                            actionInProgress === thread.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {thread.isLocked 
                            ? (locale === 'en' ? 'Unlock' : 'Entsperren') 
                            : (locale === 'en' ? 'Lock' : 'Sperren')}
                        </button>
                        <button
                          onClick={() => handleDeleteThread(thread.id)}
                          disabled={actionInProgress === thread.id}
                          className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-700/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                            actionInProgress === thread.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {locale === 'en' ? 'Delete' : 'Löschen'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
