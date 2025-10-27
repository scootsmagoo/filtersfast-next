/**
 * Subscription Items API
 * POST /api/subscriptions/[id]/items - Add item to subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getSubscriptionMock,
  addSubscriptionItemMock
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
    
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add items to cancelled subscription' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    
    // Validate
    if (!body.productId || !body.productName || !body.quantity || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Add item
    const item = addSubscriptionItemMock(params.id, {
      productId: body.productId,
      productName: body.productName,
      productImage: body.productImage,
      quantity: body.quantity,
      price: body.price
    })
    
    return NextResponse.json({
      success: true,
      item,
      message: 'Item added to subscription'
    })
  } catch (error) {
    console.error('Error adding subscription item:', error)
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    )
  }
}

