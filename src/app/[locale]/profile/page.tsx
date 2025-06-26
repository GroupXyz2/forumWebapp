'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Locale, locales } from '@/i18n/settings';

// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export default function ProfilePage({ 
  params 
}: {
  params: { locale: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const localeValue = params.locale as Locale;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  const t = translations[localeValue as keyof typeof translations];
  
  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${localeValue}/auth/signin`);
    }
  }, [status, router, localeValue]);
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  if (!session) {
    return null; // This will be handled by the useEffect redirect
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={120}
                height={120}
                className="rounded-full border-4 border-blue-100 dark:border-blue-900"
              />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl sm:text-4xl">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            <div className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 rounded-full p-1 border-2 border-white dark:border-gray-800">
              {session.user?.role === 'admin' && (
                <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {t.roles.admin}
                </span>
              )}
              {session.user?.role === 'moderator' && (
                <span className="inline-block bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  {t.roles.moderator}
                </span>
              )}
              {session.user?.role === 'user' && (
                <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {t.roles.user}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {session.user?.name}
            </h1>
            {session.user?.email && (
              <p className="text-gray-600 dark:text-gray-400">
                {session.user.email}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              {t.profile.member_since}: {new Date(session.user?.id ? parseInt(session.user.id.substring(0, 8), 16) * 1000 : Date.now()).toLocaleDateString(localeValue)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.profile.activity}
          </h2>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t.profile.activity_stats_coming_soon}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.profile.account_details}
          </h2>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.profile.username}
              </p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {session.user?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.profile.email}
              </p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {session.user?.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t.profile.account_type}
              </p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                Discord
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <Link
          href={`/${localeValue}/forum`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {t.profile.back_to_forum}
        </Link>
      </div>
    </div>
  );
}
