/**
 * Admin Permissions API
 * Endpoints for retrieving permission definitions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllPermissions, getPermissionsByGroup, PERMISSION_LEVEL } from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/permissions
 * Get all available permissions
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const grouped = searchParams.get('grouped') === 'true'
      
      let permissions
      if (grouped) {
        permissions = getPermissionsByGroup()
      } else {
        permissions = getAllPermissions()
      }
      
      await logAdminAction({
        action: 'admin.permissions.list',
        resource: 'admin_permissions'
      }, 'success', undefined, request)
      
      return NextResponse.json({ permissions })
    } catch (error: any) {
      console.error('Error fetching permissions:', error)
      
      await logAdminAction({
        action: 'admin.permissions.list',
        resource: 'admin_permissions'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      )
    }
  }
)

