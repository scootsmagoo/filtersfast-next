/**
 * Admin Marketplace Manual Sync API
 * POST /api/admin/marketplaces/sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { syncMarketplaceOrders } from '@/lib/marketplaces/sync'
import type { MarketplacePlatform, MarketplaceSyncOptions } from '@/lib/types/marketplace'

function sanitizeDateParam(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName} parameter.`)
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName} parameter.`)
  }
  return parsed.toISOString()
}

export async function POST(request: NextRequest) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.FULL_CONTROL, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const payload = await request.json()
    const options: MarketplaceSyncOptions = {}

    if (payload?.channelId && typeof payload.channelId === 'string') {
      options.channelId = payload.channelId.trim()
    }

    if (
      payload?.platform &&
      typeof payload.platform === 'string' &&
      ['amazon', 'ebay', 'walmart'].includes(payload.platform)
    ) {
      options.platform = payload.platform as MarketplacePlatform
    }

    try {
      options.since = sanitizeDateParam(payload?.since, 'since')
      options.until = sanitizeDateParam(payload?.until, 'until')
    } catch (dateError: any) {
      return NextResponse.json(
        { error: dateError?.message || 'Invalid date parameter.' },
        { status: 400 }
      )
    }

    if (payload?.limit !== undefined) {
      const limit = Number(payload.limit)
      if (!Number.isFinite(limit) || limit <= 0 || limit > 250) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 250.' },
          { status: 400 }
        )
      }
      options.limit = Math.floor(limit)
    }

    const result = await syncMarketplaceOrders({ ...options, source: 'manual' })

    return NextResponse.json({
      success: result.success,
      totals: result.totals,
      runs: result.runs,
      message: result.message,
    })
  } catch (error: any) {
    console.error('Error running marketplace sync:', error)
    return NextResponse.json(
      { error: error.message || 'Marketplace sync failed.' },
      { status: 500 }
    )
  }
}


