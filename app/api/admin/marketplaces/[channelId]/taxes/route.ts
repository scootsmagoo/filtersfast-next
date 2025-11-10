/**
 * Admin Marketplace Tax States API
 * GET /api/admin/marketplaces/:channelId/taxes
 * POST /api/admin/marketplaces/:channelId/taxes
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { addMarketplaceTaxState, getMarketplaceTaxStates } from '@/lib/db/marketplaces'

interface RouteContext {
  params: {
    channelId: string
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.READ_ONLY, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const states = getMarketplaceTaxStates(context.params.channelId)
    return NextResponse.json({
      success: true,
      states,
    })
  } catch (error: any) {
    console.error('Error fetching marketplace tax states:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load tax states.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.FULL_CONTROL, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const payload = await request.json()
    const stateCode = typeof payload?.stateCode === 'string' ? payload.stateCode.trim().toUpperCase() : ''

    if (!/^[A-Z]{2,3}$/.test(stateCode)) {
      return NextResponse.json(
        { error: 'State code must be 2-3 alphabetic characters.' },
        { status: 400 }
      )
    }

    try {
      const state = addMarketplaceTaxState(context.params.channelId, stateCode)

      return NextResponse.json({
        success: true,
        state,
      })
    } catch (dbError: any) {
      if (dbError?.message?.includes('Marketplace channel not found')) {
        return NextResponse.json({ error: 'Channel not found.' }, { status: 404 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error adding marketplace tax state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add tax state.' },
      { status: 500 }
    )
  }
}


