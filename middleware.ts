import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
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

