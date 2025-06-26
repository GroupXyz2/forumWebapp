'use client';

import { CSSProperties, ReactNode, useEffect, useState } from 'react';

interface PageBackgroundProps {
  backgroundUrl?: string;
  children: ReactNode;
}

export default function PageBackground({ backgroundUrl, children }: PageBackgroundProps) {
  // Theme hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Ensure backgroundUrl is a valid string
  const validBackgroundUrl = backgroundUrl && typeof backgroundUrl === 'string' ? backgroundUrl : '';

  if (!mounted) {
    // Prevent hydration errors by not rendering anything during SSR
    return null;
  }

  if (!validBackgroundUrl) {
    // No overlay, just set background using Tailwind
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {children}
      </div>
    );
  }

  const backgroundStyles: CSSProperties = {
    backgroundImage: `url('${validBackgroundUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  // If a background image exists, NO overlay!
  return (
    <div style={backgroundStyles} className="min-h-screen">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
