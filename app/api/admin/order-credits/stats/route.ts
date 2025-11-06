/**
 * Order Credits Statistics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrderCreditStats } from '@/lib/db/order-credits'
import { verifyAdmin } from '@/lib/admin-permissions'

/**
 * GET /api/admin/order-credits/stats
 * Get order credit statistics
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const stats = getOrderCreditStats()

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Error fetching order credit stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

