/**
 * Admin Roles Management API
 * Endpoints for managing admin roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  deleteRole,
  getRolePermissions,
  PERMISSION_LEVEL
} from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/roles
 * Get all roles with their permissions
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const roles = getAllRoles()
      
      // Include permissions for each role
      const rolesWithPermissions = roles.map(role => ({
        ...role,
        permissions: getRolePermissions(role.id)
      }))
      
      await logAdminAction({
        action: 'admin.roles.list',
        resource: 'admin_roles'
      }, 'success', undefined, request)
      
      return NextResponse.json({ roles: rolesWithPermissions })
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      
      await logAdminAction({
        action: 'admin.roles.list',
        resource: 'admin_roles'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }
  }
)

/**
 * POST /api/admin/roles
 * Create new role
 */
export const POST = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { name, description } = body
      
      if (!name) {
        return NextResponse.json(
          { error: 'Role name is required' },
          { status: 400 }
        )
      }
      
      const roleId = createRole(name, description)
      const role = getRoleById(roleId)
      
      await logAdminAction({
        action: 'admin.roles.create',
        resource: 'admin_roles',
        resourceId: roleId.toString(),
        details: { name, description }
      }, 'success', undefined, request)
      
      return NextResponse.json({ role }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating role:', error)
      
      await logAdminAction({
        action: 'admin.roles.create',
        resource: 'admin_roles'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: error.message || 'Failed to create role' },
        { status: 500 }
      )
    }
  }
)

