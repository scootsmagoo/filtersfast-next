/**
 * Order Credit API (by ID)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderCreditById,
  updateOrderCredit,
  deleteOrderCredit,
  type UpdateOrderCreditRequest,
} from '@/lib/db/order-credits'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/order-credits/[id]
 * Get order credit by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid credit ID' }, { status: 400 })
    }

    const credit = getOrderCreditById(id)
    if (!credit) {
      return NextResponse.json({ error: 'Credit not found' }, { status: 404 })
    }

    return NextResponse.json({ credit })
  } catch (error: any) {
    console.error('Error fetching order credit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order credit' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/order-credits/[id]
 * Update order credit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid credit ID' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: UpdateOrderCreditRequest = {}

    // Validate and sanitize status
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'success', 'failed', 'cancelled']
      if (validStatuses.includes(body.status)) {
        updateData.status = body.status
      } else {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
    }
    
    // Sanitize status_code, response, and note
    if (body.status_code !== undefined) {
      updateData.status_code = body.status_code ? sanitizeText(body.status_code) : null
    }
    if (body.response !== undefined) {
      updateData.response = body.response ? sanitizeText(body.response) : null
    }
    if (body.note !== undefined) {
      updateData.note = body.note ? sanitizeText(body.note) : null
    }

    const credit = updateOrderCredit(id, updateData)
    if (!credit) {
      return NextResponse.json({ error: 'Credit not found' }, { status: 404 })
    }

    await logAdminAction({
      action: 'admin.order_credits.update',
      resource: 'order_credits',
      resourceId: id.toString(),
      details: updateData,
    }, 'success', undefined, request)

    return NextResponse.json({ credit })
  } catch (error: any) {
    console.error('Error updating order credit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order credit' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/order-credits/[id]
 * Delete order credit (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid credit ID' }, { status: 400 })
    }

    const deleted = deleteOrderCredit(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Credit not found' }, { status: 404 })
    }

    await logAdminAction({
      action: 'admin.order_credits.delete',
      resource: 'order_credits',
      resourceId: id.toString(),
    }, 'success', undefined, request)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting order credit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete order credit' },
      { status: 500 }
    )
  }
}

