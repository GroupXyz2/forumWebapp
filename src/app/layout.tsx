import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { locales } from "@/i18n/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modern Forum",
  description: "A modern forum application with dark mode, admin features and multi-language support",
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dieses Script läuft vor der React-Hydratisierung, um das Flackern zu verhindern */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Setze das Theme basierend auf localStorage oder 'dark' als Fallback
                  const storedTheme = localStorage.getItem('theme');
                  document.documentElement.classList.toggle('dark', 
                    storedTheme === 'dark' || (!storedTheme && true) // Default zu dark
                  );
                  console.log('[Theme Script] Initial theme applied:', 
                    storedTheme || 'default:dark', 
                    'Dark class?', document.documentElement.classList.contains('dark')
                  );
                } catch (e) {
                  console.error('[Theme Script] Error applying theme:', e);
                  // Bei Fehler sicherstellen, dass Dark-Modus als Fallback aktiviert ist
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950 text-black dark:text-white`}
      >
        {/* ThemeProvider ist in den Locale-Layouts enthalten */}
        {children}
      </body>
    </html>
  );
}
