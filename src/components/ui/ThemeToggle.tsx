'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ label = { dark: "Dark Mode", light: "Light Mode" } }: { 
  label?: { dark: string; light: string } 
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Let next-themes handle the theme switching
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Don't manually manipulate document classes, let next-themes handle it
    console.log('Theme toggled to:', newTheme);
  };

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="hidden sm:block h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      aria-label={isDark ? label.light : label.dark}
      className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={toggleTheme}
    >
      {isDark ? (
        <>
          <Sun className="h-5 w-5" />
          <span className="hidden sm:block">{label.light}</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="hidden sm:block">{label.dark}</span>
        </>
      )}
    </button>
  );
}
