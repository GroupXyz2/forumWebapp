import { redirect } from 'next/navigation';
import { getPreferredLocale } from '@/i18n/settings';

export default function Home() {
  // Redirect to the default locale or preferred locale
  const locale = getPreferredLocale();
  redirect(`/${locale}`);
}
