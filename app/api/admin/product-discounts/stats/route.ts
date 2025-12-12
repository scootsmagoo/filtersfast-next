/**
 * Product Discounts Statistics API
 * Get statistics about product discounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProductDiscountStats } from '@/lib/db/product-discounts'
import { verifyAdmin } from '@/lib/admin-permissions'

/**
 * GET /api/admin/product-discounts/stats
 * Get product discount statistics
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const stats = getProductDiscountStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching product discount stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product discount stats' },
      { status: 500 }
    )
  }
}

