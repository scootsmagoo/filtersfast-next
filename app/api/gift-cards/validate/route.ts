import { NextRequest, NextResponse } from 'next/server'
import { getGiftCardByCode } from '@/lib/db/gift-cards'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 200,
})

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous'
      await limiter.check(identifier, 30)
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many attempts. Please wait and try again.',
        error_code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    )
  }

  let body: { code?: string; orderTotal?: number } = {}

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body.',
        error_code: 'INVALID_JSON',
      },
      { status: 400 }
    )
  }

  const code = (body.code || '').trim()

  if (!code) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gift card code is required.',
        error_code: 'MISSING_CODE',
      },
      { status: 400 }
    )
  }

  const orderTotal = typeof body.orderTotal === 'number' && body.orderTotal > 0 ? body.orderTotal : undefined

  try {
    const giftCard = getGiftCardByCode(code)

    if (!giftCard) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gift card not found.',
          error_code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    if (giftCard.status === 'void') {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift card has been voided.',
          error_code: 'CARD_VOID',
        },
        { status: 410 }
      )
    }

    if (giftCard.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift card is scheduled for a future delivery date.',
          error_code: 'CARD_PENDING',
        },
        { status: 409 }
      )
    }

    if (giftCard.balance <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift card has no remaining balance.',
          error_code: 'NO_BALANCE',
        },
        { status: 410 }
      )
    }

    const amountApplicable = orderTotal ? Math.min(orderTotal, giftCard.balance) : giftCard.balance

    return NextResponse.json({
      success: true,
      giftCard: {
        code: giftCard.code,
        balance: giftCard.balance,
        currency: giftCard.currency,
        status: giftCard.status,
        amountApplicable,
      },
    })
  } catch (error) {
    console.error('Error validating gift card:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to validate gift card.',
        error_code: 'VALIDATION_FAILED',
      },
      { status: 500 }
    )
  }
}

