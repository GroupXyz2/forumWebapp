'use client';

import { useSession } from "next-auth/react";
import { redirect } from 'next/navigation';
import { Locale } from "@/i18n/settings";
import AuditLogTable from '@/components/admin/AuditLogTable';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

type AuditLogPageProps = {
  params: { locale: Locale };
};

export default function AuditLogPage({ params }: AuditLogPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = params.locale;
  const t = translations[locale].admin;
  
  useEffect(() => {
    // Redirect if not authenticated or not admin/moderator
    if (status === 'unauthenticated' || 
        (session?.user && !['admin', 'moderator'].includes(session.user.role as string))) {
      router.push(`/${locale}/forum`);
    }
  }, [session, status, router, locale]);
  
  // Show loading while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-2/4 mb-8"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.auditLog}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.auditLogDesc}</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <AuditLogTable locale={locale} />
      </div>
    </div>
  );
}
