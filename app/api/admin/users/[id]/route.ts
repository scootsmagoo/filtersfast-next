/**
 * Admin User Detail API
 * Endpoints for managing specific admin user
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAdminById, 
  updateAdmin, 
  deleteAdmin,
  getUserPermissions,
  setUserPermission,
  removeUserPermission,
  PERMISSION_LEVEL
} from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/users/[id]
 * Get admin user by ID
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest, context: any) => {
    const params = await context.params
    const adminId = parseInt(params.id)
    
    try {
      if (isNaN(adminId)) {
        return NextResponse.json(
          { error: 'Invalid admin ID' },
          { status: 400 }
        )
      }
      
      const admin = getAdminById(adminId)
      
      if (!admin) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        )
      }
      
      // Get permission overrides
      const permissions = getUserPermissions(adminId)
      
      await logAdminAction({
        action: 'admin.users.view',
        resource: 'admin_users',
        resourceId: adminId.toString()
      }, 'success', undefined, request)
      
      return NextResponse.json({ admin, permissions })
    } catch (error: any) {
      console.error('[API] Error fetching admin user');
      
      await logAdminAction({
        action: 'admin.users.view',
        resource: 'admin_users',
        resourceId: adminId.toString()
      }, 'failure', 'Database error', request)
      
      return NextResponse.json(
        { error: 'Failed to fetch admin user' },
        { status: 500 }
      )
    }
  }
)

/**
 * PATCH /api/admin/users/[id]
 * Update admin user
 */
export const PATCH = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, context: any) => {
    try {
      const params = await context.params
      const adminId = parseInt(params.id)
      
      if (isNaN(adminId)) {
        return NextResponse.json(
          { error: 'Invalid admin ID' },
          { status: 400 }
        )
      }
      
      const body = await request.json()
      const { roleId, salesCodeId, isEnabled, require2fa, permissions } = body
      
      // Update admin record
      const updated = updateAdmin(adminId, {
        role_id: roleId,
        sales_code_id: salesCodeId,
        is_enabled: isEnabled,
        require_2fa: require2fa
      })
      
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update admin' },
          { status: 500 }
        )
      }
      
      // Update permission overrides if provided
      if (permissions && Array.isArray(permissions)) {
        for (const perm of permissions) {
          if (perm.level === -1 || perm.level === undefined) {
            // Remove permission override
            removeUserPermission(adminId, perm.permissionId)
          } else {
            // Set permission override
            setUserPermission(adminId, perm.permissionId, perm.level)
          }
        }
      }
      
      const admin = getAdminById(adminId)
      
      await logAdminAction({
        action: 'admin.users.update',
        resource: 'admin_users',
        resourceId: adminId.toString(),
        details: { roleId, salesCodeId, isEnabled, require2fa }
      }, 'success', undefined, request)
      
      return NextResponse.json({ admin })
    } catch (error: any) {
      console.error('Error updating admin:', error)
      
      await logAdminAction({
        action: 'admin.users.update',
        resource: 'admin_users',
        resourceId: params.id
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to update admin user' },
        { status: 500 }
      )
    }
  }
)

/**
 * DELETE /api/admin/users/[id]
 * Delete (disable) admin user
 */
export const DELETE = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, context: any) => {
    try {
      const params = await context.params
      const adminId = parseInt(params.id)
      
      if (isNaN(adminId)) {
        return NextResponse.json(
          { error: 'Invalid admin ID' },
          { status: 400 }
        )
      }
      
      const deleted = deleteAdmin(adminId)
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete admin' },
          { status: 500 }
        )
      }
      
      await logAdminAction({
        action: 'admin.users.delete',
        resource: 'admin_users',
        resourceId: adminId.toString()
      }, 'success', undefined, request)
      
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting admin:', error)
      
      await logAdminAction({
        action: 'admin.users.delete',
        resource: 'admin_users',
        resourceId: params.id
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to delete admin user' },
        { status: 500 }
      )
    }
  }
)

