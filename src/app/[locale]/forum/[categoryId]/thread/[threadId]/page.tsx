import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Locale, locales } from '@/i18n/settings';
import { getThread } from '@/actions/threadActions';
import ReplyForm from '@/components/forum/ReplyForm';
import ModActions from '@/components/forum/ModActions';
import ModPostAction from '@/components/forum/ModPostAction';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export default async function ThreadPage({ 
  params 
}: {
  params: Promise<{ locale: string, categoryId: string, threadId: string }>;
}) {
  // Await the entire params object first
  const resolvedParams = await params;
  const localeValue = resolvedParams.locale;
  const categoryId = resolvedParams.categoryId;
  const threadId = resolvedParams.threadId;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Get page from search params (default to 1)
  const page = 1;
  const limit = 20;
  
  // Get thread and posts
  const { thread, posts, pagination } = await getThread(threadId, page, limit);
  
  // If thread doesn't exist, return 404
  if (!thread) {
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
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href={`/${localeValue}/forum/${categoryId}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {thread.category.name[localeValue as keyof typeof thread.category.name]}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {thread.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {thread.isPinned && (
              <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs px-2 py-1 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {t.forum.pinned}
              </span>
            )}
            {thread.isLocked && (
              <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-1 rounded flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t.forum.locked}
              </span>
            )}
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {thread.views}
            </span>
            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {posts.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Moderation Actions - only visible to admins/mods */}
      <ModActions 
        threadId={threadId}
        categoryId={categoryId}
        isPinned={thread.isPinned} 
        isLocked={thread.isLocked}
        locale={localeValue as Locale}
      />

      {/* Thread OP and replies */}
      <div className="space-y-6">
        {/* First post (Thread OP) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" id="post-op">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Author info */}
              <div className="sm:w-48 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                <div className="flex-shrink-0">
                  {thread.author.image ? (
                    <Image
                      src={thread.author.image}
                      alt={thread.author.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                      {thread.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{thread.author.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(thread.createdAt)}</div>
                  {thread.author.role && (
                    <div className="mt-1">
                      {thread.author.role === 'admin' && (
                        <span className="inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                          {t.roles.admin}
                        </span>
                      )}
                      {thread.author.role === 'moderator' && (
                        <span className="inline-block bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                          {t.roles.moderator}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Post content */}
              <div className="flex-1 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6 py-2">
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: thread.content }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Replies */}
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" id={`post-${post.id}`}>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Author info */}
                <div className="sm:w-48 flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                  <div className="flex-shrink-0">
                    {post.author.image ? (
                      <Image
                        src={post.author.image}
                        alt={post.author.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{post.author.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                      {post.isEdited && (
                        <span className="ml-1 italic">{localeValue === 'en' ? '(edited)' : '(bearbeitet)'}</span>
                      )}
                    </div>
                    {post.author.role && (
                      <div className="mt-1">
                        {post.author.role === 'admin' && (
                          <span className="inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                            {t.roles.admin}
                          </span>
                        )}
                        {post.author.role === 'moderator' && (
                          <span className="inline-block bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                            {t.roles.moderator}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Post content */}
                <div className="flex-1 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                    <ModPostAction 
                      postId={post.id}
                      threadId={threadId}
                      categoryId={categoryId}
                      locale={localeValue as Locale}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Reply form */}
        {!thread.isLocked && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t.forum.reply}
            </h3>
            <ReplyForm 
              threadId={thread.id} 
              categoryId={categoryId}
              locale={localeValue as Locale}
            />
          </div>
        )}
        
        {thread.isLocked && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400">
            <p className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              {localeValue === 'en' ? 'This thread is locked and cannot be replied to.' : 'Dieses Thema ist gesperrt und kann nicht beantwortet werden.'}
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/${localeValue}/forum/${categoryId}/thread/${threadId}?page=${pageNum}`}
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
    </div>
  );
}
