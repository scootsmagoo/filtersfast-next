/**
 * SMS Status API - Check subscription status
 * GET /api/sms/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSMSSubscriptionByUserId, getSMSSubscriptionWithPreferences } from '@/lib/db/sms';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get subscription
    const subscription = getSMSSubscriptionByUserId(userId);

    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        subscription: null,
      });
    }

    // Get with preferences
    const subscriptionWithPrefs = getSMSSubscriptionWithPreferences(subscription.id);

    return NextResponse.json({
      subscribed: subscription.is_subscribed,
      subscription: {
        id: subscription.id,
        phone_number: subscription.phone_number,
        country_code: subscription.country_code,
        is_subscribed: subscription.is_subscribed,
        transactional_opt_in: subscription.transactional_opt_in,
        marketing_opt_in: subscription.marketing_opt_in,
        subscribed_at: subscription.subscribed_at,
        preferences: subscriptionWithPrefs?.preferences || null,
      },
    });
  } catch (error) {
    console.error('Error getting SMS status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

