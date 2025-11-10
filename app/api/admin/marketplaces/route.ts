/**
 * Admin Marketplace Overview API
 * GET /api/admin/marketplaces
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import {
  getMarketplaceChannels,
  getMarketplaceSummary,
  getMarketplaceTrends,
  getMarketplaceTaxStates,
} from '@/lib/db/marketplaces'
import { getRecentMarketplaceSyncs } from '@/lib/marketplaces/sync'

function sanitizeDateParam(value: string | null): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date parameter')
  }
  return parsed.toISOString()
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
    let from: string | undefined
    let to: string | undefined

    try {
      from = sanitizeDateParam(searchParams.get('from'))
      to = sanitizeDateParam(searchParams.get('to'))
    } catch (dateError: any) {
      return NextResponse.json(
        { error: dateError?.message || 'Invalid date parameter.' },
        { status: 400 }
      )
    }

    const groupByParam = searchParams.get('groupBy')
    const groupBy =
      groupByParam === 'week' || groupByParam === 'month' || groupByParam === 'day'
        ? groupByParam
        : 'day'

    const channels = getMarketplaceChannels()
    const taxStates = getMarketplaceTaxStates()
    const summary = getMarketplaceSummary({ from, to })
    const trends = getMarketplaceTrends({ from, to, groupBy })
    const syncs = getRecentMarketplaceSyncs(10)

    return NextResponse.json({
      success: true,
      channels,
      taxStates,
      summary,
      trends,
      syncs,
      meta: {
        groupBy,
        filters: {
          from: from ?? null,
          to: to ?? null,
        },
      },
    })
  } catch (error: any) {
    console.error('Error loading marketplace summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load marketplace data.' },
      { status: 500 }
    )
  }
}


