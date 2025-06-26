import { NextRequest, NextResponse } from 'next/server';
import { getPreferredLocale } from './i18n/settings';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Static files and API routes should not be redirected
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }
  
  // Check if pathname already has locale
  const pathnameHasLocale = ['/en/', '/de/'].some(
    (locale) => pathname.startsWith(locale) || pathname === locale.slice(0, -1)
  );
  
  if (pathnameHasLocale) return NextResponse.next();
  
  // Redirect to locale path based on Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || undefined;
  const locale = getPreferredLocale(acceptLanguage);
  
  // e.g. incoming request is /products
  // The new URL is now /en/products
  return NextResponse.redirect(
    new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
  );
}
