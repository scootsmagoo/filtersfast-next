/**
 * Debug Session Endpoint
 * Check current user's session and permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminByUserId, getEffectivePermissions } from '@/lib/db/admin-roles'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not logged in'
      })
    }

    const admin = getAdminByUserId(session.user.id)
    
    if (!admin) {
      return NextResponse.json({
        authenticated: true,
        isAdmin: false,
        user: session.user,
        message: 'User is not an admin'
      })
    }

    const permissions = getEffectivePermissions(admin.id)
    const permissionsObj: Record<string, number> = {}
    permissions.forEach((level, name) => {
      permissionsObj[name] = level
    })

    return NextResponse.json({
      authenticated: true,
      isAdmin: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      admin: {
        id: admin.id,
        role_name: admin.role_name,
        is_enabled: admin.is_enabled,
        require_2fa: admin.require_2fa
      },
      permissions: permissionsObj,
      hasInventoryPermission: permissionsObj['Inventory'] !== undefined && permissionsObj['Inventory'] >= 0
    })

  } catch (error: any) {
    console.error('[Debug Session] Error:', error)
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

