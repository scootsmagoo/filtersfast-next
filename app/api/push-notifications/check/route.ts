import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasActivePushSubscription } from '@/lib/db/push-notifications';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/push-notifications/check
 * Check if user has active push notification subscription
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `push-check-${identifier}`,
      rateLimitPresets.generous
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { subscribed: false },
        { status: 200 }
      );
    }

    // Don't expose user ID in response - use session user ID internally
    const subscribed = hasActivePushSubscription(session.user.id);

    return NextResponse.json({
      subscribed,
    });
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return NextResponse.json(
      { subscribed: false },
      { status: 200 }
    );
  }
}

