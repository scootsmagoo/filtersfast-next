import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported language codes
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'fr-ca'] as const;
const DEFAULT_LANGUAGE = 'en';

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

