/**
 * Order Discount API (Individual)
 * Endpoints for managing a single order discount
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderDiscountById,
  updateOrderDiscount,
  deleteOrderDiscounts,
  type UpdateOrderDiscountRequest,
} from '@/lib/db/order-discounts'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/order-discounts/[id]
 * Get order discount by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid discount ID' },
        { status: 400 }
      )
    }

    try {
      const discount = getOrderDiscountById(id)
      
      if (!discount) {
        return NextResponse.json(
          { error: 'Order discount not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ discount })
    } catch (dbError: any) {
      // Log error without exposing sensitive details
      console.error('[GET] Database error occurred')
      return NextResponse.json(
        { error: 'Failed to fetch order discount' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    // Log error without exposing sensitive details
    console.error('[GET] Error in order discount API')
    return NextResponse.json(
      { error: 'Failed to fetch order discount' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/order-discounts/[id]
 * Update order discount
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid discount ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      disc_code,
      disc_perc,
      disc_amt,
      disc_from_amt,
      disc_to_amt,
      disc_status,
      disc_once_only,
      disc_valid_from,
      disc_valid_to,
    } = body

    const updates: UpdateOrderDiscountRequest = {}

    if (disc_code !== undefined) {
      const sanitizedCode = sanitizeText(disc_code).toUpperCase().trim()
      if (/[\s'"`]/.test(sanitizedCode)) {
        return NextResponse.json(
          { error: 'Discount code cannot contain spaces, quotes, or special characters' },
          { status: 400 }
        )
      }
      updates.disc_code = sanitizedCode
    }

    if (disc_perc !== undefined) {
      if (disc_perc === null) {
        updates.disc_perc = null
      } else {
        const parsed = parseFloat(disc_perc)
        if (isNaN(parsed) || parsed <= 0 || parsed > 100) {
          return NextResponse.json(
            { error: 'Discount percentage must be between 0 and 100' },
            { status: 400 }
          )
        }
        updates.disc_perc = parsed
      }
    }

    if (disc_amt !== undefined) {
      if (disc_amt === null) {
        updates.disc_amt = null
      } else {
        const parsed = parseFloat(disc_amt)
        if (isNaN(parsed) || parsed <= 0) {
          return NextResponse.json(
            { error: 'Discount amount must be greater than 0' },
            { status: 400 }
          )
        }
        updates.disc_amt = parsed
      }
    }

    if (disc_from_amt !== undefined) {
      const parsed = parseFloat(disc_from_amt)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Invalid order amount from value' },
          { status: 400 }
        )
      }
      updates.disc_from_amt = parsed
    }

    if (disc_to_amt !== undefined) {
      const parsed = parseFloat(disc_to_amt)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'Invalid order amount to value' },
          { status: 400 }
        )
      }
      updates.disc_to_amt = parsed
    }

    if (disc_status !== undefined) {
      if (!['A', 'I', 'U'].includes(disc_status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be A (Active), I (Inactive), or U (Used)' },
          { status: 400 }
        )
      }
      updates.disc_status = disc_status as 'A' | 'I' | 'U'
    }

    if (disc_once_only !== undefined) {
      if (!['Y', 'N'].includes(disc_once_only)) {
        return NextResponse.json(
          { error: 'Invalid once only value. Must be Y (Yes) or N (No)' },
          { status: 400 }
        )
      }
      updates.disc_once_only = disc_once_only as 'Y' | 'N'
    }

    if (disc_valid_from !== undefined) {
      if (!/^\d{8}$/.test(disc_valid_from)) {
        return NextResponse.json(
          { error: 'Invalid valid from date format. Expected YYYYMMDD' },
          { status: 400 }
        )
      }
      updates.disc_valid_from = disc_valid_from
    }

    if (disc_valid_to !== undefined) {
      if (!/^\d{8}$/.test(disc_valid_to)) {
        return NextResponse.json(
          { error: 'Invalid valid to date format. Expected YYYYMMDD' },
          { status: 400 }
        )
      }
      updates.disc_valid_to = disc_valid_to
    }

    const discount = updateOrderDiscount(id, updates)
    if (!discount) {
      return NextResponse.json(
        { error: 'Order discount not found' },
        { status: 404 }
      )
    }

    await logAdminAction({
      action: 'admin.order_discounts.update',
      resource: 'order_discounts',
      resourceId: id.toString(),
      details: updates,
    }, 'success', undefined, request)

    return NextResponse.json({ discount })
  } catch (error: any) {
    console.error('Error updating order discount')
    // Return user-friendly error message without exposing internal details
    const errorMessage = error.message && !error.message.includes('Database error')
      ? error.message
      : 'Failed to update order discount'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/order-discounts/[id]
 * Delete order discount
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid discount ID' },
        { status: 400 }
      )
    }

    const deletedCount = deleteOrderDiscounts([id])
    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'Order discount not found' },
        { status: 404 }
      )
    }

    await logAdminAction({
      action: 'admin.order_discounts.delete',
      resource: 'order_discounts',
      resourceId: id.toString(),
    }, 'success', undefined, request)

    return NextResponse.json({ 
      message: 'Order discount deleted successfully',
      deletedCount 
    })
  } catch (error: any) {
    console.error('Error deleting order discount')
    return NextResponse.json(
      { error: 'Failed to delete order discount' },
      { status: 500 }
    )
  }
}

