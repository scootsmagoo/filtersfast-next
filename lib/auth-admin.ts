/**
 * Admin Authorization Utilities
 * Database-backed role and permission system
 * NOTE: These functions should only be called server-side (API routes, server components)
 */

import type { NextRequest } from 'next/server'
import { auth } from './auth'
import { 
  getAdminByUserId, 
  getEffectivePermissions, 
  hasPermission as dbHasPermission,
  PERMISSION_LEVEL,
  updateAdminLastLogin,
  type AdminWithDetails
} from './db/admin-roles'

/**
 * Check if a user is an admin
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) {
    return false;
  }
  
  try {
    const admin = getAdminByUserId(userId)
    return admin !== null && admin.is_enabled === 1
  } catch (error) {
    console.error('[isAdmin] Error checking admin status')
    return false
  }
}

/**
 * Check if a user has admin access
 * Returns true if user is logged in AND is an admin
 */
export function hasAdminAccess(user: { id?: string } | null | undefined): boolean {
  if (!user?.id) return false
  return isAdmin(user.id)
}

/**
 * Get admin details for a user
 */
export function getAdminDetails(userId: string): AdminWithDetails | null {
  try {
    return getAdminByUserId(userId)
  } catch (error) {
    console.error('Error getting admin details:', error)
    return null
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(
  userId: string,
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY
): boolean {
  try {
    const admin = getAdminByUserId(userId)
    if (!admin || admin.is_enabled !== 1) return false
    
    return dbHasPermission(admin.id, permissionName, requiredLevel)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for an admin user
 */
export function getAdminPermissions(userId: string): Map<string, number> {
  try {
    const admin = getAdminByUserId(userId)
    if (!admin || admin.is_enabled !== 1) return new Map()
    
    return getEffectivePermissions(admin.id)
  } catch (error) {
    console.error('Error getting admin permissions:', error)
    return new Map()
  }
}

/**
 * Check if admin requires 2FA
 */
export function requires2FA(userId: string): boolean {
  try {
    const admin = getAdminByUserId(userId)
    return admin?.require_2fa === 1
  } catch (error) {
    console.error('Error checking 2FA requirement:', error)
    return true // Fail secure - require 2FA if error
  }
}

/**
 * Check if admin password is expired
 */
export function isPasswordExpired(userId: string): boolean {
  try {
    const admin = getAdminByUserId(userId)
    if (!admin?.password_expires_at) return false
    
    const now = Math.floor(Date.now() / 1000)
    return admin.password_expires_at < now
  } catch (error) {
    console.error('Error checking password expiry:', error)
    return false
  }
}

/**
 * Update admin last login timestamp
 */
export function recordAdminLogin(userId: string): void {
  try {
    const admin = getAdminByUserId(userId)
    if (admin) {
      updateAdminLastLogin(admin.id)
    }
  } catch (error) {
    console.error('Error recording admin login:', error)
  }
}

/**
 * Require an authenticated admin session for API routes / server actions.
 * Returns session information when valid, otherwise null.
 */
type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

export interface AdminAuthSession {
  session: BetterAuthSession
  user: NonNullable<BetterAuthSession['user']>
  admin: AdminWithDetails
}

export async function requireAdminAuth(
  request?: NextRequest
): Promise<AdminAuthSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: request?.headers ?? new Headers()
    })

    if (!session?.user) {
      return null
    }

    if (!hasAdminAccess(session.user)) {
      return null
    }

    const adminDetails = getAdminDetails(session.user.id)
    if (!adminDetails || adminDetails.is_enabled !== 1) {
      return null
    }

    return {
      session,
      user: session.user,
      admin: adminDetails
    }
  } catch (error) {
    console.error('[requireAdminAuth] Failed to verify admin session', error)
    return null
  }
}

// Re-export permission levels for convenience
export { PERMISSION_LEVEL } from './db/admin-roles'

