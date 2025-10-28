/**
 * Individual Subscription API
 * GET /api/subscriptions/[id] - Get subscription details
 * PATCH /api/subscriptions/[id] - Update subscription
 * DELETE /api/subscriptions/[id] - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscriptionMock,
  getSubscriptionSummaryMock,
  updateSubscriptionMock
} from '@/lib/db/subscriptions-mock'

/**
 * Get subscription details
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
    const summary = getSubscriptionSummaryMock(id)
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }
    
    // Verify ownership
    if (summary.subscription.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ subscription: summary })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

/**
 * Update subscription
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
    const subscription = getSubscriptionMock(id)
    
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
    
    const body = await req.json()
    
    // Validate frequency if being updated
    if (body.frequency && (body.frequency < 1 || body.frequency > 12)) {
      return NextResponse.json(
        { error: 'Frequency must be between 1 and 12 months' },
        { status: 400 }
      )
    }
    
    const updated = updateSubscriptionMock(id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
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




