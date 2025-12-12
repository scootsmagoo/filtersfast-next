/**
 * Security Headers for Admin Endpoints
 * Implements OWASP recommended security headers
 */

import { NextResponse } from 'next/server'

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (strict for admin pages)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  )
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  
  return response
}

/**
 * Create response with security headers
 */
export function secureResponse<T = any>(
  data: T,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init)
  return addSecurityHeaders(response)
}

