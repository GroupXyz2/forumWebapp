import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Locale, locales } from '@/i18n/settings';
import { getCategoryThreads } from '@/actions/forumActions';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export default async function CategoryPage({ 
  params 
}: {
  params: Promise<{ locale: string, categoryId: string }>;
}) {
  // Await the entire params object first
  const resolvedParams = await params;
  const localeValue = resolvedParams.locale;
  const categoryId = resolvedParams.categoryId;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Get page from search params (default to 1)
  const page = 1;
  const limit = 10;
  
  // Get threads for this category
  const { threads, category, pagination } = await getCategoryThreads(categoryId, page, limit);
  
  // If category doesn't exist, return 404
  if (!category) {
    return notFound();
  }
  
  // Format date based on locale
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(localeValue, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link
            href={`/${localeValue}/forum`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.forum.categories}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {category.name[localeValue as keyof typeof category.name]}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {category.description[localeValue as keyof typeof category.description]}
          </p>
        </div>
        <Link
          href={`/${localeValue}/forum/${categoryId}/create-thread`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t.forum.create_thread}
        </Link>
      </div>

      {threads.length === 0 && (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            {localeValue === 'en' ? 'No threads have been created in this category yet.' : 'In dieser Kategorie wurden noch keine Themen erstellt.'}
          </p>
        </div>
      )}

      {threads.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {threads.map((thread) => (
              <div key={thread.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center gap-2">
                      {thread.isPinned && (
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs px-2 py-1 rounded">
                          {t.forum.pinned}
                        </span>
                      )}
                      {thread.isLocked && (
                        <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-1 rounded">
                          {t.forum.locked}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/${localeValue}/forum/${categoryId}/thread/${thread.id}`}
                      className="text-xl font-medium text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      {thread.title}
                    </Link>
                    <div className="mt-1 flex items-center">
                      <div className="flex-shrink-0 mr-2">
                        {thread.author.image ? (
                          <Image
                            src={thread.author.image}
                            alt={thread.author.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {thread.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t.forum.by_user.replace('{{username}}', thread.author.name)} • {formatDate(thread.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {thread.views}
                      </span>{" "}
                      <span className="inline-flex items-center gap-1 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {thread.postCount}
                      </span>
                    </div>
                    
                    {thread.latestPost && (
                      <Link
                        href={`/${localeValue}/forum/${categoryId}/thread/${thread.id}?latest=true`}
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium"
                      >
                        {localeValue === 'en' ? 'Latest Reply' : 'Neuste Antwort'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/${localeValue}/forum/${categoryId}?page=${pageNum}`}
                  className={`${
                    pageNum === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
