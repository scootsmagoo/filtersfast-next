import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findCachedRedirect } from '@/lib/redirects-cache';
import { COUNTRY_TO_CURRENCY, isValidCurrency, parseCurrencyFromHeaders } from '@/lib/currency-utils';
import type { CurrencyCode } from '@/lib/types/currency';

// Supported language codes
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'fr-ca'] as const;
const DEFAULT_LANGUAGE = 'en';
const CURRENCY_COOKIE_NAME = 'ff_currency';
const CURRENCY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Detect user's preferred language from various sources
 */
function detectLanguage(request: NextRequest): string {
  // 1. Check language cookie (set by user preference)
  const cookieLang = request.cookies.get('language')?.value;
  if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang as any)) {
    return cookieLang;
  }
  
  // 2. Check Accept-Language header (browser language)
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    // Parse Accept-Language header
    const languages = acceptLang.split(',').map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    }).sort((a, b) => b.quality - a.quality);
    
    // Find first supported language
    for (const { code } of languages) {
      // Check for exact match
      if (SUPPORTED_LANGUAGES.includes(code as any)) {
        return code;
      }
      // Check for language family match (e.g., 'es-MX' -> 'es')
      const langFamily = code.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(langFamily as any)) {
        return langFamily;
      }
      // Check for French Canadian special case
      if (code === 'fr-ca' || code === 'fr-canadian') {
        return 'fr-ca';
      }
    }
  }
  
  // 3. Default to English
  return DEFAULT_LANGUAGE;
}

export function middleware(request: NextRequest) {
  // URL Redirect handling - Check redirects FIRST before any other processing
  // Skip redirect check for API routes, static files, and admin routes
  const pathname = request.nextUrl.pathname;
  const shouldCheckRedirect = !pathname.startsWith('/api/') && 
                               !pathname.startsWith('/admin/') &&
                               !pathname.startsWith('/_next/');
  
  if (shouldCheckRedirect) {
    try {
      const redirect = findCachedRedirect(pathname);
      
      if (redirect) {
        // Track the redirect hit via API call (non-blocking)
        fetch(`${request.nextUrl.origin}/api/redirects/track/${redirect.id}`, {
          method: 'POST'
        }).catch(() => {}); // Ignore errors to not block redirect
        
        // Perform the redirect
        const redirectType = redirect.redirect_type === '302' ? 302 : 301;
        const destination = new URL(redirect.destination_path, request.url);
        
        return NextResponse.redirect(destination, redirectType);
      }
    } catch (error) {
      // Log error but don't break the request if redirect check fails
      console.error('Error checking redirects:', error);
    }
  }
  
  const response = NextResponse.next();
  
  // Language detection and cookie setting
  const currentLang = request.cookies.get('language')?.value;
  if (!currentLang) {
    const detectedLang = detectLanguage(request);
    response.cookies.set('language', detectedLang, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax'
    });
  }

  // Currency detection and cookie setting
  const existingCurrency = request.cookies.get(CURRENCY_COOKIE_NAME)?.value;
  if (!existingCurrency || !isValidCurrency(existingCurrency)) {
    const detectedCurrency = detectCurrency(request) || existingCurrency;
    if (detectedCurrency && isValidCurrency(detectedCurrency)) {
      response.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
        path: '/',
        maxAge: CURRENCY_COOKIE_MAX_AGE,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }
  }
  
  // Security headers to prevent common attacks
  const securityHeaders = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection in older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Disable unnecessary browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Enforce HTTPS in production
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
    
    // Content Security Policy - OWASP compliant with development support
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widget.trustpilot.com", // Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js dev mode
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Allow localhost connections in development, only self and https in production
      process.env.NODE_ENV === 'development' 
        ? "connect-src 'self' http://localhost:* https:" 
        : "connect-src 'self' https:",
      "frame-src 'self' https://widget.trustpilot.com",
      "frame-ancestors 'none'",
    ].join('; '),
  };
  
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone();
    const proto = request.headers.get('x-forwarded-proto');
    
    // Redirect HTTP to HTTPS
    if (proto === 'http') {
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
  }
  
  return response;
}

function detectCurrency(request: NextRequest): CurrencyCode | null {
  const geoCountry = request.geo?.country;
  if (geoCountry) {
    const currency = COUNTRY_TO_CURRENCY[geoCountry.toUpperCase()];
    if (currency) return currency;
  }

  const headerCurrency = parseCurrencyFromHeaders(request.headers, { fallback: null });
  if (headerCurrency) return headerCurrency;

  return null;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

