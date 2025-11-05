/**
 * Individual Subscription API
 * GET /api/subscriptions/[id] - Get subscription details
 * PATCH /api/subscriptions/[id] - Update subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscription,
  getSubscriptionItems,
  updateSubscription
} from '@/lib/db/subscriptions'
import { UpdateSubscriptionRequest } from '@/lib/types/subscription'

/**
 * Get subscription details with items
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Get items
    const items = await getSubscriptionItems(id)
    
    return NextResponse.json({
      subscription: {
        ...subscription,
        items
      }
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

/**
 * Update subscription (frequency, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const body = await req.json() as UpdateSubscriptionRequest
    
    // Validate frequency if provided
    if (body.frequency !== undefined) {
      if (body.frequency < 1 || body.frequency > 12) {
        return NextResponse.json(
          { error: 'Frequency must be between 1 and 12 months' },
          { status: 400 }
        )
      }
    }
    
    const updated = await updateSubscription(id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }
    
    // Get updated subscription
    const updatedSubscription = await getSubscription(id)
    const items = await getSubscriptionItems(id)
    
    return NextResponse.json({
      success: true,
      subscription: {
        ...updatedSubscription,
        items
      },
      message: 'Subscription updated successfully'
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
