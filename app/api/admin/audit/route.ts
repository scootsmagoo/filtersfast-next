/**
 * Admin Audit Log API
 * Endpoints for retrieving audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, clearOldAuditLogs, PERMISSION_LEVEL } from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/audit
 * Get audit logs with optional filters
 */
export const GET = requirePermission('AuditLog', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      
      const filters = {
        admin_id: searchParams.get('adminId') ? parseInt(searchParams.get('adminId')!) : undefined,
        action: searchParams.get('action') || undefined,
        resource: searchParams.get('resource') || undefined,
        status: searchParams.get('status') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
      }
      
      const logs = getAuditLogs(filters)
      
      // Don't log audit log views to avoid infinite recursion
      
      return NextResponse.json({ logs, count: logs.length })
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }
  }
)

/**
 * DELETE /api/admin/audit
 * Clear old audit logs
 */
export const DELETE = requirePermission('AuditLog', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const daysAgo = searchParams.get('daysAgo') ? parseInt(searchParams.get('daysAgo')!) : 90
      
      const deletedCount = clearOldAuditLogs(daysAgo)
      
      await logAdminAction({
        action: 'admin.audit.clear',
        resource: 'admin_audit_log',
        details: { daysAgo, deletedCount }
      }, 'success', undefined, request)
      
      return NextResponse.json({ deletedCount })
    } catch (error: any) {
      console.error('Error clearing audit logs:', error)
      
      await logAdminAction({
        action: 'admin.audit.clear',
        resource: 'admin_audit_log'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to clear audit logs' },
        { status: 500 }
      )
    }
  }
)

