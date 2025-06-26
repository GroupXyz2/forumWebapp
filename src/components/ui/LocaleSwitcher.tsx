'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/i18n/settings';

export default function LocaleSwitcher() {
  const pathName = usePathname();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    
    // Get current path without locale prefix
    const segments = pathName.split('/');
    const isLocaleSegment = locales.includes(segments[1] as any);
    const pathWithoutLocale = isLocaleSegment 
      ? `/${segments.slice(2).join('/')}` 
      : pathName;
    
    // Navigate to new locale path
    router.push(`/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`);
  };

  // Extract current locale from path
  const segments = pathName.split('/');
  const currentLocale = locales.includes(segments[1] as any) ? segments[1] : 'en';

  return (
    <select 
      value={currentLocale}
      onChange={handleChange}
      className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 text-sm"
    >
      <option value="en">English</option>
      <option value="de">Deutsch</option>
    </select>
  );
}
