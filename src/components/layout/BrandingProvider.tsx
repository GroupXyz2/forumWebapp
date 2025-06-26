'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import BrandingHeader from "./BrandingHeader";
import PageBackground from "./PageBackground";

interface BrandingProviderProps {
  children: ReactNode;
  locale: string;
  isHomepage?: boolean;
}

// Helper to safely get string value from any input
const getStringValue = (value: any): string => {
  // Handle undefined, null, or empty values
  if (value === null || value === undefined) return '';
  
  // Handle strings directly
  if (typeof value === 'string') return value;
  
  // Handle objects with locale keys (shouldn't reach here but just in case)
  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    if (value.en !== undefined || value.de !== undefined) {
      return value.en || '';
    }
  }
  
  // Any other case, return empty string for safety
  return '';
};

export default function BrandingProvider({ children, locale }: BrandingProviderProps) {
  const { settings, isLoading } = useBrandingSettings(locale);
  const pathname = usePathname();
  const [isHomepage, setIsHomepage] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Mount safety for client hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Detect if this is the homepage based on the pathname
  useEffect(() => {
    // The homepage is just the locale root path (/en or /de)
    setIsHomepage(pathname === `/${locale}`);
  }, [pathname, locale]);
  
  // Get the homepage background if we're on the homepage, otherwise use forum background
  // Use empty string as fallback in any case
  const backgroundUrl = mounted ? (
    isHomepage 
      ? getStringValue(settings.homepage_background) 
      : getStringValue(settings.forum_background)
  ) : '';
    
  // Only render branding elements when mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>;
  }
  
  // Safely extract string values for passing to components
  const logoUrl = getStringValue(settings.branding_logo);
  const bannerUrl = getStringValue(settings.branding_banner);
  
  return (
    <PageBackground backgroundUrl={backgroundUrl}>
      <BrandingHeader 
        logoUrl={logoUrl}
        bannerUrl={bannerUrl}
      />
      {children}
    </PageBackground>
  );
}
