'use client';

import { Locale } from "@/i18n/settings";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type AdminPageProps = {
  params: { locale: Locale };
};

export default function AdminPage({ params: { locale } }: AdminPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = translations[locale];

  useEffect(() => {
    // Redirect if not admin or moderator
    if (status === "authenticated") {
      if (session.user.role !== "admin" && session.user.role !== "moderator") {
        router.push(`/${locale}`);
      }
    } else if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin`);
    }
  }, [session, status, router, locale]);

  // Show loading state while checking authentication
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // If not admin or moderator, don't render the page
  if (session?.user?.role !== "admin" && session?.user?.role !== "moderator") {
    return null;
  }

  const adminMenu = [
    { 
      name: t.admin.dashboard, 
      href: `/${locale}/admin`, 
      description: locale === 'en' ? 'Overview of forum statistics and activity' : 'Überblick über Forumstatistiken und -aktivitäten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: t.admin.users, 
      href: `/${locale}/admin/users`,
      description: locale === 'en' ? 'Manage users and their permissions' : 'Benutzer und ihre Berechtigungen verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: t.admin.categories, 
      href: `/${locale}/admin/categories`,
      description: locale === 'en' ? 'Create and manage forum categories' : 'Forum-Kategorien erstellen und verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ) 
    },
    { 
      name: t.admin.threads, 
      href: `/${locale}/admin/threads`,
      description: locale === 'en' ? 'Moderate and manage forum threads' : 'Forumthreads moderieren und verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) 
    },
    { 
      name: t.admin.auditLog, 
      href: `/${locale}/admin/audit-log`,
      description: locale === 'en' ? 'View audit logs of all moderation actions' : 'Prüfprotokolle aller Moderationsaktionen anzeigen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ) 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.admin.dashboard}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {locale === 'en' 
            ? `Welcome back, ${session.user.name}. You have administrative privileges.` 
            : `Willkommen zurück, ${session.user.name}. Du hast administrative Rechte.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminMenu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              {item.icon}
            </div>
            <div className="ml-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {locale === 'en' ? 'Quick Stats' : 'Schnelle Statistiken'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {locale === 'en' ? 'Total Users' : 'Benutzer Insgesamt'}
            </p>
            <p className="font-semibold text-2xl text-gray-900 dark:text-white">
              127
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {locale === 'en' ? 'Total Threads' : 'Threads Insgesamt'}
            </p>
            <p className="font-semibold text-2xl text-gray-900 dark:text-white">
              102
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {locale === 'en' ? 'Total Posts' : 'Posts Insgesamt'}
            </p>
            <p className="font-semibold text-2xl text-gray-900 dark:text-white">
              655
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {locale === 'en' ? 'Recent Activity' : 'Neueste Aktivitäten'}
        </h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></span>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {locale === 'en' ? 'New user registered' : 'Neuer Benutzer registriert'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'en' ? '5 minutes ago' : 'vor 5 Minuten'}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></span>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {locale === 'en' ? 'New thread created in Technology' : 'Neues Thema in Technologie erstellt'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'en' ? '15 minutes ago' : 'vor 15 Minuten'}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-500"></span>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {locale === 'en' ? 'User reported a post' : 'Benutzer hat einen Beitrag gemeldet'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'en' ? '30 minutes ago' : 'vor 30 Minuten'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
