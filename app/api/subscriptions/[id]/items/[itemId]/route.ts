/**
 * Remove Subscription Item API
 * DELETE /api/subscriptions/[id]/items/[itemId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscriptionMock,
  removeSubscriptionItemMock
} from '@/lib/db/subscriptions-mock'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    
    const removed = removeSubscriptionItemMock(params.itemId)
    
    if (!removed) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
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

