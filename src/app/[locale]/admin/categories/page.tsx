'use client';

import { Locale } from '@/i18n/settings';
import AdminCategoriesClient from './client';

type CategoriesPageProps = {
  params: { locale: Locale };
};

// Simple client component wrapper to handle the dynamic params
export default function CategoriesPage({ params }: CategoriesPageProps) {
  return <AdminCategoriesClient locale={params.locale} />;
}

