import { NextRequest, NextResponse } from 'next/server'
import { getGiftCardBalance } from '@/lib/db/gift-cards'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 200,
})

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous'
      await limiter.check(identifier, 20)
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        error_code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    )
  }

  const code = request.nextUrl.searchParams.get('code') || ''
  const normalizedCode = code.trim()

  if (!normalizedCode) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gift card code is required.',
        error_code: 'MISSING_CODE',
      },
      { status: 400 }
    )
  }

  try {
    const balance = getGiftCardBalance(normalizedCode)

    if (!balance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gift card not found.',
          error_code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    if (balance.status === 'void') {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift card is no longer active.',
          error_code: 'CARD_VOID',
        },
        { status: 410 }
      )
    }

    if (balance.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift card is scheduled for a future delivery date.',
          error_code: 'CARD_PENDING',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        code: balance.code,
        balance: balance.balance,
        currency: balance.currency,
        status: balance.status,
        recipientName: balance.recipient_name,
        issuedAt: balance.issued_at,
        lastRedeemedAt: balance.last_redeemed_at,
      },
    })
  } catch (error) {
    console.error('Error checking gift card balance:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to look up gift card balance.',
        error_code: 'BALANCE_LOOKUP_FAILED',
      },
      { status: 500 }
    )
  }
}

