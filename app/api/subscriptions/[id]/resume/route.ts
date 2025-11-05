/**
 * Resume Subscription API
 * POST /api/subscriptions/[id]/resume
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscription,
  resumeSubscription
} from '@/lib/db/subscriptions'
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
    
    if (subscription.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused subscriptions can be resumed' },
        { status: 400 }
      )
    }
    
    const resumed = await resumeSubscription(id)
    
    if (!resumed) {
      return NextResponse.json(
        { error: 'Failed to resume subscription' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully'
    })
  } catch (error) {
    console.error('Error resuming subscription:', error)
    return NextResponse.json(
      { error: 'An error occurred while resuming subscription' },
      { status: 500 }
    )
  }
}




