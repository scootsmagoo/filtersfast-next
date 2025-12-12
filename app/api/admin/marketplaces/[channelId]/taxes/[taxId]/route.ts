/**
 * Admin Marketplace Tax State Delete API
 * DELETE /api/admin/marketplaces/:channelId/taxes/:taxId
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { removeMarketplaceTaxState } from '@/lib/db/marketplaces'

interface RouteContext {
  params: {
    channelId: string
    taxId: string
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const check = await verifyPermission('Marketplaces', PERMISSION_LEVEL.FULL_CONTROL, request)

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    )
  }

  try {
    const taxId = Number(context.params.taxId)
    if (!Number.isInteger(taxId) || taxId <= 0) {
      return NextResponse.json(
        { error: 'Invalid tax state ID.' },
        { status: 400 }
      )
    }

    removeMarketplaceTaxState(taxId)

    return NextResponse.json({
      success: true,
      deletedId: taxId,
    })
  } catch (error: any) {
    console.error('Error removing marketplace tax state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove tax state.' },
      { status: 500 }
    )
  }
}


