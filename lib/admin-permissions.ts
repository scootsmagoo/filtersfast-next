/**
 * Admin Permission Middleware and Utilities
 * Provides permission checking for API routes and server actions
 */

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { hasAdminAccess, hasPermission, getAdminDetails, PERMISSION_LEVEL } from './auth-admin'
import { addAuditLog, ensurePermissionSeeded } from './db/admin-roles'

// Re-export PERMISSION_LEVEL for convenience
export { PERMISSION_LEVEL }

const PERMISSION_SEED_CONFIG: Record<string, {
  description: string
  group: string
  sortOrder: number
  roleDefaults: Record<string, number>
}> = {
  EmailCampaigns: {
    description: 'Manage marketing email campaigns',
    group: 'Marketing & Sales',
    sortOrder: 45,
    roleDefaults: {
      Admin: 1,
      Manager: 1,
      Support: 0,
      Sales: 0,
    },
  },
  Blog: {
    description: 'Manage blog posts and content',
    group: 'Content & Support',
    sortOrder: 52,
    roleDefaults: {
      Admin: 1,
      Manager: 1,
      Support: 0,
      Sales: 0,
    },
  },
  BackorderNotifications: {
    description: 'View and manage backorder notification requests',
    group: 'Products & Catalog',
    sortOrder: 35,
    roleDefaults: {
      Admin: 1,
      Manager: 1,
      Support: 0,
      Sales: -1,
    },
  },
}

// ============================================================================
// Types
// ============================================================================

export interface PermissionCheckResult {
  authorized: boolean
  user?: any
  admin?: any
  error?: string
}

export interface AuditLogContext {
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
}

// ============================================================================
// Permission Checking Utilities
// ============================================================================

/**
 * Verify user is authenticated admin
 */
export async function verifyAdmin(request?: NextRequest): Promise<PermissionCheckResult> {
  try {
    const session = request 
      ? await auth.api.getSession({ headers: request.headers })
      : await auth.api.getSession({ headers: new Headers() })

    if (!session?.user) {
      return { 
        authorized: false, 
        error: 'Not authenticated' 
      }
    }

    const isAdmin = hasAdminAccess(session.user)
    if (!isAdmin) {
      return { 
        authorized: false, 
        user: session.user,
        error: 'Not authorized as admin' 
      }
    }

    const adminDetails = getAdminDetails(session.user.id)
    if (!adminDetails) {
      return { 
        authorized: false, 
        user: session.user,
        error: 'Admin record not found' 
      }
    }

    return {
      authorized: true,
      user: session.user,
      admin: adminDetails
    }
  } catch (error) {
    console.error('Error verifying admin:', error)
    return { 
      authorized: false, 
      error: 'Verification failed' 
    }
  }
}

/**
 * Verify user has specific permission
 */
export async function verifyPermission(
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY,
  request?: NextRequest
): Promise<PermissionCheckResult> {
  // First verify they're an admin
  const adminCheck = await verifyAdmin(request)
  if (!adminCheck.authorized) {
    return adminCheck
  }

  const seedConfig = PERMISSION_SEED_CONFIG[permissionName]
  if (seedConfig) {
    ensurePermissionSeeded(
      permissionName,
      seedConfig.description,
      seedConfig.group,
      seedConfig.sortOrder,
      seedConfig.roleDefaults
    )
  }

  // Then check specific permission
  const hasPerm = hasPermission(adminCheck.user!.id, permissionName, requiredLevel)
  if (!hasPerm) {
    return {
      authorized: false,
      user: adminCheck.user,
      admin: adminCheck.admin,
      error: `Missing required permission: ${permissionName}`
    }
  }

  return adminCheck
}

/**
 * Verify user is admin OR has specific permission
 * Used for endpoints that should work for general admins but also check specific permissions
 */
export async function verifyAdminOrPermission(
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY,
  request?: NextRequest
): Promise<PermissionCheckResult> {
  const result = await verifyAdmin(request)
  if (!result.authorized) return result

  // If they're an admin, check the permission
  const hasPerm = hasPermission(result.user!.id, permissionName, requiredLevel)
  
  return {
    ...result,
    authorized: hasPerm
  }
}

// ============================================================================
// Middleware Wrappers for API Routes
// ============================================================================

/**
 * Wrap API route handler with admin authentication
 */
export function requireAdmin<T = any>(
  handler: (request: NextRequest, context: { user: any; admin: any }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const check = await verifyAdmin(request)
    
    if (!check.authorized) {
      return NextResponse.json(
        { error: check.error || 'Unauthorized' },
        { status: check.user ? 403 : 401 }
      )
    }

    return handler(request, { user: check.user!, admin: check.admin! })
  }
}

/**
 * Wrap API route handler with specific permission check
 */
