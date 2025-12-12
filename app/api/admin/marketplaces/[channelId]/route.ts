/**
 * Admin Marketplace Channel API
 * GET /api/admin/marketplaces/:channelId
 * PATCH /api/admin/marketplaces/:channelId
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { getMarketplaceChannel, updateMarketplaceChannel } from '@/lib/db/marketplaces'

interface RouteContext {
  params: {
    channelId: string
  }
}

const ALLOWED_CHANNEL_STATUSES = new Set(['active', 'inactive', 'paused', 'error'])

export async function GET(request: NextRequest, context: RouteContext) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.READ_ONLY, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const channel = getMarketplaceChannel(context.params.channelId)
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      channel,
    })
  } catch (error: any) {
    console.error('Error loading marketplace channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load marketplace channel.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.FULL_CONTROL, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const channelId = context.params.channelId
    const payload = await request.json()

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const existing = getMarketplaceChannel(channelId)
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 })
    }

    const updates: any = {}

    if (typeof payload.name === 'string') {
      updates.name = payload.name.trim()
      if (updates.name.length === 0) {
        return NextResponse.json({ error: 'Channel name cannot be empty.' }, { status: 400 })
      }
    }

    if (typeof payload.status === 'string') {
      if (!ALLOWED_CHANNEL_STATUSES.has(payload.status)) {
        return NextResponse.json({ error: 'Invalid channel status.' }, { status: 400 })
      }
      updates.status = payload.status
    }

    if (payload.syncEnabled !== undefined) {
      updates.syncEnabled = Boolean(payload.syncEnabled)
    }

    if (payload.syncFrequencyMinutes !== undefined) {
      const freq = Number(payload.syncFrequencyMinutes)
      if (!Number.isFinite(freq) || freq < 5 || freq > 1440) {
        return NextResponse.json(
          { error: 'Sync frequency must be between 5 and 1440 minutes.' },
          { status: 400 }
        )
      }
      updates.syncFrequencyMinutes = Math.round(freq)
    }

    if (payload.credentials !== undefined) {
      if (payload.credentials && typeof payload.credentials !== 'object') {
        return NextResponse.json({ error: 'Credentials must be an object.' }, { status: 400 })
      }
      updates.credentials = payload.credentials ?? null
    }

    if (payload.settings !== undefined) {
      if (payload.settings && typeof payload.settings !== 'object') {
        return NextResponse.json({ error: 'Settings must be an object.' }, { status: 400 })
      }
      updates.settings = payload.settings ?? null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const updated = updateMarketplaceChannel(channelId, updates)

    return NextResponse.json({
      success: true,
      channel: updated,
    })
  } catch (error: any) {
    console.error('Error updating marketplace channel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update marketplace channel.' },
      { status: 500 }
    )
  }
}


