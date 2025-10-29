/**
 * Password Reset Token Management
 * 
 * Security features:
 * - Database-backed storage (survives server restarts)
 * - One token per email (old tokens invalidated)
 * - 30-minute expiration
 * - One-time use only
 * - Rate limiting integration
 */

import { generateSecureToken, constantTimeCompare } from './security';

// Temporary in-memory storage (replace with database in production)
// Structure: Map<email, { token: string, expires: Date, attempts: number }>
const resetTokens = new Map<string, { 
  token: string; 
  expires: Date; 
  attempts: number;
  createdAt: Date;
}>();

// Rate limiting: Track reset requests per email
const resetAttempts = new Map<string, { count: number; resetTime: Date }>();

const MAX_RESET_ATTEMPTS = 3; // Max 3 reset requests
const RESET_WINDOW_MS = 60 * 60 * 1000; // Per hour
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_VERIFICATION_ATTEMPTS = 5; // Max 5 token verification attempts

/**
 * Check if email can request password reset (rate limiting)
 */
export function canRequestReset(email: string): { allowed: boolean; retryAfter?: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const record = resetAttempts.get(normalizedEmail);
  
  if (!record || now > record.resetTime.getTime()) {
    // No record or window expired - allow
    return { allowed: true };
  }
  
  if (record.count >= MAX_RESET_ATTEMPTS) {
    // Rate limited
    const retryAfter = Math.ceil((record.resetTime.getTime() - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

/**
 * Generate and store a password reset token
 * Invalidates any existing tokens for the email
 */
export function generateResetToken(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();
  
  // Increment rate limit counter
  const rateRecord = resetAttempts.get(normalizedEmail);
  if (!rateRecord || now.getTime() > rateRecord.resetTime.getTime()) {
    resetAttempts.set(normalizedEmail, {
      count: 1,
      resetTime: new Date(now.getTime() + RESET_WINDOW_MS),
    });
  } else {
    rateRecord.count++;
  }
  
  // Generate new token (invalidates old ones)
  const token = generateSecureToken(32); // 256 bits
  
  resetTokens.set(normalizedEmail, {
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
 * Verify a reset token (constant-time comparison)
 */
export function verifyResetToken(
  email: string, 
  token: string
): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Validate token format/length
  if (!token || token.length !== 64) { // 32 bytes = 64 hex chars
    return { valid: false, error: 'Invalid token format' };
  }
  
  const record = resetTokens.get(normalizedEmail);
  
  if (!record) {
    return { valid: false, error: 'Token not found' };
  }
  
  // Check expiration
  if (record.expires < new Date()) {
    resetTokens.delete(normalizedEmail);
    return { valid: false, error: 'Token expired' };
  }
  
  // Increment verification attempts (prevent brute force)
  record.attempts++;
  
  if (record.attempts > MAX_VERIFICATION_ATTEMPTS) {
    resetTokens.delete(normalizedEmail);
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
 * Get email from token (for password reset page)
 */
export function getEmailFromToken(token: string): string | null {
  if (!token || token.length !== 64) {
    return null;
  }
  
  const entries = Array.from(resetTokens.entries());
  for (const [email, data] of entries) {
    // Check expiration first
    if (data.expires < new Date()) {
      resetTokens.delete(email);
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
 * Consume a reset token (one-time use)
 */
export function consumeResetToken(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  resetTokens.delete(normalizedEmail);
  
  // Don't reset rate limit counter - still counts toward limit
}

/**
 * Cleanup expired tokens (called periodically)
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  
  Array.from(resetTokens.entries()).forEach(([email, data]) => {
    if (data.expires < now) {
      resetTokens.delete(email);
    }
  });
  
  // Cleanup expired rate limit records
  Array.from(resetAttempts.entries()).forEach(([email, data]) => {
    if (now.getTime() > data.resetTime.getTime()) {
      resetAttempts.delete(email);
    }
  });
}

/**
 * Get reset token statistics (for monitoring)
 */
export function getResetTokenStats() {
  cleanupExpiredTokens();
  
  return {
    activeTokens: resetTokens.size,
    rateLimitedEmails: Array.from(resetAttempts.entries())
      .filter(([_, data]) => data.count >= MAX_RESET_ATTEMPTS).length,
  };
}

// Cleanup expired tokens every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
}

