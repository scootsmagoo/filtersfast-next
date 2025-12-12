import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/auth-admin'
import { listGiftCards, adjustGiftCardBalance, voidGiftCard, reactivateGiftCard } from '@/lib/db/gift-cards'
import { rateLimit } from '@/lib/rate-limit-admin'
import { z } from 'zod'

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 300,
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 30)
    }

    const { searchParams } = new URL(request.url)

    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.getAll('status') || undefined,
      email: searchParams.get('email') || undefined,
      minBalance: searchParams.get('minBalance') ? parseFloat(searchParams.get('minBalance') as string) : undefined,
      maxBalance: searchParams.get('maxBalance') ? parseFloat(searchParams.get('maxBalance') as string) : undefined,
      dateFrom: searchParams.get('dateFrom') ? Date.parse(searchParams.get('dateFrom') as string) : undefined,
      dateTo: searchParams.get('dateTo') ? Date.parse(searchParams.get('dateTo') as string) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : undefined,
    }

    const giftCards = listGiftCards(filters)

    return NextResponse.json({
      success: true,
      ...giftCards,
    })
  } catch (error) {
    console.error('Error listing gift cards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load gift cards' },
      { status: 500 }
    )
  }
}

const adjustSchema = z.object({
  amount: z.number().finite(),
  note: z.string().max(500).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 20)
    }

    const { searchParams } = new URL(request.url)
    const giftCardId = searchParams.get('id')

    if (!giftCardId) {
      return NextResponse.json({ success: false, error: 'Gift card id is required' }, { status: 400 })
    }

    const body = await request.json()
    const result = adjustSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', issues: result.error.flatten() }, { status: 400 })
    }

    const updated = adjustGiftCardBalance(giftCardId, result.data.amount, result.data.note || '', {
      id: session.user.id,
      name: session.user.name || 'Admin',
    })

    return NextResponse.json({ success: true, giftCard: updated })
  } catch (error) {
    console.error('Error adjusting gift card:', error)
    return NextResponse.json({ success: false, error: 'Failed to adjust gift card' }, { status: 500 })
  }
}

const statusSchema = z.object({
  action: z.enum(['void', 'reactivate']),
  balance: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const giftCardId = body.id as string | undefined
    if (!giftCardId) {
      return NextResponse.json({ success: false, error: 'Gift card id is required' }, { status: 400 })
    }

    let updated
    if (parsed.data.action === 'void') {
      updated = voidGiftCard(giftCardId, { id: session.user.id, name: session.user.name || 'Admin' })
    } else {
      const balance = parsed.data.balance
      if (balance === undefined || balance <= 0) {
        return NextResponse.json(
          { success: false, error: 'A positive balance is required to reactivate a gift card.' },
          { status: 400 }
        )
      }
      updated = reactivateGiftCard(giftCardId, balance, { id: session.user.id, name: session.user.name || 'Admin' })
    }

    return NextResponse.json({ success: true, giftCard: updated })
  } catch (error) {
    console.error('Error updating gift card status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update gift card status' },
      { status: 500 }
    )
  }
}