export function requirePermission<T = any>(
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY
) {
  return (
    handler: (request: NextRequest, context: { user: any; admin: any }) => Promise<NextResponse<T>>
  ) => {
    return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
      try {
        const check = await verifyPermission(permissionName, requiredLevel, request)
        
        if (!check.authorized) {
          return NextResponse.json(
            { error: check.error || 'Unauthorized' },
            { status: check.user ? 403 : 401 }
          ) as NextResponse<T>
        }

        return handler(request, { user: check.user!, admin: check.admin!, ...context })
      } catch (error: any) {
        console.error('[requirePermission] Error in permission check');
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        ) as NextResponse<T>
      }
    }
  }
}

// ============================================================================
// Audit Logging Helpers
// ============================================================================

/**
 * Log admin action to audit log
 */
export async function logAdminAction(
  context: AuditLogContext,
  status: 'success' | 'failure' = 'success',
  error?: string,
  request?: NextRequest
): Promise<void> {
  try {
    const check = await verifyAdmin(request)
    
    const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || request?.headers.get('x-real-ip')
      || 'unknown'
    
    const userAgent = request?.headers.get('user-agent') || 'unknown'
    
    addAuditLog({
      admin_id: check.admin?.id || null,
      user_id: check.user?.id || null,
      action: context.action,
      resource: context.resource || null,
      resource_id: context.resourceId || null,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: context.details ? JSON.stringify(context.details) : null,
      error: error || null
    })
  } catch (err) {
    console.error('[logAdminAction] Failed to log admin action');
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Wrap handler with automatic audit logging
 */
export function withAuditLog<T = any>(
  auditContext: AuditLogContext,
  handler: (request: NextRequest, context: { user: any; admin: any }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context: { user: any; admin: any }): Promise<NextResponse<T>> => {
    try {
      const response = await handler(request, context)
      
      // Log success if response is OK (2xx)
      if (response.status >= 200 && response.status < 300) {
        await logAdminAction(auditContext, 'success', undefined, request)
      } else {
        await logAdminAction(auditContext, 'failure', `Status: ${response.status}`, request)
      }
      
      return response
    } catch (error: any) {
      // Log failure
      await logAdminAction(auditContext, 'failure', error.message, request)
      throw error
    }
  }
}

/**
 * Combine permission check with audit logging
 */
export function requirePermissionWithAudit<T = any>(
  permissionName: string,
  requiredLevel: number,
  auditAction: string,
  auditResource?: string
) {
  return (
    handler: (request: NextRequest, context: { user: any; admin: any }) => Promise<NextResponse<T>>
  ) => {
    return requirePermission<T>(permissionName, requiredLevel)(
      withAuditLog<T>(
        { action: auditAction, resource: auditResource },
        handler
      )
    )
  }
}

// ============================================================================
// Helper Functions for Common Checks
// ============================================================================

/**
 * Check if request is for read-only access
 */
export function isReadOnlyRequest(request: NextRequest): boolean {
  return request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS'
}

/**
 * Get required permission level based on HTTP method
 */
export function getRequiredLevelForMethod(method: string): number {
  switch (method) {
    case 'GET':
    case 'HEAD':
    case 'OPTIONS':
      return PERMISSION_LEVEL.READ_ONLY
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return PERMISSION_LEVEL.FULL_CONTROL
    default:
      return PERMISSION_LEVEL.FULL_CONTROL
  }
}

/**
 * Create a permission checker that automatically determines level from method
 */
export function requirePermissionByMethod<T = any>(permissionName: string) {
  return (
    handler: (request: NextRequest, context: { user: any; admin: any }) => Promise<NextResponse<T>>
  ) => {
    return async (request: NextRequest): Promise<NextResponse<T>> => {
      const requiredLevel = getRequiredLevelForMethod(request.method)
      const check = await verifyPermission(permissionName, requiredLevel, request)
      
      if (!check.authorized) {
        return NextResponse.json(
          { error: check.error || 'Unauthorized' },
          { status: check.user ? 403 : 401 }
        )
      }

      return handler(request, { user: check.user!, admin: check.admin! })
    }
  }
}

// ============================================================================
// Server Action Helpers
// ============================================================================

/**
 * Verify admin for server actions (no request object)
 */
export async function verifyAdminAction(): Promise<PermissionCheckResult> {
  return verifyAdmin()
}

/**
 * Verify permission for server actions (no request object)
 */
export async function verifyPermissionAction(
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY
): Promise<PermissionCheckResult> {
  return verifyPermission(permissionName, requiredLevel)
}

/**
 * Throw error if not authorized (for server actions)
 */
export async function requireAdminAction(): Promise<{ user: any; admin: any }> {
  const check = await verifyAdminAction()
  
  if (!check.authorized) {
    throw new Error(check.error || 'Unauthorized')
  }
  
  return { user: check.user!, admin: check.admin! }
}

/**
 * Throw error if missing permission (for server actions)
 */
export async function requirePermissionAction(
  permissionName: string,
  requiredLevel: number = PERMISSION_LEVEL.READ_ONLY
): Promise<{ user: any; admin: any }> {
  const check = await verifyPermissionAction(permissionName, requiredLevel)
  
  if (!check.authorized) {
    throw new Error(check.error || 'Unauthorized')
  }
  
  return { user: check.user!, admin: check.admin! }
}

