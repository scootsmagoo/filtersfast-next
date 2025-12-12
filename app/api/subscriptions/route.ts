/**
 * Subscriptions API
 * GET /api/subscriptions - Get customer's subscriptions
 * POST /api/subscriptions - Create new subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getCustomerSubscriptions,
  getSubscriptionItems,
  createSubscription
} from '@/lib/db/subscriptions'
import { CreateSubscriptionRequest } from '@/lib/types/subscription'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit'

/**
 * Get customer's subscriptions
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.generous)
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString()
          }
        }
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
    
    // Get subscriptions with items
    const subscriptions = await getCustomerSubscriptions(session.user.id)
    
    const subscriptionsWithItems = await Promise.all(
      subscriptions.map(async (sub) => ({
        ...sub,
        items: await getSubscriptionItems(sub.id)
      }))
    )
    
    return NextResponse.json({ subscriptions: subscriptionsWithItems })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    // Don't expose internal error details
    return NextResponse.json(
      { error: 'An error occurred while fetching subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * Create new subscription
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - strict for creation
    const identifier = getClientIdentifier(req)
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict)
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString()
          }
        }
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
    
    const body = await req.json() as CreateSubscriptionRequest
    
    // Input validation
    const frequency = parseInt(body.frequency as any)
    if (isNaN(frequency) || frequency < 1 || frequency > 12) {
      return NextResponse.json(
        { error: 'Frequency must be between 1 and 12 months' },
        { status: 400 }
      )
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Validate max items (prevent abuse)
    if (body.items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 items per subscription' },
        { status: 400 }
      )
    }
    
    // Sanitize item data
    const sanitizedItems = body.items.map(item => ({
      productId: sanitizeText(item.productId),
      productName: sanitizeText(item.productName),
      productImage: item.productImage ? sanitizeText(item.productImage) : undefined,
      quantity: Math.max(1, Math.min(99, parseInt(item.quantity as any) || 1)),
      price: parseFloat(item.price as any) || 0
    }))

    // Validate prices are positive
    if (sanitizedItems.some(item => item.price <= 0)) {
      return NextResponse.json(
        { error: 'Invalid item prices' },
        { status: 400 }
      )
    }
    
    // Create subscription
    const subscription = await createSubscription({
      customerId: session.user.id,
      frequency,
      items: sanitizedItems
    })
    
    // Get items for response
    const items = await getSubscriptionItems(subscription.id)
    
    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        items
      },
      message: 'Subscription created successfully!'
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'An error occurred while creating subscription' },
      { status: 500 }
    )
  }
}




