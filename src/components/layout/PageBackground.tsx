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

  if (!mounted) {
    // Verhindert Hydrationsfehler, indem beim SSR nichts gerendert wird
    return null;
  }

  if (!backgroundUrl) {
    // Kein Overlay, sondern einfach den Hintergrund per Tailwind setzen
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {children}
      </div>
    );
  }

  const backgroundStyles: CSSProperties = {
    backgroundImage: `url('${backgroundUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  // Wenn ein Hintergrundbild existiert, KEIN Overlay!
  return (
    <div style={backgroundStyles} className="min-h-screen">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
