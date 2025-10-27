/**
 * Email Verification Token Management
 * 
 * Security Features:
 * - Cryptographically secure tokens (256-bit)
 * - 24-hour expiration window
 * - One-time use only
 * - Rate limiting (3 requests per hour per email)
 * - Constant-time comparison
 * - Automatic cleanup of expired tokens
 */

import { generateSecureToken, constantTimeCompare } from './security';

// Temporary in-memory storage (replace with database in production)
// Structure: Map<email, { token: string, expires: Date, attempts: number }>
const verificationTokens = new Map<string, { 
  token: string; 
  expires: Date; 
  attempts: number;
  createdAt: Date;
}>();

// Rate limiting: Track verification email requests per email
const verificationAttempts = new Map<string, { count: number; resetTime: Date }>();

const MAX_SEND_ATTEMPTS = 3; // Max 3 verification emails per hour
const SEND_WINDOW_MS = 60 * 60 * 1000; // Per hour
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_VERIFICATION_ATTEMPTS = 10; // Max 10 token verification attempts

/**
 * Check if email can request verification email (rate limiting)
 */
export function canRequestVerification(email: string): { allowed: boolean; retryAfter?: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const record = verificationAttempts.get(normalizedEmail);
  
  if (!record || now > record.resetTime.getTime()) {
    // No record or window expired - allow
    return { allowed: true };
  }
  
  if (record.count >= MAX_SEND_ATTEMPTS) {
    // Rate limited
    const retryAfter = Math.ceil((record.resetTime.getTime() - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

/**
 * Generate and store an email verification token
 * Invalidates any existing tokens for the email
 */
export function generateVerificationToken(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();
  
  // Increment rate limit counter
  const rateRecord = verificationAttempts.get(normalizedEmail);
  if (!rateRecord || now.getTime() > rateRecord.resetTime.getTime()) {
    verificationAttempts.set(normalizedEmail, {
      count: 1,
      resetTime: new Date(now.getTime() + SEND_WINDOW_MS),
    });
  } else {
    rateRecord.count++;
  }
  
  // Generate new token (invalidates old ones)
  const token = generateSecureToken(32); // 256 bits
  
  verificationTokens.set(normalizedEmail, {
    token,
    expires: new Date(now.getTime() + TOKEN_EXPIRY_MS),
    attempts: 0,
    createdAt: now,
  });
  
  // Cleanup expired tokens
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Verify an email verification token (constant-time comparison)
 */
export function verifyEmailToken(
  email: string, 
  token: string
): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Validate token format/length
  if (!token || token.length !== 64) { // 32 bytes = 64 hex chars
    return { valid: false, error: 'Invalid token format' };
  }
  
  const record = verificationTokens.get(normalizedEmail);
  
  if (!record) {
    return { valid: false, error: 'Token not found' };
  }
  
  // Check expiration (24 hours)
  if (record.expires < new Date()) {
    verificationTokens.delete(normalizedEmail);
    return { valid: false, error: 'Token expired' };
  }
  
  // Increment verification attempts (prevent brute force)
  record.attempts++;
  
  if (record.attempts > MAX_VERIFICATION_ATTEMPTS) {
    verificationTokens.delete(normalizedEmail);
    return { valid: false, error: 'Too many verification attempts' };
  }
  
  // Constant-time comparison to prevent timing attacks
  const valid = constantTimeCompare(record.token, token);
  
  if (!valid) {
    return { valid: false, error: 'Invalid token' };
  }
  
  return { valid: true };
}

/**
 * Get email from verification token
 */
export function getEmailFromVerificationToken(token: string): string | null {
  if (!token || token.length !== 64) {
    return null;
  }
  
  const entries = Array.from(verificationTokens.entries());
  for (const [email, data] of entries) {
    // Check expiration first
    if (data.expires < new Date()) {
      verificationTokens.delete(email);
      continue;
    }
    
    // Constant-time comparison
    if (constantTimeCompare(data.token, token)) {
      return email;
    }
  }
  
  return null;
}

/**
 * Consume a verification token (one-time use)
 */
export function consumeVerificationToken(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  verificationTokens.delete(normalizedEmail);
  
  // Reset rate limit counter after successful verification
  verificationAttempts.delete(normalizedEmail);
}

/**
 * Check if email has a pending verification
 */
export function hasPendingVerification(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const record = verificationTokens.get(normalizedEmail);
  
  if (!record) {
    return false;
  }
  
  // Check if token is still valid
  return record.expires > new Date();
}

/**
 * Cleanup expired tokens (called periodically)
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  
  Array.from(verificationTokens.entries()).forEach(([email, data]) => {
    if (data.expires < now) {
      verificationTokens.delete(email);
    }
  });
  
  // Cleanup expired rate limit records
  Array.from(verificationAttempts.entries()).forEach(([email, data]) => {
    if (now.getTime() > data.resetTime.getTime()) {
      verificationAttempts.delete(email);
    }
  });
}

/**
 * Get verification token statistics (for monitoring)
 */
export function getVerificationTokenStats() {
  cleanupExpiredTokens();
  
  return {
    activeTokens: verificationTokens.size,
    rateLimitedEmails: Array.from(verificationAttempts.entries())
      .filter(([_, data]) => data.count >= MAX_SEND_ATTEMPTS).length,
  };
}

/**
 * Get time remaining until email can request verification again
 */
export function getVerificationRetryTime(email: string): number {
  const normalizedEmail = email.toLowerCase().trim();
  const record = verificationAttempts.get(normalizedEmail);
  
  if (!record) {
    return 0;
  }
  
  const remaining = record.resetTime.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
}

// Cleanup expired tokens every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredTokens, 10 * 60 * 1000);
}

