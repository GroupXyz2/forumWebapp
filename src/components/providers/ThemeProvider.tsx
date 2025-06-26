'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Handle initial theme state
  useEffect(() => {
    // This is now handled by next-themes directly
    // The attribute="class" setting will automatically apply the classes
    // We don't need manual class manipulation which was causing issues
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="theme">
      {children}
    </NextThemesProvider>
  );
}
