/**
 * SMS Unsubscribe API
 * POST /api/sms/unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { getSMSSubscriptionByPhone, getSMSSubscriptionByUserId, updateSMSSubscriptionStatus } from '@/lib/db/sms';
import { createAttentiveClient } from '@/lib/attentive';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 10, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

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
      return NextResponse.json(
        { error: 'No SMS subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.is_subscribed) {
      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed',
      });
    }

    // Update database
    const success = updateSMSSubscriptionStatus(subscription.id, false);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // A09: Audit logging (mask phone for privacy)
    const maskedPhone = subscription.phone_number.slice(0, 3) + '***' + subscription.phone_number.slice(-2);
    const ip = identifier !== 'anonymous' ? identifier : 'unknown';
    console.log(`[AUDIT] SMS unsubscribe: User=${userId}, Subscription=${subscription.id}, Phone=${maskedPhone}, IP=${ip}`);

    // Unsubscribe from Attentive
    const attentiveClient = createAttentiveClient();
    if (attentiveClient) {
      try {
        await attentiveClient.unsubscribe(subscription.phone_number);
      } catch (error) {
        console.error('Failed to unsubscribe from Attentive (non-fatal):', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from SMS notifications',
    });
  } catch (error) {
    console.error('Error in SMS unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

