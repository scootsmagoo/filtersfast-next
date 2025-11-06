/**
 * Order Discounts API
 * Endpoints for managing order discounts
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderDiscounts,
  createOrderDiscount,
  getOrderDiscountStats,
  deleteOrderDiscounts,
  type CreateOrderDiscountRequest,
} from '@/lib/db/order-discounts'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/order-discounts
 * Get order discounts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Sanitize and validate inputs
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')
    const page = rawPage && !isNaN(parseInt(rawPage)) && parseInt(rawPage) > 0 
      ? parseInt(rawPage) 
      : 1
    const limit = rawLimit && !isNaN(parseInt(rawLimit)) && parseInt(rawLimit) > 0 && parseInt(rawLimit) <= 100
      ? parseInt(rawLimit)
      : 25
    
    const statusParam = searchParams.get('status')
    const onceOnlyParam = searchParams.get('onceOnly')
    const sortFieldParam = searchParams.get('sortField')

    const filters = {
      disc_status: statusParam && ['A', 'I', 'U', 'all'].includes(statusParam)
        ? (statusParam as 'A' | 'I' | 'U' | 'all')
        : 'all' as const,
      disc_once_only: onceOnlyParam && ['Y', 'N', 'all'].includes(onceOnlyParam)
        ? (onceOnlyParam as 'Y' | 'N' | 'all')
        : 'all' as const,
      sortField: sortFieldParam && ['disc_code', 'disc_valid_from'].includes(sortFieldParam)
        ? (sortFieldParam as 'disc_code' | 'disc_valid_from')
        : 'disc_code' as const,
      search: searchParams.get('search') ? sanitizeText(searchParams.get('search')!) : undefined,
      page,
      limit,
    }

    const result = getOrderDiscounts(filters)

    await logAdminAction({
      action: 'admin.order_discounts.list',
      resource: 'order_discounts',
      details: { filters },
    }, 'success', undefined, request)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching order discounts')
    return NextResponse.json(
      { error: 'Failed to fetch order discounts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/order-discounts
 * Create a new order discount
 */
export async function POST(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
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

    // Validation
    if (!disc_code || !disc_from_amt || !disc_to_amt || !disc_status || !disc_once_only || !disc_valid_from || !disc_valid_to) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate that either disc_perc or disc_amt is provided
    if ((disc_perc === null || disc_perc === undefined) && (disc_amt === null || disc_amt === undefined)) {
      return NextResponse.json(
        { error: 'Either discount percentage or discount amount must be provided' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedCode = sanitizeText(disc_code).toUpperCase().trim()
    
    // Validate code format (no spaces, quotes, or special characters)
    if (/[\s'"`]/.test(sanitizedCode)) {
      return NextResponse.json(
        { error: 'Discount code cannot contain spaces, quotes, or special characters' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    const parsedFromAmt = parseFloat(disc_from_amt)
    const parsedToAmt = parseFloat(disc_to_amt)
    if (isNaN(parsedFromAmt) || parsedFromAmt < 0) {
      return NextResponse.json(
        { error: 'Invalid order amount from value' },
        { status: 400 }
      )
    }
    if (isNaN(parsedToAmt) || parsedToAmt < 0) {
      return NextResponse.json(
        { error: 'Invalid order amount to value' },
        { status: 400 }
      )
    }
    if (parsedToAmt < parsedFromAmt) {
      return NextResponse.json(
        { error: 'Maximum order amount must be greater than or equal to minimum order amount' },
        { status: 400 }
      )
    }

    // Validate percentage or amount
    let parsedPerc: number | null = null
    let parsedAmt: number | null = null

    if (disc_perc !== null && disc_perc !== undefined) {
      parsedPerc = parseFloat(disc_perc)
      if (isNaN(parsedPerc) || parsedPerc <= 0 || parsedPerc > 100) {
        return NextResponse.json(
          { error: 'Discount percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    if (disc_amt !== null && disc_amt !== undefined) {
      parsedAmt = parseFloat(disc_amt)
      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        return NextResponse.json(
          { error: 'Discount amount must be greater than 0' },
          { status: 400 }
        )
      }
      if (parsedAmt > parsedToAmt) {
        return NextResponse.json(
          { error: 'Discount amount cannot be greater than maximum order amount' },
          { status: 400 }
        )
      }
    }

    // Validate status
    if (!['A', 'I', 'U'].includes(disc_status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be A (Active), I (Inactive), or U (Used)' },
        { status: 400 }
      )
    }

    // Validate once only
    if (!['Y', 'N'].includes(disc_once_only)) {
      return NextResponse.json(
        { error: 'Invalid once only value. Must be Y (Yes) or N (No)' },
        { status: 400 }
      )
    }

    // Validate date format (YYYYMMDD)
    if (!/^\d{8}$/.test(disc_valid_from)) {
      return NextResponse.json(
        { error: 'Invalid valid from date format. Expected YYYYMMDD' },
        { status: 400 }
      )
    }
    if (!/^\d{8}$/.test(disc_valid_to)) {
      return NextResponse.json(
        { error: 'Invalid valid to date format. Expected YYYYMMDD' },
        { status: 400 }
      )
    }
    if (disc_valid_to < disc_valid_from) {
      return NextResponse.json(
        { error: 'Valid to date must be greater than or equal to valid from date' },
        { status: 400 }
      )
    }

    const discountData: CreateOrderDiscountRequest = {
      disc_code: sanitizedCode,
      disc_perc: parsedPerc,
      disc_amt: parsedAmt,
      disc_from_amt: parsedFromAmt,
      disc_to_amt: parsedToAmt,
      disc_status: disc_status as 'A' | 'I' | 'U',
      disc_once_only: disc_once_only as 'Y' | 'N',
      disc_valid_from: disc_valid_from,
      disc_valid_to: disc_valid_to,
    }

    const discount = createOrderDiscount(discountData)

    await logAdminAction({
      action: 'admin.order_discounts.create',
      resource: 'order_discounts',
      resourceId: discount.id.toString(),
      details: { disc_code: sanitizedCode, disc_status, disc_once_only },
    }, 'success', undefined, request)

    return NextResponse.json({ discount }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order discount')
    // Return user-friendly error message without exposing internal details
    const errorMessage = error.message && !error.message.includes('Database error')
      ? error.message
      : 'Failed to create order discount'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/order-discounts
 * Delete multiple order discounts
 */
export async function DELETE(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing ids parameter' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').map(id => {
      const parsed = parseInt(id.trim())
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid ID: ${id}`)
      }
      return parsed
    })

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No valid IDs provided' },
        { status: 400 }
      )
    }

    const deletedCount = deleteOrderDiscounts(ids)

    await logAdminAction({
      action: 'admin.order_discounts.delete',
      resource: 'order_discounts',
      details: { ids, deletedCount },
    }, 'success', undefined, request)

    return NextResponse.json({ 
      message: `Deleted ${deletedCount} order discount(s)`,
      deletedCount 
    })
  } catch (error: any) {
    console.error('Error deleting order discounts')
    return NextResponse.json(
      { error: 'Failed to delete order discounts' },
      { status: 500 }
    )
  }
}

