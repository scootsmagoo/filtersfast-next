/**
 * Get Upcoming Subscription Orders API
 * GET /api/subscriptions/upcoming - Get customer's next scheduled orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  getCustomerSubscriptions,
  getSubscriptionItems
} from '@/lib/db/subscriptions'

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
    
    // Get active subscriptions
    const subscriptions = await getCustomerSubscriptions(session.user.id)
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
    
    if (activeSubscriptions.length === 0) {
      return NextResponse.json({
        hasUpcoming: false,
        nextOrder: null
      })
    }
    
    // Find the soonest upcoming order
    const sortedSubscriptions = activeSubscriptions.sort((a, b) => 
      a.nextDeliveryDate.getTime() - b.nextDeliveryDate.getTime()
    )
    
    const nextSubscription = sortedSubscriptions[0]
    const items = await getSubscriptionItems(nextSubscription.id)
    
    return NextResponse.json({
      hasUpcoming: true,
      nextOrder: {
        subscriptionId: nextSubscription.id,
        nextDeliveryDate: nextSubscription.nextDeliveryDate.toISOString(),
        nextDeliveryDateFormatted: nextSubscription.nextDeliveryDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        frequency: nextSubscription.frequency,
        items,
        itemCount: items.length
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming subscriptions' },
      { status: 500 }
    )
  }
}



