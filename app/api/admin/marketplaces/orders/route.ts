/**
 * Admin Marketplace Orders API
 * GET /api/admin/marketplaces/orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { getMarketplaceOrders } from '@/lib/db/marketplaces'
import type { MarketplaceOrderFilters } from '@/lib/types/marketplace'

const ALLOWED_STATUSES = new Set([
  'pending',
  'acknowledged',
  'processing',
  'shipped',
  'cancelled',
  'closed',
])

function sanitizeDateParam(value: string | null): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date parameter')
  }
  return parsed.toISOString()
}

function parsePositiveInt(value: string | null, min: number, max: number, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid numeric parameter')
  }
  return Math.min(Math.max(Math.floor(parsed), min), max)
}

export async function GET(request: NextRequest) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.READ_ONLY, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const filters: MarketplaceOrderFilters = {}

    const channelId = searchParams.get('channelId')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    let from: string | undefined
    let to: string | undefined
    const search = searchParams.get('search')
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')

    if (channelId) filters.channelId = channelId.trim()
    if (platform === 'amazon' || platform === 'ebay' || platform === 'walmart') {
      filters.platform = platform
    }
    if (status && status !== 'all') {
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ error: 'Invalid order status filter.' }, { status: 400 })
      }
      filters.status = status as any
    }
    try {
      from = sanitizeDateParam(searchParams.get('from'))
      to = sanitizeDateParam(searchParams.get('to'))
    } catch (dateError: any) {
      return NextResponse.json(
        { error: dateError?.message || 'Invalid date parameter.' },
        { status: 400 }
      )
    }
    if (from) filters.from = from
    if (to) filters.to = to
    if (search) filters.search = search.trim()

    let pageSize = 25
    let page = 1
    try {
      pageSize = parsePositiveInt(pageSizeParam, 1, 100, 25)
      page = parsePositiveInt(pageParam, 1, Number.MAX_SAFE_INTEGER, 1)
    } catch (numberError: any) {
      return NextResponse.json(
        { error: numberError?.message || 'Invalid pagination parameter.' },
        { status: 400 }
      )
    }

    filters.limit = pageSize
    filters.offset = (page - 1) * pageSize

    const orders = getMarketplaceOrders(filters)

    return NextResponse.json({
      success: true,
      ...orders,
    })
  } catch (error: any) {
    console.error('Error fetching marketplace orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load marketplace orders.' },
      { status: 500 }
    )
  }
}


