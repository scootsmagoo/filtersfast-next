/**
 * Product Discount API Routes (Single)
 * Get, update, and delete individual product discounts
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getProductDiscountById,
  updateProductDiscount,
  deleteProductDiscounts,
} from '@/lib/db/product-discounts'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { sanitizeText } from '@/lib/sanitize'

/**
 * GET /api/admin/product-discounts/[id]
 * Get a single product discount by ID
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
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })
    }

    const discount = getProductDiscountById(id)

    return NextResponse.json({
      success: true,
      discount,
    })
  } catch (error: any) {
    console.error('Error fetching product discount:', error)
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to fetch product discount' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/product-discounts/[id]
 * Update a product discount
 */
export async function PUT(
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
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })
    }

    const body = await request.json()

    // Validate discount type if provided
    if (body.disc_type && !['percentage', 'amount'].includes(body.disc_type)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "amount"' },
        { status: 400 }
      )
    }

    // Validate discount value if changing type
    if (body.disc_type === 'percentage') {
      if (body.disc_perc !== undefined && (body.disc_perc < 0 || body.disc_perc > 100)) {
        return NextResponse.json(
          { error: 'Percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
    } else if (body.disc_type === 'amount') {
      if (body.disc_amt !== undefined && body.disc_amt < 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }
    }

    // Validate and sanitize discount code if provided
    let sanitizedCode: string | undefined
    if (body.disc_code) {
      if (body.disc_code.length > 20) {
        return NextResponse.json({ error: 'Discount code must be 20 characters or less' }, { status: 400 })
      }
      if (!/^[A-Z0-9_-]+$/i.test(body.disc_code)) {
        return NextResponse.json(
          { error: 'Discount code can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        )
      }
      sanitizedCode = sanitizeText(body.disc_code).toUpperCase().trim()
    }

    // Validate date format if provided
    if (body.disc_valid_from && !/^\d{8}$/.test(body.disc_valid_from)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYYMMDD' }, { status: 400 })
    }
    if (body.disc_valid_to && !/^\d{8}$/.test(body.disc_valid_to)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYYMMDD' }, { status: 400 })
    }

    // Validate date range if both dates provided
    if (body.disc_valid_from && body.disc_valid_to && body.disc_valid_from > body.disc_valid_to) {
      return NextResponse.json(
        { error: 'Valid from date must be before or equal to valid to date' },
        { status: 400 }
      )
    }

    // Validate amount range if provided
    if (body.disc_from_amt !== undefined || body.disc_to_amt !== undefined) {
      const fromAmt = body.disc_from_amt !== undefined ? parseFloat(String(body.disc_from_amt)) : undefined
      const toAmt = body.disc_to_amt !== undefined ? parseFloat(String(body.disc_to_amt)) : undefined
      if (fromAmt !== undefined && fromAmt < 0) {
        return NextResponse.json({ error: 'Minimum cart amount must be non-negative' }, { status: 400 })
      }
      if (toAmt !== undefined && toAmt < 0) {
        return NextResponse.json({ error: 'Maximum cart amount must be non-negative' }, { status: 400 })
      }
      if (fromAmt !== undefined && toAmt !== undefined && fromAmt > toAmt) {
        return NextResponse.json(
          { error: 'Minimum cart amount must be less than or equal to maximum cart amount' },
          { status: 400 }
        )
      }
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

    const discount = updateProductDiscount(
      id,
      {
        disc_code: sanitizedCode,
        disc_type: body.disc_type,
        disc_perc: body.disc_perc,
        disc_amt: body.disc_amt,
        target_type: body.target_type,
        target_id: body.target_id,
        target_product_type: body.target_product_type,
        disc_from_amt: body.disc_from_amt,
        disc_to_amt: body.disc_to_amt,
        disc_status: body.disc_status,
        disc_valid_from: body.disc_valid_from,
        disc_valid_to: body.disc_valid_to,
        disc_free_shipping: body.disc_free_shipping,
        disc_multi_by_qty: body.disc_multi_by_qty,
        disc_once_only: body.disc_once_only,
        disc_compoundable: body.disc_compoundable,
        disc_allow_on_forms: body.disc_allow_on_forms,
        disc_notes: body.disc_notes ? sanitizeText(body.disc_notes) : undefined,
      },
      check.user?.email || check.user?.name || 'system'
    )

    // Log audit event
    await logAdminAction(
      {
        action: 'admin.product_discounts.update',
        resource: 'product_discounts',
        resourceId: id.toString(),
        details: { disc_code: discount.disc_code },
      },
      'success',
      undefined,
      request
    )

    return NextResponse.json({
      success: true,
      discount,
    })
  } catch (error: any) {
    console.error('Error updating product discount:', error)
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    // Return user-friendly error messages for validation errors, generic for others
    if (error.message && (error.message.includes('already exists') || error.message.includes('must be'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to update product discount' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/admin/product-discounts/[id]
 * Delete a product discount
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
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })
    }

    // Get discount before deleting for audit log
    const discount = getProductDiscountById(id)

    const deletedCount = deleteProductDiscounts([id])

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    // Log audit event
    await logAdminAction(
      {
        action: 'admin.product_discounts.delete',
        resource: 'product_discounts',
        resourceId: id.toString(),
        details: { disc_code: discount.disc_code },
      },
      'success',
      undefined,
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Product discount deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting product discount:', error)
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to delete product discount' },
      { status: 500 }
    )
  }
}

