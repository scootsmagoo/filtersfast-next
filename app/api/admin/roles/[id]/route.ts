/**
 * Admin Role Detail API
 * Endpoints for managing specific role
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getRoleById, 
  updateRole, 
  deleteRole,
  getRolePermissions,
  setRolePermission,
  clearRolePermissions,
  PERMISSION_LEVEL
} from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/roles/[id]
 * Get role by ID with permissions
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest, context: any) => {
    try {
      const params = await context.params
      const roleId = parseInt(params.id)
      
      if (isNaN(roleId)) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        )
      }
      
      const role = getRoleById(roleId)
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }
      
      const permissions = getRolePermissions(roleId)
      
      await logAdminAction({
        action: 'admin.roles.view',
        resource: 'admin_roles',
        resourceId: roleId.toString()
      }, 'success', undefined, request)
      
      return NextResponse.json({ role, permissions })
    } catch (error: any) {
      console.error('Error fetching role:', error)
      
      await logAdminAction({
        action: 'admin.roles.view',
        resource: 'admin_roles',
        resourceId: params.id
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to fetch role' },
        { status: 500 }
      )
    }
  }
)

/**
 * PATCH /api/admin/roles/[id]
 * Update role and permissions
 */
export const PATCH = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, context: any) => {
    try {
      const params = await context.params
      const roleId = parseInt(params.id)
      
      if (isNaN(roleId)) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        )
      }
      
      const body = await request.json()
      const { name, description, permissions } = body
      
      // Update role details if provided
      if (name) {
        const updated = updateRole(roleId, name, description)
        
        if (!updated) {
          return NextResponse.json(
            { error: 'Failed to update role' },
            { status: 500 }
          )
        }
      }
      
      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Clear existing permissions
        clearRolePermissions(roleId)
        
        // Set new permissions
        for (const perm of permissions) {
          if (perm.level !== undefined && perm.level !== -1) {
            setRolePermission(roleId, perm.permissionId, perm.level)
          }
        }
      }
      
      const role = getRoleById(roleId)
      const updatedPermissions = getRolePermissions(roleId)
      
      await logAdminAction({
        action: 'admin.roles.update',
        resource: 'admin_roles',
        resourceId: roleId.toString(),
        details: { name, description }
      }, 'success', undefined, request)
      
      return NextResponse.json({ role, permissions: updatedPermissions })
    } catch (error: any) {
      console.error('Error updating role:', error)
      
      await logAdminAction({
        action: 'admin.roles.update',
        resource: 'admin_roles',
        resourceId: params.id
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }
  }
)

/**
 * DELETE /api/admin/roles/[id]
 * Delete role
 */
export const DELETE = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, context: any) => {
    try {
      const params = await context.params
      const roleId = parseInt(params.id)
      
      if (isNaN(roleId)) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        )
      }
      
      const deleted = deleteRole(roleId)
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete role' },
          { status: 500 }
        )
      }
      
      await logAdminAction({
        action: 'admin.roles.delete',
        resource: 'admin_roles',
        resourceId: roleId.toString()
      }, 'success', undefined, request)
      
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting role:', error)
      
      await logAdminAction({
        action: 'admin.roles.delete',
        resource: 'admin_roles',
        resourceId: params.id
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: error.message || 'Failed to delete role' },
        { status: 500 }
      )
    }
  }
)

