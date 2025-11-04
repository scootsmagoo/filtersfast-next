/**
 * Admin Users Management API
 * Endpoints for managing admin users
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllAdmins, 
  getAdminById, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin,
  PERMISSION_LEVEL
} from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'
import { auth } from '@/lib/auth'

/**
 * GET /api/admin/users
 * Get all admin users
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const includeDisabled = searchParams.get('includeDisabled') === 'true'
      
      const admins = getAllAdmins(includeDisabled)
      
      await logAdminAction({
        action: 'admin.users.list',
        resource: 'admin_users',
        details: { includeDisabled }
      }, 'success', undefined, request)
      
      return NextResponse.json({ admins })
    } catch (error: any) {
      console.error('Error fetching admins:', error)
      
      await logAdminAction({
        action: 'admin.users.list',
        resource: 'admin_users'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to fetch admin users' },
        { status: 500 }
      )
    }
  }
)

/**
 * POST /api/admin/users
 * Create new admin user
 */
export const POST = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { email, name, roleId, salesCodeId, require2fa } = body
      
      if (!email || !name || !roleId) {
        return NextResponse.json(
          { error: 'Missing required fields: email, name, roleId' },
          { status: 400 }
        )
      }
      
      // Check if user exists in better-auth
      let user = await auth.api.listUsers({ 
        query: { email } 
      })
      
      let userId: string
      
      // Validate and sanitize inputs
      const sanitizedEmail = email.trim().toLowerCase()
      const sanitizedName = name.trim().replace(/<[^>]*>/g, '') // Remove HTML tags
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      if (!user || user.length === 0) {
        // Create user in better-auth
        // Generate a cryptographically secure temporary password
        const tempPassword = crypto.randomUUID() + 'A1!@'
        
        const newUser = await auth.api.signUpEmail({
          email: sanitizedEmail,
          password: tempPassword,
          name: sanitizedName
        })
        
        userId = newUser.user.id
        
        // TODO: Send welcome email with password reset link
      } else {
        userId = user[0].id
      }
      
      // Create admin record
      const adminId = createAdmin({
        user_id: userId,
        role_id: roleId,
        sales_code_id: salesCodeId,
        require_2fa: require2fa !== false
      })
      
      const admin = getAdminById(adminId)
      
      await logAdminAction({
        action: 'admin.users.create',
        resource: 'admin_users',
        resourceId: adminId.toString(),
        details: { email, name, roleId }
      }, 'success', undefined, request)
      
      return NextResponse.json({ admin }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating admin:', error)
      
      await logAdminAction({
        action: 'admin.users.create',
        resource: 'admin_users'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: error.message || 'Failed to create admin user' },
        { status: 500 }
      )
    }
  }
)

