import { NextRequest, NextResponse } from 'next/server'
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions'
import { listReviews, type ReviewFilters } from '@/lib/db/reviews'
import { enqueueBackgroundJob } from '@/lib/background-jobs'
import { syncTrustpilotReviews } from '@/lib/services/trustpilot-sync'

export const dynamic = 'force-dynamic'

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function GET(request: NextRequest) {
  const permission = await verifyPermission('Reviews', PERMISSION_LEVEL.READ_ONLY, request)
  if (!permission.authorized) {
    return NextResponse.json({ success: false, error: permission.error || 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ratingParam = searchParams.get('rating')
  const hasReplyParam = searchParams.get('hasReply')
  const status = searchParams.get('status')
  const source = (searchParams.get('source') || 'all') as ReviewFilters['source']
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const filters: ReviewFilters = {
    search: searchParams.get('search') || undefined,
    source,
    limit,
    offset,
  }

  if (ratingParam) {
    const rating = parseInt(ratingParam, 10)
    if (rating >= 1 && rating <= 5) {
      filters.rating = rating
    }
  }

  if (status === 'pending') {
    filters.hasReply = false
  } else if (status === 'replied') {
    filters.hasReply = true
  } else if (hasReplyParam) {
    filters.hasReply = parseBoolean(hasReplyParam)
  }

  const { reviews, total } = listReviews(filters)

  return NextResponse.json({
    success: true,
    reviews,
    total,
  })
}

export async function POST(request: NextRequest) {
  const permission = await verifyPermission('Reviews', PERMISSION_LEVEL.MANAGE, request)
  if (!permission.authorized) {
    return NextResponse.json({ success: false, error: permission.error || 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // ignore; body is optional
  }

  const pages = typeof body.pages === 'number' ? body.pages : undefined
  const perPage = typeof body.perPage === 'number' ? body.perPage : undefined
  const includeImported =
    typeof body.includeImported === 'boolean' ? body.includeImported : undefined
  const skus =
    Array.isArray(body.productSkus) && body.productSkus.length > 0
      ? body.productSkus.map((sku: string) => String(sku))
      : undefined
  const runImmediately = body?.run === 'inline'

  if (runImmediately) {
    const result = await syncTrustpilotReviews({
      pages,
      perPage,
      productSkus: skus,
      includeImported,
      log: true,
    })

    return NextResponse.json({
      success: true,
      dispatched: false,
      result,
    })
  }

  enqueueBackgroundJob({
    id: `trustpilot-sync-${Date.now()}`,
    description: 'Sync Trustpilot reviews',
    run: async () => {
      await syncTrustpilotReviews({
        pages,
        perPage,
        productSkus: skus,
        includeImported,
        log: true,
      })
    },
  })

  return NextResponse.json({
    success: true,
    dispatched: true,
  })
}


