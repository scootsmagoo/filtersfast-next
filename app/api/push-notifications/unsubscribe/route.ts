import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePushSubscription, deleteUserPushSubscriptions } from '@/lib/db/push-notifications';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * POST /api/push-notifications/unsubscribe
 * Unsubscribe user from push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `push-unsubscribe-${identifier}`,
      rateLimitPresets.strict
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Limit request body size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const { endpoint } = body;

    if (endpoint) {
      // Validate endpoint format
      if (typeof endpoint !== 'string' || endpoint.length > 2000) {
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        );
      }

      // Verify endpoint belongs to user before deleting
      // This prevents users from deleting other users' subscriptions
      const deleted = deletePushSubscription(endpoint, session.user.id);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Subscription not found or access denied' },
          { status: 404 }
        );
      }
    } else {
      // Delete all subscriptions for user
      deleteUserPushSubscriptions(session.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

