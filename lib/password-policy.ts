/**
 * Password Policy and Enforcement
 * Implements password complexity, history, and expiry requirements
 * NOTE: These functions should only be called server-side (API routes, server actions)
 */

import bcrypt from 'bcryptjs'
import { addPasswordHistory, isPasswordReused, updateAdminPasswordChange } from './db/admin-roles'

// ============================================================================
// Password Complexity Rules
// ============================================================================

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventReuse: boolean
  reuseHistory: number
  expiryDays: number
}

// Default password policy for admin users
export const DEFAULT_ADMIN_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: true,
  reuseHistory: 5,
  expiryDays: 90,
}

/**
 * Validate password against complexity requirements
 */
export function validatePasswordComplexity(
  password: string,
  policy: PasswordPolicy = DEFAULT_ADMIN_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = []

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`)
  }

  // Character type requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
  }

  // Common password checks
  const commonPasswords = [
    'password',
    'password123',
    'admin',
    'admin123',
    'filtersfast',
    '12345678',
    'qwerty',
    'letmein',
  ]

  const lowerPassword = password.toLowerCase()
  if (commonPasswords.some(common => lowerPassword.includes(common))) {
    errors.push('Password contains common words or patterns')
  }

  // Sequential character checks
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters (e.g., "aaa")')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if password meets admin requirements
 */
export function isPasswordComplexEnough(password: string): boolean {
  const result = validatePasswordComplexity(password)
  return result.valid
}

/**
 * Generate a secure random password that meets policy requirements
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

// ============================================================================
// Password History and Reuse Prevention
// ============================================================================

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Check if password was recently used by admin
 */
export async function checkPasswordReuse(
  adminId: number,
  newPassword: string
): Promise<boolean> {
  try {
    const hash = await hashPassword(newPassword)
    return isPasswordReused(adminId, hash)
  } catch (error) {
    console.error('Error checking password reuse:', error)
    return false
  }
}

/**
 * Record password in history after successful change
 */
export function recordPasswordChange(adminId: number, passwordHash: string): void {
  try {
    addPasswordHistory(adminId, passwordHash)
    updateAdminPasswordChange(adminId)
  } catch (error) {
    console.error('Error recording password change:', error)
  }
}

// ============================================================================
// Password Expiry
// ============================================================================

/**
 * Check if admin password is expired
 */
export function isPasswordExpiredForAdmin(
  lastPasswordChange: number | null,
  passwordExpiresAt: number | null,
  policy: PasswordPolicy = DEFAULT_ADMIN_PASSWORD_POLICY
): boolean {
  // If never changed, it's expired
  if (!lastPasswordChange || !passwordExpiresAt) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return passwordExpiresAt < now
}

/**
 * Calculate password expiry date
 */
export function calculatePasswordExpiry(
  policy: PasswordPolicy = DEFAULT_ADMIN_PASSWORD_POLICY
): number {
  const now = Math.floor(Date.now() / 1000)
  return now + policy.expiryDays * 24 * 60 * 60
}

/**
 * Get days until password expires
 */
export function getDaysUntilExpiry(passwordExpiresAt: number | null): number | null {
  if (!passwordExpiresAt) return null

  const now = Math.floor(Date.now() / 1000)
  const secondsUntilExpiry = passwordExpiresAt - now

  if (secondsUntilExpiry <= 0) return 0

  return Math.ceil(secondsUntilExpiry / (24 * 60 * 60))
}

// ============================================================================
// Password Change Enforcement
// ============================================================================

export interface PasswordChangeRequirement {
  required: boolean
  reason: string
  daysUntilExpiry: number | null
}

/**
 * Check if admin needs to change password
 */
export function checkPasswordChangeRequired(
  lastPasswordChange: number | null,
  passwordExpiresAt: number | null
): PasswordChangeRequirement {
  // Never set password
  if (!lastPasswordChange) {
    return {
      required: true,
      reason: 'Initial password change required',
      daysUntilExpiry: null,
    }
  }

  // Password expired
  const isExpired = isPasswordExpiredForAdmin(lastPasswordChange, passwordExpiresAt)
  if (isExpired) {
    return {
      required: true,
      reason: 'Password has expired',
      daysUntilExpiry: 0,
    }
  }

  // Password expiring soon (warning)
  const daysLeft = getDaysUntilExpiry(passwordExpiresAt)
  if (daysLeft !== null && daysLeft <= 7) {
    return {
      required: false,
      reason: `Password expires in ${daysLeft} day(s)`,
      daysUntilExpiry: daysLeft,
    }
  }

  return {
    required: false,
    reason: 'Password is current',
    daysUntilExpiry: daysLeft,
  }
}

// ============================================================================
// Temporary Password Generation
// ============================================================================

/**
 * Generate temporary password for new admins
 */
export function generateTemporaryPassword(): string {
  return generateSecurePassword(16)
}

/**
 * Validate password change request
 */
export async function validatePasswordChange(
  adminId: number,
  currentPassword: string,
  newPassword: string,
  currentPasswordHash: string
): Promise<PasswordValidationResult> {
  const errors: string[] = []

  // Verify current password
  const isCurrentValid = await verifyPassword(currentPassword, currentPasswordHash)
  if (!isCurrentValid) {
    errors.push('Current password is incorrect')
    return { valid: false, errors }
  }

  // Check complexity
  const complexityCheck = validatePasswordComplexity(newPassword)
  if (!complexityCheck.valid) {
    errors.push(...complexityCheck.errors)
  }

  // Check password reuse
  const isReused = await checkPasswordReuse(adminId, newPassword)
  if (isReused) {
    errors.push(
      `Cannot reuse any of your last ${DEFAULT_ADMIN_PASSWORD_POLICY.reuseHistory} passwords`
    )
  }

  // Check if new password is same as current
  if (currentPassword === newPassword) {
    errors.push('New password must be different from current password')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Password Reset Token Generation
// ============================================================================

export interface PasswordResetToken {
  token: string
  expiresAt: number
  adminId: number
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(adminId: number): PasswordResetToken {
  const token = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours

  return {
    token,
    expiresAt,
    adminId,
  }
}

/**
 * Validate password reset token
 */
export function isPasswordResetTokenValid(token: PasswordResetToken): boolean {
  const now = Math.floor(Date.now() / 1000)
  return token.expiresAt > now
}

// ============================================================================
// Export password policy utilities
// ============================================================================

export const PasswordPolicy = {
  validate: validatePasswordComplexity,
  isComplex: isPasswordComplexEnough,
  generate: generateSecurePassword,
  hash: hashPassword,
  verify: verifyPassword,
  checkReuse: checkPasswordReuse,
  recordChange: recordPasswordChange,
  isExpired: isPasswordExpiredForAdmin,
  checkChangeRequired: checkPasswordChangeRequired,
  generateTemporary: generateTemporaryPassword,
  validateChange: validatePasswordChange,
  generateResetToken: generatePasswordResetToken,
  isResetTokenValid: isPasswordResetTokenValid,
}

