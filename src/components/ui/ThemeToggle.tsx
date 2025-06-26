'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ label = { dark: "Dark Mode", light: "Light Mode" } }: { 
  label?: { dark: string; light: string } 
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme, theme } = useTheme();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
    console.log("ThemeToggle mounted, current theme:", theme, "resolvedTheme:", resolvedTheme);
    console.log("HTML has dark class?", document.documentElement.classList.contains('dark'));
  }, [theme, resolvedTheme]);

  // Verbesserte Toggle-Funktion mit mehr Debugging und direkteren DOM-Anpassungen
  const toggleTheme = () => {
    // Bestimme das neue Theme
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log("[ThemeToggle] Umschalten von:", currentTheme, "zu:", newTheme);
    
    // Sofortiges visuelles Feedback durch direkte DOM-Manipulation
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      
      // Direkte Anwendung von Dark-Mode-Stilen
      let styleElement = document.getElementById('forced-dark-mode-styles');
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'forced-dark-mode-styles';
        document.head.appendChild(styleElement);
      }
      
      // Einfügen der wichtigsten Dark-Mode-Stile
      styleElement.innerHTML = `
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
    } else {
      document.documentElement.classList.remove('dark');
      
      // Dark-Mode-Stile entfernen
      const styleElement = document.getElementById('forced-dark-mode-styles');
      if (styleElement) {
        styleElement.innerHTML = '';
      }
    }
    
    // Aktualisiere next-themes State
    setTheme(newTheme);
    
    // Aktualisiere localStorage manuell für absolute Sicherheit
    localStorage.setItem('theme', newTheme);
    
    // Zwinge alle UI-Elemente zur Neuberechnung durch kurze CSS-Transition
    document.body.style.transition = 'background-color 0.1s ease';
    document.body.style.backgroundColor = '';
    
    // Erzwungene Aktualisierung aller UI-Elemente
    setTimeout(() => {
      // Visuelle Änderung erzwingen
      document.body.style.backgroundColor = '';

      console.log("[ThemeToggle] Nach Umschalten - localStorage:", localStorage.getItem('theme'));
      console.log("[ThemeToggle] Nach Umschalten - HTML classList:", document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      console.log("[ThemeToggle] Nach Umschalten - Theme-Status:", newTheme);
      
      // Alle Links und Buttons kurz triggern für visuelle Aktualisierung
      document.querySelectorAll('a, button').forEach(el => {
        el.classList.add('theme-updated');
        setTimeout(() => el.classList.remove('theme-updated'), 50);
      });
    }, 10);
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
