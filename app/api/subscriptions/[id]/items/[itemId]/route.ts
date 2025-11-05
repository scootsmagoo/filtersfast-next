/**
 * Individual Subscription Item API
 * DELETE /api/subscriptions/[id]/items/[itemId] - Remove item from subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscription,
  removeSubscriptionItem
} from '@/lib/db/subscriptions'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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
    
    const { id, itemId } = await params
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
        { error: 'Cannot remove items from cancelled subscription' },
        { status: 400 }
      )
    }
    
    // Remove item
    const removed = await removeSubscriptionItem(itemId)
    
    if (!removed) {
      return NextResponse.json(
        { error: 'Failed to remove item' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item removed from subscription'
    })
  } catch (error) {
    console.error('Error removing subscription item:', error)
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    )
  }
}
