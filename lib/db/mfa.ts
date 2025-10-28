import Database from 'better-sqlite3';
import { TOTP } from 'otpauth';
import crypto from 'crypto';

// Security: Encryption key for TOTP secrets
// CRITICAL: This MUST be set in production to persist across restarts
if (!process.env.MFA_ENCRYPTION_KEY) {
  console.error('WARNING: MFA_ENCRYPTION_KEY not set! MFA secrets will be lost on restart.');
  console.error('Generate a key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

const dbPath = process.env.DATABASE_URL || "./auth.db";
const db = new Database(dbPath);

// Initialize MFA tables
export function initializeMFATables() {
  // MFA factors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_factors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'totp',
      secret TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      verified_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Backup codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_backup_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Trusted devices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_trusted_devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_token TEXT NOT NULL UNIQUE,
      device_name TEXT,
      device_fingerprint TEXT,
      ip_address TEXT,
      user_agent TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // MFA audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      success INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_factors_user ON mfa_factors(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user ON mfa_backup_codes(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_user ON mfa_trusted_devices(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_trusted_devices_token ON mfa_trusted_devices(device_token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_audit_log_user ON mfa_audit_log(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mfa_audit_log_created ON mfa_audit_log(created_at)`);
}

// Security: Simple encryption for TOTP secrets (at-rest encryption)
function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Security: Hash backup codes (never store plaintext)
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Security: Constant-time comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// Generate a secure random backup code (8 characters, alphanumeric)
function generateBackupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// MFA Factor Management
export interface MFAFactor {
  id: string;
  userId: string;
  type: 'totp';
  secret: string;
  enabled: boolean;
  createdAt: number;
  verifiedAt?: number;
}

export function createMFAFactor(userId: string): { factor: MFAFactor; otpauth: string; qrCode: string } {
  const id = crypto.randomUUID();
  const secret = new TOTP({
    issuer: 'FiltersFast',
    label: userId,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  }).secret.base32;

  const encryptedSecret = encrypt(secret);
  const now = Date.now();

  db.prepare(`
    INSERT INTO mfa_factors (id, user_id, type, secret, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, 'totp', encryptedSecret, 0, now);

  const totp = new TOTP({
    issuer: 'FiltersFast',
    label: userId,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  return {
    factor: {
      id,
      userId,
      type: 'totp',
      secret: secret, // Return unencrypted for QR generation
      enabled: false,
      createdAt: now,
    },
    otpauth: totp.toString(),
    qrCode: secret, // Will be converted to QR in API route
  };
}

export function getMFAFactor(userId: string): MFAFactor | null {
  const row = db.prepare(`
    SELECT id, user_id, type, secret, enabled, created_at, verified_at
    FROM mfa_factors
    WHERE user_id = ? AND enabled = 1
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    secret: decrypt(row.secret),
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
  };
}

export function getPendingMFAFactor(userId: string): MFAFactor | null {
  const row = db.prepare(`
    SELECT id, user_id, type, secret, enabled, created_at, verified_at
    FROM mfa_factors
    WHERE user_id = ? AND enabled = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    secret: decrypt(row.secret),
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
  };
}

export function verifyMFAToken(userId: string, token: string): boolean {
  const factor = getMFAFactor(userId) || getPendingMFAFactor(userId);
  if (!factor) return false;

  // Security: Validate token format before verification
  if (!/^\d{6}$/.test(token)) {
    return false;
  }

  const totp = new TOTP({
    issuer: 'FiltersFast',
    label: userId,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: factor.secret,
  });

  // Security: Verify token with window of ±1 period (±30 seconds) for clock skew
  // Window of 1 allows for minor time differences between server and device
  // This provides 90-second valid window while maintaining security
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function enableMFAFactor(userId: string, factorId: string): boolean {
  const now = Date.now();
  const result = db.prepare(`
    UPDATE mfa_factors
    SET enabled = 1, verified_at = ?
    WHERE id = ? AND user_id = ? AND enabled = 0
  `).run(now, factorId, userId);

  return result.changes > 0;
}

export function disableMFAFactor(userId: string): boolean {
  const result = db.prepare(`
    DELETE FROM mfa_factors
    WHERE user_id = ?
  `).run(userId);

  // Also delete backup codes and trusted devices
  db.prepare(`DELETE FROM mfa_backup_codes WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM mfa_trusted_devices WHERE user_id = ?`).run(userId);

  return result.changes > 0;
}

// Backup Codes Management
export interface BackupCode {
  id: string;
  userId: string;
  codeHash: string;
  used: boolean;
  usedAt?: number;
  createdAt: number;
}

export function generateBackupCodes(userId: string): string[] {
  // Delete old backup codes
  db.prepare(`DELETE FROM mfa_backup_codes WHERE user_id = ?`).run(userId);

  const codes: string[] = [];
  const now = Date.now();

  // Generate 10 backup codes
  for (let i = 0; i < 10; i++) {
    const code = generateBackupCode();
    const codeHash = hashBackupCode(code);
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO mfa_backup_codes (id, user_id, code_hash, used, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, codeHash, 0, now);

    codes.push(code);
  }

  return codes;
}

export function verifyBackupCode(userId: string, code: string): boolean {
  const codeHash = hashBackupCode(code);
  const now = Date.now();

  const result = db.prepare(`
    UPDATE mfa_backup_codes
    SET used = 1, used_at = ?
    WHERE user_id = ? AND code_hash = ? AND used = 0
  `).run(now, userId, codeHash);

  return result.changes > 0;
}

export function getBackupCodesCount(userId: string): { total: number; used: number; remaining: number } {
  const row = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used
    FROM mfa_backup_codes
    WHERE user_id = ?
  `).get(userId) as any;

  return {
    total: row?.total || 0,
    used: row?.used || 0,
    remaining: (row?.total || 0) - (row?.used || 0),
  };
}

// Trusted Devices Management
export interface TrustedDevice {
  id: string;
  userId: string;
  deviceToken: string;
  deviceName?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: number;
  createdAt: number;
  lastUsedAt?: number;
}

export function createTrustedDevice(
  userId: string,
  deviceInfo: {
    deviceName?: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): string {
  const id = crypto.randomUUID();
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

  db.prepare(`
    INSERT INTO mfa_trusted_devices 
    (id, user_id, device_token, device_name, device_fingerprint, ip_address, user_agent, expires_at, created_at, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    deviceToken,
    deviceInfo.deviceName || null,
    deviceInfo.deviceFingerprint || null,
    deviceInfo.ipAddress || null,
    deviceInfo.userAgent || null,
    expiresAt,
    now,
    now
  );

  return deviceToken;
}

export function verifyTrustedDevice(deviceToken: string): TrustedDevice | null {
  const now = Date.now();

  const row = db.prepare(`
    SELECT id, user_id, device_token, device_name, device_fingerprint, ip_address, user_agent, expires_at, created_at, last_used_at
    FROM mfa_trusted_devices
    WHERE device_token = ? AND expires_at > ?
  `).get(deviceToken, now) as any;

  if (!row) return null;

  // Update last used
  db.prepare(`
    UPDATE mfa_trusted_devices
    SET last_used_at = ?
    WHERE id = ?
  `).run(now, row.id);

  return {
    id: row.id,
    userId: row.user_id,
    deviceToken: row.device_token,
    deviceName: row.device_name,
    deviceFingerprint: row.device_fingerprint,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    lastUsedAt: now,
  };
}

export function getTrustedDevices(userId: string): TrustedDevice[] {
  const now = Date.now();

  const rows = db.prepare(`
    SELECT id, user_id, device_token, device_name, device_fingerprint, ip_address, user_agent, expires_at, created_at, last_used_at
    FROM mfa_trusted_devices
    WHERE user_id = ? AND expires_at > ?
    ORDER BY last_used_at DESC
  `).all(userId, now) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    deviceToken: row.device_token,
    deviceName: row.device_name,
    deviceFingerprint: row.device_fingerprint,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));
}

export function removeTrustedDevice(userId: string, deviceId: string): boolean {
  const result = db.prepare(`
    DELETE FROM mfa_trusted_devices
    WHERE id = ? AND user_id = ?
  `).run(deviceId, userId);

  return result.changes > 0;
}

export function removeAllTrustedDevices(userId: string): number {
  const result = db.prepare(`
    DELETE FROM mfa_trusted_devices
    WHERE user_id = ?
  `).run(userId);

  return result.changes;
}

// Clean up expired devices
export function cleanupExpiredDevices(): number {
  const now = Date.now();
  const result = db.prepare(`
    DELETE FROM mfa_trusted_devices
    WHERE expires_at <= ?
  `).run(now);

  return result.changes;
}

// MFA Audit Logging
export interface MFAAuditLog {
  id: string;
  userId: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: number;
}

export function logMFAAction(
  userId: string,
  action: string,
  success: boolean,
  details?: {
    ipAddress?: string;
    userAgent?: string;
    message?: string;
  }
): void {
  const id = crypto.randomUUID();
  const now = Date.now();

  db.prepare(`
    INSERT INTO mfa_audit_log (id, user_id, action, success, ip_address, user_agent, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    action,
    success ? 1 : 0,
    details?.ipAddress || null,
    details?.userAgent || null,
    details?.message || null,
    now
  );
}

export function getMFAAuditLogs(userId: string, limit = 50): MFAAuditLog[] {
  const rows = db.prepare(`
    SELECT id, user_id, action, success, ip_address, user_agent, details, created_at
    FROM mfa_audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    success: row.success === 1,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    details: row.details,
    createdAt: row.created_at,
  }));
}

// Admin Functions
export function getMFAStatistics(): {
  totalUsers: number;
  usersWithMFA: number;
  mfaAdoptionRate: number;
  totalBackupCodes: number;
  usedBackupCodes: number;
  totalTrustedDevices: number;
} {
  const totalUsers = (db.prepare(`SELECT COUNT(*) as count FROM user`).get() as any).count;
  const usersWithMFA = (db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM mfa_factors WHERE enabled = 1`).get() as any).count;
  const totalBackupCodes = (db.prepare(`SELECT COUNT(*) as count FROM mfa_backup_codes`).get() as any).count;
  const usedBackupCodes = (db.prepare(`SELECT COUNT(*) as count FROM mfa_backup_codes WHERE used = 1`).get() as any).count;
  const totalTrustedDevices = (db.prepare(`SELECT COUNT(*) as count FROM mfa_trusted_devices WHERE expires_at > ?`).get(Date.now()) as any).count;

  return {
    totalUsers,
    usersWithMFA,
    mfaAdoptionRate: totalUsers > 0 ? (usersWithMFA / totalUsers) * 100 : 0,
    totalBackupCodes,
    usedBackupCodes,
    totalTrustedDevices,
  };
}

// Initialize tables on import
initializeMFATables();

