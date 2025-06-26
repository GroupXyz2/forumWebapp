import { Locale, locales } from "@/i18n/settings";
import Link from "next/link";
import { getCategories, createInitialCategories } from "@/actions/forumActions";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type ForumPageProps = {
  params: { locale: Locale };
};

export default async function ForumPage({ 
  params 
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await the entire params object first
  const resolvedParams = await params;
  const localeValue = resolvedParams.locale;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Ensure we have initial categories and then fetch them
  await createInitialCategories();
  const { categories: forumCategories } = await getCategories();
  
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.forum.categories}
        </h1>
      </div>

      {forumCategories.length === 0 && (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            {localeValue === 'en' ? 'No categories have been created yet.' : 'Es wurden noch keine Kategorien erstellt.'}
          </p>
        </div>
      )}

      {forumCategories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {forumCategories.map((category) => (
            <div key={category.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <Link
                    href={`/${localeValue}/forum/${category.slug}`}
                    className="text-xl font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {category.name[localeValue as keyof typeof category.name]}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {category.description[localeValue as keyof typeof category.description]}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{category.threadCount}</span> {t.forum.threads},{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{category.postCount}</span> {t.forum.posts}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    {category.latestPost ? (
                      <>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          <Link 
                            href={`/${localeValue}/forum/${category.slug}/thread/${category.latestPost.threadId}`}
                            className="hover:underline"
                          >
                            {category.latestPost.title[localeValue as keyof typeof category.latestPost.title]}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t.forum.by_user.replace('{{username}}', category.latestPost.author)} • {formatDate(category.latestPost.date)}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {localeValue === 'en' ? 'No threads yet' : 'Noch keine Threads'}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/${localeValue}/forum/${category.slug}`}
                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium"
                  >
                    {localeValue === 'en' ? 'View' : 'Ansehen'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
