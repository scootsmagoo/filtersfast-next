/**
 * Pause Subscription API
 * POST /api/subscriptions/[id]/pause
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscriptionMock,
  pauseSubscriptionMock
} from '@/lib/db/subscriptions-mock'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    const subscription = getSubscriptionMock(params.id)
    
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
    
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be paused' },
        { status: 400 }
      )
    }
    
    const body = await req.json().catch(() => ({}))
    const pausedUntil = body.pausedUntil ? new Date(body.pausedUntil) : undefined
    
    const paused = pauseSubscriptionMock(params.id, pausedUntil)
    
    if (!paused) {
      return NextResponse.json(
        { error: 'Failed to pause subscription' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: pausedUntil 
        ? `Subscription paused until ${pausedUntil.toLocaleDateString()}`
        : 'Subscription paused indefinitely'
    })
  } catch (error) {
    console.error('Error pausing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to pause subscription' },
      { status: 500 }
    )
  }
}

