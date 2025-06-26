import { Metadata } from 'next';
import { Locale } from '@/i18n/settings';
import SettingsClient from './client';

export const metadata: Metadata = {
  title: 'Admin Settings',
  description: 'Manage homepage settings',
};

export default async function AdminSettingsPage({ params }: { params: { locale: Locale } }) {
  return <SettingsClient locale={params.locale} />;
}
