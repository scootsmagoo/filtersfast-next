/**
 * Cancel Subscription API
 * POST /api/subscriptions/[id]/cancel
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscription,
  cancelSubscription
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
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }
    
    const body = await req.json().catch(() => ({}))
    // Sanitize cancellation reason
    const reason = body.reason ? sanitizeText(body.reason).slice(0, 500) : 'Customer requested cancellation'
    
    const cancelled = await cancelSubscription(id, reason)
    
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'An error occurred while cancelling subscription' },
      { status: 500 }
    )
  }
}




