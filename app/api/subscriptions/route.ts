/**
 * Subscriptions API
 * GET /api/subscriptions - Get customer's subscriptions
 * POST /api/subscriptions - Create new subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getCustomerSubscriptionsMock,
  getSubscriptionItemsMock,
  createSubscriptionMock
} from '@/lib/db/subscriptions-mock'
import { CreateSubscriptionRequest } from '@/lib/types/subscription'

// Use mock data for now
const USE_MOCK_DATA = true

/**
 * Get customer's subscriptions
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
    
    // Get subscriptions with items
    const subscriptions = getCustomerSubscriptionsMock(session.user.id)
    
    const subscriptionsWithItems = subscriptions.map(sub => ({
      ...sub,
      items: getSubscriptionItemsMock(sub.id)
    }))
    
    return NextResponse.json({ subscriptions: subscriptionsWithItems })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * Create new subscription
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
    
    const body = await req.json() as CreateSubscriptionRequest
    
    // Validate
    if (!body.frequency || body.frequency < 1 || body.frequency > 12) {
      return NextResponse.json(
        { error: 'Frequency must be between 1 and 12 months' },
        { status: 400 }
      )
    }
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }
    
    // Create subscription
    const subscription = createSubscriptionMock(
      session.user.id,
      body.frequency,
      body.items
    )
    
    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription created successfully!'
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

