'use client';

import Image from 'next/image';
import Link from 'next/link';

interface BrandingHeaderProps {
  logoUrl?: string;
  bannerUrl?: string;
}

export default function BrandingHeader({ logoUrl, bannerUrl }: BrandingHeaderProps) {
  // Ensure URLs are valid strings
  const validLogoUrl = logoUrl && typeof logoUrl === 'string' ? logoUrl : '';
  const validBannerUrl = bannerUrl && typeof bannerUrl === 'string' ? bannerUrl : '';
  
  // If we have a banner image, show it
  if (validBannerUrl) {
    return (
      <div className="w-full relative">
        <div className="relative w-full h-[150px] md:h-[200px] overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url('${validBannerUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="absolute inset-0 bg-blue-900/30 dark:bg-blue-900/50" />
          
          {validLogoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="block">
                <div className="w-auto h-12 md:h-16 relative">
                  <img 
                    src={validLogoUrl} 
                    alt="Site Logo" 
                    className="h-full w-auto object-contain"
                  />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // If we have only a logo, show it centered
  if (validLogoUrl) {
    return (
      <div className="w-full flex justify-center items-center py-4 bg-gradient-to-r from-blue-600/10 via-blue-500/20 to-blue-600/10 dark:from-blue-900/20 dark:via-blue-800/30 dark:to-blue-900/20">
        <Link href="/" className="block">
          <div className="w-auto h-10 md:h-12 relative">
            <img
              src={validLogoUrl}
              alt="Site Logo"
              className="h-full w-auto object-contain"
            />
          </div>
        </Link>
      </div>
    );
  }
  
  // If no branding images, return nothing
  return null;
}
