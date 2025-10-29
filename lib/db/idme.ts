/**
 * ID.me Verification Database Functions
 * 
 * CRUD operations for ID.me verifications
 */

import Database from 'better-sqlite3';
import path from 'path';
import type { 
  IdMeVerification, 
  IdMeDiscount, 
  VerificationType,
  VerificationStatus,
  VerificationCheckResult 
} from '@/lib/types/idme';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

/**
 * Get active verification for a user
 */
export function getActiveVerification(userId: string): IdMeVerification | null {
  const stmt = db.prepare(`
    SELECT * FROM idme_verifications
    WHERE user_id = ? 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY verified_at DESC
    LIMIT 1
  `);

  const row = stmt.get(userId) as any;
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    verificationType: row.verification_type,
    idmeUserId: row.idme_user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all verifications for a user (including expired/revoked)
 */
export function getUserVerifications(userId: string): IdMeVerification[] {
  const stmt = db.prepare(`
    SELECT * FROM idme_verifications
    WHERE user_id = ?
    ORDER BY verified_at DESC
  `);

  const rows = stmt.all(userId) as any[];
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    verificationType: row.verification_type,
    idmeUserId: row.idme_user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new verification record
 */
export function createVerification(data: {
  userId: string;
  verificationType: VerificationType;
  idmeUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}): IdMeVerification {
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO idme_verifications 
    (user_id, verification_type, idme_user_id, email, first_name, last_name, 
     verified_at, expires_at, status, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `);

  const result = stmt.run(
    data.userId,
    data.verificationType,
    data.idmeUserId,
    data.email,
    data.firstName || null,
    data.lastName || null,
    now,
    data.expiresAt || null,
    data.metadata ? JSON.stringify(data.metadata) : null,
    now,
    now
  );

  return {
    id: Number(result.lastInsertRowid),
    userId: data.userId,
    verificationType: data.verificationType,
    idmeUserId: data.idmeUserId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    verifiedAt: now,
    expiresAt: data.expiresAt,
    status: 'active',
    metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update verification status
 */
export function updateVerificationStatus(
  id: number,
  status: VerificationStatus
): void {
  const stmt = db.prepare(`
    UPDATE idme_verifications
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  stmt.run(status, id);
}

/**
 * Revoke all verifications for a user
 */
export function revokeUserVerifications(userId: string): void {
  const stmt = db.prepare(`
    UPDATE idme_verifications
    SET status = 'revoked', updated_at = datetime('now')
    WHERE user_id = ? AND status = 'active'
  `);

  stmt.run(userId);
}

/**
 * Check if user has active verification
 */
export function checkVerificationStatus(userId: string): VerificationCheckResult {
  const verification = getActiveVerification(userId);
  
  if (!verification) {
    return { isVerified: false };
  }

  const discount = getDiscountByType(verification.verificationType);
  
  return {
    isVerified: true,
    verificationType: verification.verificationType,
    discountPercentage: discount?.discountPercentage,
    expiresAt: verification.expiresAt,
  };
}

/**
 * Get discount configuration by verification type
 */
export function getDiscountByType(verificationType: VerificationType): IdMeDiscount | null {
  const stmt = db.prepare(`
    SELECT * FROM idme_discounts
    WHERE verification_type = ? AND is_active = 1
  `);

  const row = stmt.get(verificationType) as any;
  if (!row) return null;

  return {
    id: row.id,
    verificationType: row.verification_type,
    discountPercentage: row.discount_percentage,
    discountCode: row.discount_code,
    isActive: Boolean(row.is_active),
    minOrderAmount: row.min_order_amount,
    maxDiscountAmount: row.max_discount_amount,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all active discount configurations
 */
export function getAllActiveDiscounts(): IdMeDiscount[] {
  const stmt = db.prepare(`
    SELECT * FROM idme_discounts
    WHERE is_active = 1
    ORDER BY discount_percentage DESC
  `);

  const rows = stmt.all() as any[];
  return rows.map(row => ({
    id: row.id,
    verificationType: row.verification_type,
    discountPercentage: row.discount_percentage,
    discountCode: row.discount_code,
    isActive: Boolean(row.is_active),
    minOrderAmount: row.min_order_amount,
    maxDiscountAmount: row.max_discount_amount,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Update discount configuration
 */
export function updateDiscount(
  verificationType: VerificationType,
  data: Partial<Omit<IdMeDiscount, 'id' | 'verificationType' | 'createdAt' | 'updatedAt'>>
): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.discountPercentage !== undefined) {
    fields.push('discount_percentage = ?');
    values.push(data.discountPercentage);
  }
  if (data.discountCode !== undefined) {
    fields.push('discount_code = ?');
    values.push(data.discountCode);
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(data.isActive ? 1 : 0);
  }
  if (data.minOrderAmount !== undefined) {
    fields.push('min_order_amount = ?');
    values.push(data.minOrderAmount);
  }
  if (data.maxDiscountAmount !== undefined) {
    fields.push('max_discount_amount = ?');
    values.push(data.maxDiscountAmount);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = datetime(\'now\')');
  values.push(verificationType);

  const stmt = db.prepare(`
    UPDATE idme_discounts
    SET ${fields.join(', ')}
    WHERE verification_type = ?
  `);

  stmt.run(...values);
}

/**
 * Log verification attempt
 */
export function logVerificationAttempt(data: {
  userId?: string;
  verificationType?: VerificationType;
  action: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): void {
  const stmt = db.prepare(`
    INSERT INTO idme_verification_log
    (user_id, verification_type, action, success, error_message, ip_address, user_agent, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    data.userId || null,
    data.verificationType || null,
    data.action,
    data.success ? 1 : 0,
    data.errorMessage || null,
    data.ipAddress || null,
    data.userAgent || null,
    data.metadata ? JSON.stringify(data.metadata) : null
  );
}

/**
 * Get verification statistics for admin
 */
export function getVerificationStats() {
  // Total active verifications
  const totalActive = db.prepare(`
    SELECT COUNT(*) as count FROM idme_verifications
    WHERE status = 'active'
  `).get() as any;

  // By type
  const byType = db.prepare(`
    SELECT verification_type, COUNT(*) as count
    FROM idme_verifications
    WHERE status = 'active'
    GROUP BY verification_type
  `).all() as any[];

  // Recent verifications (last 30 days)
  const recentCount = db.prepare(`
    SELECT COUNT(*) as count FROM idme_verifications
    WHERE verified_at > datetime('now', '-30 days')
  `).get() as any;

  // Success rate
  const successRate = db.prepare(`
    SELECT 
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as rate
    FROM idme_verification_log
    WHERE action = 'verify'
    AND created_at > datetime('now', '-30 days')
  `).get() as any;

  return {
    totalActive: totalActive.count,
    byType: byType.reduce((acc: any, row: any) => {
      acc[row.verification_type] = row.count;
      return acc;
    }, {}),
    recentVerifications: recentCount.count,
    successRate: successRate.rate || 0,
  };
}

