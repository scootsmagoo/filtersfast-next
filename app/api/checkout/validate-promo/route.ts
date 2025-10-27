/**
 * Validate Promo Code API
 * POST /api/checkout/validate-promo
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/promo-validation'
import { PromoCodeRequest } from '@/lib/types/promo'

// Set to true to use mock data (no database required)
const USE_MOCK_DATA = true

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PromoCodeRequest
    
    // Validate required fields
    if (!body.code || !body.cartTotal || !Array.isArray(body.cartItems)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate promo code (with mock flag)
    const validation = validatePromoCode(body, USE_MOCK_DATA)
    
    if (validation.valid) {
      return NextResponse.json({
        valid: true,
        promoCode: validation.promoCode,
        discountAmount: validation.discountAmount
      })
    } else {
      return NextResponse.json({
        valid: false,
        error: validation.error,
        errorCode: validation.errorCode
      })
    }
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}

