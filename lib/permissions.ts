/**
 * Permission checking utilities for API routes
 * Provides simplified permission checking interface
 */

import { NextRequest } from 'next/server';
import { verifyPermission, PERMISSION_LEVEL } from './admin-permissions';

export interface PermissionResult {
  authorized: boolean;
  message?: string;
  user?: any;
  admin?: any;
}

/**
 * Check if user has required permission
 * Simplified interface for API route handlers
 * 
 * @param request - Next.js request object
 * @param permissionName - Name of the permission to check (e.g., 'inventory', 'products')
 * @param accessType - Type of access: 'read' or 'write'
 * @returns PermissionResult with authorized status and user/admin data
 */
export async function checkPermission(
  request: NextRequest,
  permissionName: string,
  accessType: 'read' | 'write' = 'read'
): Promise<PermissionResult> {
  try {
    // Determine required permission level based on access type
    const requiredLevel = accessType === 'read' 
      ? PERMISSION_LEVEL.READ_ONLY 
      : PERMISSION_LEVEL.FULL_CONTROL;

    // Use the existing verifyPermission function
    const check = await verifyPermission(permissionName, requiredLevel, request);

    if (!check.authorized) {
      return {
        authorized: false,
        message: check.error || `Missing required permission: ${permissionName}`,
        user: check.user,
        admin: check.admin,
      };
    }

    return {
      authorized: true,
      user: check.user,
      admin: check.admin,
    };
  } catch (error) {
    console.error('[checkPermission] Error checking permission:', error);
    return {
      authorized: false,
      message: 'Permission check failed',
    };
  }
}

// Export permission levels for convenience
export { PERMISSION_LEVEL } from './admin-permissions';

