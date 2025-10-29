/**
 * Security utilities for input validation and sanitization
 */

import { logger } from './logger';

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and scripts
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent DOS
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Validate email format with strict regex
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 320) return false; // RFC 5321
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Returns validation result with specific error messages
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (maximum 128 characters)' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 
    'abc123', 'letmein', 'welcome', 'monkey123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'This password is too common. Please choose a stronger password' };
  }
  
  return { valid: true };
}

/**
 * Validate name input
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Name is too long (maximum 100 characters)' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true };
}

/**
 * Generate a secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiting helper - check if action is allowed
 * Returns true if action is allowed, false if rate limited
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    // No record or window expired
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    // Within window
    if (record.count < this.maxAttempts) {
      record.count++;
      return true;
    }
    
    // Rate limited
    return false;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const remaining = record.resetTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
  }
}

/**
 * Prevent timing attacks by ensuring constant-time string comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if request is from a secure origin (HTTPS in production)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true; // Server-side
  
  // Allow HTTP only in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, require HTTPS
  return window.location.protocol === 'https:';
}

/**
 * Content Security Policy headers for XSS protection
 */
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Verify request origin for CSRF protection
 * Returns true if origin is trusted
 */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Allow requests without origin/referer in development
  if (process.env.NODE_ENV === 'development' && !origin && !referer) {
    return true;
  }
  
  // OWASP CSRF Protection: Validate origin against trusted list
  // In development: allow any localhost port for flexibility
  // In production: strict validation against environment variables
  const isOriginAllowed = (testOrigin: string): boolean => {
    if (process.env.NODE_ENV === 'development') {
      // Allow any localhost or 127.0.0.1 port in development
      return testOrigin.startsWith('http://localhost:') || 
             testOrigin.startsWith('http://127.0.0.1:') ||
             testOrigin.startsWith('https://localhost:') ||
             testOrigin.startsWith('https://127.0.0.1:');
    }
    
    // Production: strict whitelist
    const trustedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
    ].filter(Boolean) as string[];
    
    return trustedOrigins.some(trusted => testOrigin === trusted || testOrigin.startsWith(trusted));
  };
  
  // Check origin header
  if (origin) {
    const isAllowed = isOriginAllowed(origin);
    if (!isAllowed) {
      logger.security('CSRF attempt detected - invalid origin', { 
        origin, 
        referer,
        env: process.env.NODE_ENV
      });
    }
    return isAllowed;
  }
  
  // Check referer header as fallback
  if (referer) {
    const isAllowed = isOriginAllowed(new URL(referer).origin);
    if (!isAllowed) {
      logger.security('CSRF attempt detected - invalid referer', { 
        origin, 
        referer,
        env: process.env.NODE_ENV
      });
    }
    return isAllowed;
  }
  
  // No origin or referer - reject in production
  if (process.env.NODE_ENV === 'production') {
    logger.security('CSRF attempt detected - missing origin/referer', {
      origin,
      referer
    });
  }
  return process.env.NODE_ENV === 'development';
}

/**
 * Validate request payload size to prevent DOS attacks
 */
export function validatePayloadSize(body: any, maxSizeKB: number = 10): boolean {
  try {
    const size = JSON.stringify(body).length;
    const maxBytes = maxSizeKB * 1024;
    return size <= maxBytes;
  } catch {
    return false;
  }
}


