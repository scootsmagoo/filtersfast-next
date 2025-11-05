/**
 * Subscription Items API
 * POST /api/subscriptions/[id]/items - Add item to subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscription,
  addSubscriptionItem
} from '@/lib/db/subscriptions'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict)
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    const subscription = await getSubscription(id)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }
    
    // Verify ownership
    if (subscription.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add items to cancelled subscription' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    
    // Validate and sanitize
    if (!body.productId || !body.productName || !body.quantity || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const quantity = parseInt(body.quantity)
    const price = parseFloat(body.price)

    if (isNaN(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }
    
    // Add item with sanitized data
    const item = await addSubscriptionItem(id, {
      productId: sanitizeText(body.productId),
      productName: sanitizeText(body.productName),
      productImage: body.productImage ? sanitizeText(body.productImage) : undefined,
      quantity,
      price
    })
    
    return NextResponse.json({
      success: true,
      item,
      message: 'Item added to subscription'
    })
  } catch (error) {
    console.error('Error adding subscription item:', error)
    return NextResponse.json(
      { error: 'An error occurred while adding item' },
      { status: 500 }
    )
  }
}




