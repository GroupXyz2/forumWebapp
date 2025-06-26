'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogIn, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import LocaleSwitcher from '../ui/LocaleSwitcher';
import Image from 'next/image';

type NavbarProps = {
  locale: string;
  translations: {
    app_name: string;
    navigation: {
      home: string;
      categories: string;
      forum: string;
      profile: string;
      admin: string;
    };
    auth: {
      signin: string;
      signout: string;
    };
    theme: {
      dark: string;
      light: string;
    };
  };
};

export default function Navbar({ locale, translations }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: translations.navigation.home, href: `/${locale}` },
    { name: translations.navigation.forum, href: `/${locale}/forum` },
  ];

  // Add admin link if user has admin role
  if (session?.user?.role === 'admin' || session?.user?.role === 'moderator') {
    navigation.push({ name: translations.navigation.admin, href: `/${locale}/admin` });
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <Image src="/globe.svg" alt="Logo" width={32} height={32} className="dark:invert" />
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">{translations.app_name}</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <LocaleSwitcher />
            <ThemeToggle label={{ dark: translations.theme.dark, light: translations.theme.light }} />

            {status === 'authenticated' ? (
              <div className="relative flex items-center gap-2">
                <Link href={`/${locale}/profile`} className="flex items-center gap-2">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.user.name}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <LogOut size={20} />
                  <span className="sr-only">{translations.auth.signout}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogIn size={20} />
                {translations.auth.signin}
              </button>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-blue-50 dark:bg-gray-800 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4 space-x-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <LocaleSwitcher />
                  <ThemeToggle label={{ dark: translations.theme.dark, light: translations.theme.light }} />
                </div>

                {status === 'authenticated' ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {session.user.name}
                      </span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: `/${locale}` })}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn('discord')}
                    className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <LogIn size={20} />
                    {translations.auth.signin}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
