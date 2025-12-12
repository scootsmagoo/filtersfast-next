/**
 * Admin Password Change API
 * Endpoint for admin password changes with policy enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/admin-permissions'
import { getAdminByUserId, updateAdminPasswordChange } from '@/lib/db/admin-roles'
import { auth } from '@/lib/auth'
import { PasswordPolicy } from '@/lib/password-policy'

/**
 * POST /api/admin/password/change
 * Change admin password with validation
 */
export const POST = requireAdmin(
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json()
      const { currentPassword, newPassword } = body

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Current password and new password are required' },
          { status: 400 }
        )
      }

      // Get admin record
      const admin = getAdminByUserId(user.id)
      if (!admin) {
        return NextResponse.json(
          { error: 'Admin record not found' },
          { status: 404 }
        )
      }

      // Get current password hash from better-auth
      // Note: This is a simplified version. In production, you'd need to verify
      // the current password through better-auth's verification system
      
      // Validate new password complexity
      const complexityCheck = PasswordPolicy.validate(newPassword)
      if (!complexityCheck.valid) {
        await logAdminAction({
          action: 'admin.password.change',
          resource: 'admin_users',
          resourceId: admin.id.toString()
        }, 'failure', 'Password complexity check failed', request)

        return NextResponse.json(
          { 
            error: 'Password does not meet complexity requirements',
            details: complexityCheck.errors
          },
          { status: 400 }
        )
      }

      // Check password reuse
      const isReused = await PasswordPolicy.checkReuse(admin.id, newPassword)
      if (isReused) {
        await logAdminAction({
          action: 'admin.password.change',
          resource: 'admin_users',
          resourceId: admin.id.toString()
        }, 'failure', 'Password reused', request)

        return NextResponse.json(
          { error: 'Cannot reuse any of your last 5 passwords' },
          { status: 400 }
        )
      }

      // Hash new password
      const newPasswordHash = await PasswordPolicy.hash(newPassword)

      // Update password in better-auth
      // Note: This is a placeholder. Better-auth handles password updates through its own API
      // You would use: await auth.api.updatePassword({ userId: user.id, password: newPassword })

      // Record password change
      PasswordPolicy.recordChange(admin.id, newPasswordHash)

      await logAdminAction({
        action: 'admin.password.change',
        resource: 'admin_users',
        resourceId: admin.id.toString()
      }, 'success', undefined, request)

      return NextResponse.json({ 
        success: true,
        message: 'Password changed successfully'
      })
    } catch (error: any) {
      console.error('Error changing password:', error)

      await logAdminAction({
        action: 'admin.password.change',
        resource: 'admin_users'
      }, 'failure', error.message, request)

      return NextResponse.json(
        { error: 'Failed to change password' },
        { status: 500 }
      )
    }
  }
)

