/**
 * Sales Codes API
 * Endpoints for managing sales codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllSalesCodes, 
  getSalesCodeById, 
  createSalesCode, 
  updateSalesCode,
  PERMISSION_LEVEL
} from '@/lib/db/admin-roles'
import { requirePermission, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/sales-codes
 * Get all sales codes
 */
export const GET = requirePermission('Admins', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const activeOnly = searchParams.get('activeOnly') !== 'false'
      
      const salesCodes = getAllSalesCodes(activeOnly)
      
      await logAdminAction({
        action: 'admin.sales_codes.list',
        resource: 'sales_codes'
      }, 'success', undefined, request)
      
      return NextResponse.json({ salesCodes })
    } catch (error: any) {
      console.error('Error fetching sales codes:', error)
      
      await logAdminAction({
        action: 'admin.sales_codes.list',
        resource: 'sales_codes'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to fetch sales codes' },
        { status: 500 }
      )
    }
  }
)

/**
 * POST /api/admin/sales-codes
 * Create new sales code
 */
export const POST = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { code, name } = body
      
      if (!code || !name) {
        return NextResponse.json(
          { error: 'Code and name are required' },
          { status: 400 }
        )
      }
      
      const id = createSalesCode(code, name)
      const salesCode = getSalesCodeById(id)
      
      await logAdminAction({
        action: 'admin.sales_codes.create',
        resource: 'sales_codes',
        resourceId: id.toString(),
        details: { code, name }
      }, 'success', undefined, request)
      
      return NextResponse.json({ salesCode }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating sales code:', error)
      
      await logAdminAction({
        action: 'admin.sales_codes.create',
        resource: 'sales_codes'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: error.message || 'Failed to create sales code' },
        { status: 500 }
      )
    }
  }
)

/**
 * PATCH /api/admin/sales-codes/[id]
 * Update sales code
 */
export const PATCH = requirePermission('Admins', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = parseInt(searchParams.get('id') || '')
      
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid sales code ID' },
          { status: 400 }
        )
      }
      
      const body = await request.json()
      const { code, name, active } = body
      
      if (!code || !name) {
        return NextResponse.json(
          { error: 'Code and name are required' },
          { status: 400 }
        )
      }
      
      const updated = updateSalesCode(id, code, name, active !== false)
      
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update sales code' },
          { status: 500 }
        )
      }
      
      const salesCode = getSalesCodeById(id)
      
      await logAdminAction({
        action: 'admin.sales_codes.update',
        resource: 'sales_codes',
        resourceId: id.toString(),
        details: { code, name, active }
      }, 'success', undefined, request)
      
      return NextResponse.json({ salesCode })
    } catch (error: any) {
      console.error('Error updating sales code:', error)
      
      await logAdminAction({
        action: 'admin.sales_codes.update',
        resource: 'sales_codes'
      }, 'failure', error.message, request)
      
      return NextResponse.json(
        { error: 'Failed to update sales code' },
        { status: 500 }
      )
    }
  }
)

