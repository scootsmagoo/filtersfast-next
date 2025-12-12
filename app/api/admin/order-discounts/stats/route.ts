/**
 * Order Discounts Statistics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrderDiscountStats } from '@/lib/db/order-discounts'
import { verifyAdmin } from '@/lib/admin-permissions'

/**
 * GET /api/admin/order-discounts/stats
 * Get order discount statistics
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const stats = getOrderDiscountStats()

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Error fetching order discount stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order discount stats' },
      { status: 500 }
    )
  }
}

