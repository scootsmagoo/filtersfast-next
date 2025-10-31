/**
 * Newsletter Unsubscribe Tokens Database Functions
 * GDPR/CAN-SPAM compliant unsubscribe functionality
 */

import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

export interface NewsletterToken {
  id: number;
  userId: string;
  token: string;
  email: string;
  type: 'unsubscribe' | 'preferences';
  createdAt: number;
  expiresAt: number | null; // null means never expires (for unsubscribe links)
  usedAt: number | null;
}

const getDb = () => {
  return new Database('filtersfast.db');
};

/**
 * Initialize newsletter tokens table
 */
export function initNewsletterTokensTable() {
  const db = getDb();
  
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS newsletter_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('unsubscribe', 'preferences')),
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        used_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    
    // Index for faster token lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_tokens_token 
      ON newsletter_tokens(token)
    `);
    
    // Index for user lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_tokens_user 
      ON newsletter_tokens(user_id)
    `);
    
    console.log('✅ Newsletter tokens table initialized');
  } catch (error) {
    console.error('Error initializing newsletter tokens table:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a newsletter token
 */
export function createNewsletterToken(
  userId: string,
  email: string,
  type: 'unsubscribe' | 'preferences',
  expiresInDays: number | null = null
): string {
  // OWASP: Input validation
  if (!userId || typeof userId !== 'string' || userId.length > 100) {
    throw new Error('Invalid userId');
  }
  if (!email || typeof email !== 'string' || email.length > 255 || !email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (type !== 'unsubscribe' && type !== 'preferences') {
    throw new Error('Invalid token type');
  }
  if (expiresInDays !== null && (typeof expiresInDays !== 'number' || expiresInDays < 0 || expiresInDays > 365)) {
    throw new Error('Invalid expiration days');
  }
  
  const db = getDb();
  
  try {
    const token = generateToken();
    const createdAt = Date.now();
    const expiresAt = expiresInDays ? createdAt + (expiresInDays * 24 * 60 * 60 * 1000) : null;
    
    const stmt = db.prepare(`
      INSERT INTO newsletter_tokens (user_id, token, email, type, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, token, email.toLowerCase(), type, createdAt, expiresAt);
    
    return token;
  } finally {
    db.close();
  }
}

/**
 * Validate and retrieve a newsletter token
 */
export function getNewsletterToken(token: string): NewsletterToken | null {
  // OWASP: Input validation - prevent SQL injection and DoS
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }
  
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        token,
        email,
        type,
        created_at as createdAt,
        expires_at as expiresAt,
        used_at as usedAt
      FROM newsletter_tokens
      WHERE token = ?
    `);
    
    const tokenData = stmt.get(token) as NewsletterToken | undefined;
    
    if (!tokenData) {
      return null;
    }
    
    // Check if token has been used
    if (tokenData.usedAt) {
      return null;
    }
    
    // Check if token has expired (only if it has an expiration)
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      return null;
    }
    
    return tokenData;
  } finally {
    db.close();
  }
}

/**
 * Mark a token as used
 */
export function markTokenAsUsed(token: string): boolean {
  // OWASP: Input validation
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return false;
  }
  
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      UPDATE newsletter_tokens
      SET used_at = ?
      WHERE token = ? AND used_at IS NULL
    `);
    
    const result = stmt.run(Date.now(), token);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Get the most recent valid token for a user
 */
export function getUserActiveToken(
  userId: string,
  type: 'unsubscribe' | 'preferences'
): NewsletterToken | null {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        token,
        email,
        type,
        created_at as createdAt,
        expires_at as expiresAt,
        used_at as usedAt
      FROM newsletter_tokens
      WHERE user_id = ? 
        AND type = ?
        AND used_at IS NULL
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    const tokenData = stmt.get(userId, type, Date.now()) as NewsletterToken | undefined;
    
    return tokenData || null;
  } finally {
    db.close();
  }
}

/**
 * Clean up expired tokens (for maintenance)
 */
export function cleanupExpiredTokens(): number {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      DELETE FROM newsletter_tokens
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `);
    
    const result = stmt.run(Date.now());
    return result.changes;
  } finally {
    db.close();
  }
}

/**
 * Revoke all tokens for a user (e.g., when they change email)
 */
export function revokeUserTokens(userId: string): number {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      UPDATE newsletter_tokens
      SET used_at = ?
      WHERE user_id = ? AND used_at IS NULL
    `);
    
    const result = stmt.run(Date.now(), userId);
    return result.changes;
  } finally {
    db.close();
  }
}

