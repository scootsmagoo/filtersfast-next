/**
 * Failed Logins API
 * Endpoints for viewing failed login attempts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFailedLogins, clearOldFailedLogins, PERMISSION_LEVEL } from '@/lib/db/admin-roles'
import { requirePermission } from '@/lib/admin-permissions'

/**
 * GET /api/admin/failed-logins
 * Get failed login attempts
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
      const email = searchParams.get('email') || undefined
      
      const failedLogins = getFailedLogins(limit, email)
      
      return NextResponse.json({ failedLogins, count: failedLogins.length })
    } catch (error: any) {
      console.error('Error fetching failed logins:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch failed login attempts' },
        { status: 500 }
      )
    }
  }
)

/**
 * DELETE /api/admin/failed-logins
 * Clear old failed login records
 */
export const DELETE = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const daysAgo = searchParams.get('daysAgo') ? parseInt(searchParams.get('daysAgo')!) : 30
      
      const deletedCount = clearOldFailedLogins(daysAgo)
      
      return NextResponse.json({ deletedCount })
    } catch (error: any) {
      console.error('Error clearing failed logins:', error)
      
      return NextResponse.json(
        { error: 'Failed to clear failed login records' },
        { status: 500 }
      )
    }
  }
)

