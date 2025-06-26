'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Locale } from '@/i18n/settings';
import Link from 'next/link';
import Image from 'next/image';
import { getAllUsers } from '@/actions/adminActions';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type AdminUsersPageProps = {
  params: { locale: Locale };
};

export default function AdminUsersPage({ params: { locale } }: AdminUsersPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = translations[locale];

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Redirect if not admin or moderator
    if (status === 'authenticated') {
      if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
        router.push(`/${locale}`);
      } else {
        loadUsers();
      }
    } else if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/users`);
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

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await getAllUsers(page, 10, filter);
      if (result.success) {
        setUsers(result.users);
        setPagination(result.pagination);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to load users' });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'An error occurred while loading users' });
    } finally {
      setLoading(false);
    }
  }

  // Format date for display
  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return locale === 'en' ? 'N/A' : 'N/A';
    
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
          {t.admin.users}
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
                <option value="all">{t.admin.all_users}</option>
                <option value="banned">{t.admin.banned_users}</option>
                <option value="muted">{t.admin.muted_users}</option>
                <option value="moderators">{t.admin.moderators}</option>
                <option value="warnings">{locale === 'en' ? 'Users With Warnings' : 'Benutzer mit Verwarnungen'}</option>
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
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {locale === 'en' ? 'No users found.' : 'Keine Benutzer gefunden.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'User' : 'Benutzer'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Role' : 'Rolle'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Status' : 'Status'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Join Date' : 'Beitrittsdatum'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {locale === 'en' ? 'Actions' : 'Aktionen'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : user.role === 'moderator'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {t.roles[user.role as keyof typeof t.roles]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.isBanned && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {locale === 'en' ? 'Banned' : 'Gesperrt'}
                            {user.bannedUntil && <span className="ml-1">({formatDate(user.bannedUntil)})</span>}
                          </span>
                        )}
                        {user.isMuted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {locale === 'en' ? 'Muted' : 'Stummgeschaltet'}
                            {user.mutedUntil && <span className="ml-1">({formatDate(user.mutedUntil)})</span>}
                          </span>
                        )}
                        {user.warningCount > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {locale === 'en' ? `${user.warningCount} Warning${user.warningCount > 1 ? 's' : ''}` : 
                            `${user.warningCount} Verwarnung${user.warningCount > 1 ? 'en' : ''}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${locale}/admin/users/${user.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        {locale === 'en' ? 'View / Edit' : 'Ansehen / Bearbeiten'}
                      </Link>
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
