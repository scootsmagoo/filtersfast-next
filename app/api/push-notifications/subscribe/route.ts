import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription } from '@/lib/db/push-notifications';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * POST /api/push-notifications/subscribe
 * Subscribe user to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `push-subscribe-${identifier}`,
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

    // Limit request body size to prevent DoS (max 10KB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024) {
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

    const { subscription } = body;

    // Validate subscription structure
    if (!subscription || 
        typeof subscription !== 'object' ||
        !subscription.endpoint || 
        typeof subscription.endpoint !== 'string' ||
        subscription.endpoint.length > 2000 ||
        !subscription.keys ||
        typeof subscription.keys !== 'object' ||
        !subscription.keys.p256dh ||
        typeof subscription.keys.p256dh !== 'string' ||
        subscription.keys.p256dh.length > 200 ||
        !subscription.keys.auth ||
        typeof subscription.keys.auth !== 'string' ||
        subscription.keys.auth.length > 200) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Validate endpoint URL format
    try {
      const endpointUrl = new URL(subscription.endpoint);
      // Only allow HTTPS endpoints
      if (endpointUrl.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'Invalid endpoint protocol' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid endpoint URL' },
        { status: 400 }
      );
    }

    // Sanitize user agent (limit length)
    const userAgent = request.headers.get('user-agent');
    const sanitizedUserAgent = userAgent && userAgent.length <= 500 
      ? userAgent.substring(0, 500) 
      : undefined;

    // Save subscription
    const saved = savePushSubscription(
      session.user.id,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      sanitizedUserAgent
    );

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

