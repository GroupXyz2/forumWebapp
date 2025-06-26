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

export default function BrandingProvider({ children, locale }: BrandingProviderProps) {
  const { settings, isLoading } = useBrandingSettings(locale);
  const pathname = usePathname();
  const [isHomepage, setIsHomepage] = useState(false);
  
  // Detect if this is the homepage based on the pathname
  useEffect(() => {
    // The homepage is just the locale root path (/en or /de)
    setIsHomepage(pathname === `/${locale}`);
  }, [pathname, locale]);
  
  // Determine which background to use
  const backgroundUrl = isHomepage 
    ? settings.homepage_background 
    : settings.forum_background;
    
  return (
    <PageBackground backgroundUrl={backgroundUrl}>
      <BrandingHeader 
        logoUrl={settings.branding_logo}
        bannerUrl={settings.branding_banner}
      />
      {children}
    </PageBackground>
  );
}
