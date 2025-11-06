/**
 * Product Discounts API Routes
 * CRUD operations for product-level discounts
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getProductDiscounts,
  createProductDiscount,
  getProductDiscountStats,
  deleteProductDiscounts,
} from '@/lib/db/product-discounts'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/product-discounts
 * List product discounts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters = {
      disc_status: (searchParams.get('status') as 'A' | 'I' | 'all') || 'all',
      target_type:
        (searchParams.get('targetType') as
          | 'global'
          | 'product'
          | 'category'
          | 'product_type'
          | 'all') || 'all',
      search: searchParams.get('search') || undefined,
      sortField:
        (searchParams.get('sortField') as 'disc_code' | 'disc_valid_from' | 'created_at') ||
        'disc_valid_from',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    }

    const result = getProductDiscounts(filters)

    // Log audit event
    await logAdminAction(
      {
        action: 'admin.product_discounts.list',
        resource: 'product_discounts',
        details: { filters },
      },
      'success',
      undefined,
      request
    )

    return NextResponse.json({
      success: true,
      discounts: result.discounts,
      total: result.total,
      totalPages: result.totalPages,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    })
  } catch (error: any) {
    console.error('Error fetching product discounts:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to fetch product discounts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/product-discounts
 * Create a new product discount
 */
export async function POST(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.disc_code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }
    if (!body.disc_type || !['percentage', 'amount'].includes(body.disc_type)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "amount"' },
        { status: 400 }
      )
    }
    if (!body.target_type) {
      return NextResponse.json({ error: 'Target type is required' }, { status: 400 })
    }
    if (!body.disc_valid_from || !body.disc_valid_to) {
      return NextResponse.json(
        { error: 'Valid from and valid to dates are required' },
        { status: 400 }
      )
    }

    // Validate discount value
    if (body.disc_type === 'percentage') {
      if (!body.disc_perc || body.disc_perc < 0 || body.disc_perc > 100) {
        return NextResponse.json(
          { error: 'Percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
    } else {
      if (!body.disc_amt || body.disc_amt < 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }
    }

    // Validate target
    if (body.target_type === 'product' || body.target_type === 'category') {
      if (!body.target_id || body.target_id <= 0) {
        return NextResponse.json(
          { error: 'Target ID is required for product/category discounts' },
          { status: 400 }
        )
      }
    }
    if (body.target_type === 'product_type') {
      if (!body.target_product_type) {
        return NextResponse.json(
          { error: 'Product type is required for product_type discounts' },
          { status: 400 }
        )
      }
    }

    // Validate and sanitize discount code
    if (body.disc_code.length > 20) {
      return NextResponse.json({ error: 'Discount code must be 20 characters or less' }, { status: 400 })
    }
    if (!/^[A-Z0-9_-]+$/.test(body.disc_code.toUpperCase())) {
      return NextResponse.json(
        { error: 'Discount code can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }
    const sanitizedCode = sanitizeText(body.disc_code).toUpperCase().trim()

    // Validate date format (YYYYMMDD)
    if (!/^\d{8}$/.test(body.disc_valid_from) || !/^\d{8}$/.test(body.disc_valid_to)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYYMMDD' }, { status: 400 })
    }

    // Validate date range
    if (body.disc_valid_from > body.disc_valid_to) {
      return NextResponse.json(
        { error: 'Valid from date must be before or equal to valid to date' },
        { status: 400 }
      )
    }

    // Validate amount range
    const fromAmt = parseFloat(body.disc_from_amt) || 0
    const toAmt = parseFloat(body.disc_to_amt) || 9999.99
    if (fromAmt < 0 || toAmt < 0) {
      return NextResponse.json({ error: 'Cart amounts must be non-negative' }, { status: 400 })
    }
    if (fromAmt > toAmt) {
      return NextResponse.json(
        { error: 'Minimum cart amount must be less than or equal to maximum cart amount' },
        { status: 400 }
      )
    }

    // Validate target_product_type if provided
    if (body.target_product_type) {
      const validTypes = ['fridge', 'water', 'air', 'humidifier', 'pool']
      if (!validTypes.includes(body.target_product_type)) {
        return NextResponse.json(
          { error: 'Invalid product type. Must be one of: fridge, water, air, humidifier, pool' },
          { status: 400 }
        )
      }
    }

    const discount = createProductDiscount(
      {
        disc_code: sanitizedCode,
        disc_type: body.disc_type,
        disc_perc: body.disc_type === 'percentage' ? body.disc_perc : null,
        disc_amt: body.disc_type === 'amount' ? body.disc_amt : null,
        target_type: body.target_type,
        target_id: body.target_id || null,
        target_product_type: body.target_product_type || null,
        disc_from_amt: fromAmt,
        disc_to_amt: toAmt,
        disc_status: body.disc_status || 'A',
        disc_valid_from: body.disc_valid_from,
        disc_valid_to: body.disc_valid_to,
        disc_free_shipping: body.disc_free_shipping || false,
        disc_multi_by_qty: body.disc_multi_by_qty || false,
        disc_once_only: body.disc_once_only || false,
        disc_compoundable: body.disc_compoundable || false,
        disc_allow_on_forms: body.disc_allow_on_forms !== false,
        disc_notes: body.disc_notes ? sanitizeText(body.disc_notes) : null,
      },
      check.user?.email || check.user?.name || 'system'
    )

    // Log audit event
    await logAdminAction(
      {
        action: 'admin.product_discounts.create',
        resource: 'product_discounts',
        resourceId: discount.id.toString(),
        details: { disc_code: discount.disc_code },
      },
      'success',
      undefined,
      request
    )

    return NextResponse.json({ success: true, discount }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product discount:', error)
    // Return user-friendly error messages for validation errors, generic for others
    if (error.message && (error.message.includes('already exists') || error.message.includes('must be'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create product discount' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/admin/product-discounts
 * Delete multiple product discounts
 */
export async function DELETE(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ error: 'IDs parameter is required' }, { status: 400 })
    }

    // Validate and sanitize IDs
    const ids = idsParam
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0)

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 })
    }

    // Limit bulk delete to prevent abuse
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Cannot delete more than 100 discounts at once' },
        { status: 400 }
      )
    }

    const deletedCount = deleteProductDiscounts(ids)

    // Log audit event
    await logAdminAction(
      {
        action: 'admin.product_discounts.delete',
        resource: 'product_discounts',
        details: { ids, deletedCount },
      },
      'success',
      undefined,
      request
    )

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} product discount(s)`,
    })
  } catch (error: any) {
    console.error('Error deleting product discounts:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to delete product discounts' },
      { status: 500 }
    )
  }
}

