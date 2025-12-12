/**
 * Large Orders Report API
 * Endpoints for retrieving large orders above a threshold
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLargeOrders, type LargeOrdersFilters } from '@/lib/db/orders'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'

/**
 * GET /api/admin/orders/large
 * Get large orders report
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse and validate filters
    const rawMinTotal = searchParams.get('min_total')
    const parsedMinTotal = rawMinTotal ? parseFloat(rawMinTotal) : NaN
    const minTotal = !isNaN(parsedMinTotal) && parsedMinTotal > 0 && parsedMinTotal <= 1000000
      ? parsedMinTotal
      : 600

    const rawDateFrom = searchParams.get('date_from')
    let dateFrom: number
    if (rawDateFrom) {
      const parsedDate = new Date(rawDateFrom)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        )
      }
      dateFrom = parsedDate.getTime()
      // Prevent dates too far in the past (more than 10 years)
      const tenYearsAgo = Date.now() - 10 * 365 * 24 * 60 * 60 * 1000
      if (dateFrom < tenYearsAgo) {
        return NextResponse.json(
          { error: 'Start date too far in the past' },
          { status: 400 }
        )
      }
    } else {
      dateFrom = Date.now() - 7 * 24 * 60 * 60 * 1000 // Default: last 7 days
    }

    const rawDateTo = searchParams.get('date_to')
    let dateTo: number
    if (rawDateTo) {
      const parsedDate = new Date(rawDateTo)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        )
      }
      dateTo = parsedDate.getTime()
      // Prevent dates in the future
      const now = Date.now()
      if (dateTo > now) {
        dateTo = now
      }
    } else {
      dateTo = Date.now()
    }

    // Validate date range
    if (isNaN(dateFrom) || isNaN(dateTo) || dateFrom > dateTo) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      )
    }

    // Prevent date range too large (more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000
    if (dateTo - dateFrom > oneYear) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year' },
        { status: 400 }
      )
    }

    const filters: LargeOrdersFilters = {
      min_total: minTotal,
      date_from: dateFrom,
      date_to: dateTo,
    }

    const orders = getLargeOrders(filters)

    await logAdminAction({
      action: 'admin.orders.large_report',
      resource: 'orders',
      details: { filters, count: orders.length },
    }, 'success', undefined, request)

    return NextResponse.json({ orders, filters })
  } catch (error: any) {
    console.error('Error fetching large orders:', error)
    
    await logAdminAction({
      action: 'admin.orders.large_report',
      resource: 'orders',
      details: { error: error.message },
    }, 'failure', error.message, request).catch(() => {})

    return NextResponse.json(
      { error: error.message || 'Failed to fetch large orders' },
      { status: 500 }
    )
  }
}

