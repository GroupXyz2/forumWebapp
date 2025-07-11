import { Locale, locales } from "@/i18n/settings";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import BrandingProvider from "@/components/layout/BrandingProvider";

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

// Fix for Next.js 14+ dynamic routes
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({ 
  children, 
  params
}: {
  children: React.ReactNode;
  params: { locale: string }
}) {
  // Get the locale value directly
  const localeValue = params.locale;
  
  // Check if it's a valid locale
  if (!locales.includes(localeValue as Locale)) {
    throw new Error(`Invalid locale: ${localeValue}`);
  }
  
  // The homepage is the root path (/en or /de)
  const isHomepage = true; // We'll use client-side detection in the BrandingProvider

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandingProvider locale={localeValue} isHomepage={isHomepage}>
          <Navbar 
            locale={localeValue as Locale} 
            translations={{
              app_name: translations[localeValue as keyof typeof translations].app_name || "Forum",
              navigation: translations[localeValue as keyof typeof translations].navigation || {},
              auth: translations[localeValue as keyof typeof translations].auth || {},
              theme: translations[localeValue as keyof typeof translations].theme || {}
            }} 
          />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer locale={localeValue as Locale} />
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
