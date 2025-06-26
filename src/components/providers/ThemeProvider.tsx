'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Diese Funktion wird einmal beim ersten Client-seitigen Rendering ausgeführt
    console.log('[ThemeProvider] Client-side mounted');
    
    // Hole den gespeicherten Theme-Wert oder setze den Standard auf 'dark'
    const storedTheme = localStorage.getItem('theme') || 'dark';
    
    // Debug-Log
    console.log('[ThemeProvider] Initial theme from localStorage:', storedTheme);
    console.log('[ThemeProvider] Current HTML class contains dark?', document.documentElement.classList.contains('dark'));
    
    // Erstelle ein globales Stylesheet für erzwungene Dark-Mode-Stile
    const forcedStylesElement = document.createElement('style');
    forcedStylesElement.id = 'forced-dark-mode-styles';

    // Stelle sicher, dass die Klasse mit dem gespeicherten Wert übereinstimmt
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      
      // Füge explizite CSS-Regeln für den Dark Mode hinzu
      forcedStylesElement.innerHTML = `
        .dark .bg-white { background-color: #1f2937 !important; }
        .dark .bg-gray-50 { background-color: #374151 !important; }
        .dark .bg-gray-100 { background-color: #374151 !important; }
        .dark .bg-gray-200 { background-color: #4b5563 !important; }
        .dark .bg-gray-800 { background-color: #1f2937 !important; }
        .dark .border-gray-200 { border-color: #374151 !important; }
        .dark .text-gray-900 { color: #f9fafb !important; }
        .dark .text-gray-800 { color: #f3f4f6 !important; }
        .dark .text-black { color: #fff !important; }
      `;
      
      console.log('[ThemeProvider] Dark mode styles injected');
    } else if (storedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      
      // Entferne explizite Dark-Mode-Stile
      forcedStylesElement.innerHTML = '';
    }

    // Füge das Stylesheet dem Dokument hinzu
    document.head.appendChild(forcedStylesElement);
    
    // Aktualisiere localStorage, wenn es nicht gesetzt ist
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', storedTheme);
      console.log('[ThemeProvider] Updated localStorage with default theme:', storedTheme);
    }
    
    // Cleanup-Funktion
    return () => {
      if (document.head.contains(forcedStylesElement)) {
        document.head.removeChild(forcedStylesElement);
      }
    };
  }, []);

  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="theme"
      disableTransitionOnChange={true} // Verhindere Flackern beim Themenwechsel
      forcedTheme={undefined} // Erlaube manuelle Überschreibung
    >
      {children}
    </NextThemesProvider>
  );
}
