/**
 * Admin Promo Code Management API
 * GET /api/admin/promo-codes - List all promo codes
 * POST /api/admin/promo-codes - Create new promo code
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  createPromoCode,
  getAllActivePromoCodes
} from '@/lib/db/promo-codes'
import { PromoCode } from '@/lib/types/promo'

/**
 * Get all promo codes (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: Check if user is admin
    // For now, all authenticated users can view
    
    const promoCodes = getAllActivePromoCodes()
    
    return NextResponse.json({ promoCodes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

/**
 * Create new promo code (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // TODO: Check if user is admin
    
    const body = await req.json()
    
    // Validate required fields
    if (!body.code || !body.description || !body.discountType || 
        body.discountValue === undefined || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create promo code
    const promoCode = createPromoCode({
      code: body.code,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount,
      maxDiscount: body.maxDiscount,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      usageLimit: body.usageLimit,
      perCustomerLimit: body.perCustomerLimit,
      applicableProducts: body.applicableProducts,
      applicableCategories: body.applicableCategories,
      firstTimeOnly: body.firstTimeOnly ?? false,
      active: body.active ?? true
    })
    
    return NextResponse.json({ 
      success: true,
      promoCode 
    })
  } catch (error: any) {
    console.error('Error creating promo code:', error)
    
    if (error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    )
  }
}

