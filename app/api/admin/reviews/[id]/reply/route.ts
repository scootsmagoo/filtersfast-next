/**
 * Admin API: Post Review Reply
 * POST - Reply to a customer review via TrustPilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { postReviewReply } from '@/lib/trustpilot/client';
import { recordReviewReply } from '@/lib/db/reviews';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reviews/:id/reply
 * Post a reply to a review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // OWASP A01: Admin authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05: Strict rate limiting for write operations
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, {
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 100,
      maxRequests: 5, // Only 5 replies per minute
    });
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before posting another reply.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // OWASP A03: Validate review ID
    const reviewId = params.id;
    if (!reviewId || !/^[a-zA-Z0-9\-_]{10,}$/.test(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { replyText } = body;

    // OWASP A03: Validate reply text
    if (!replyText || typeof replyText !== 'string') {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      );
    }

    const sanitizedReply = replyText.trim();
    
    if (sanitizedReply.length === 0) {
      return NextResponse.json(
        { error: 'Reply text cannot be empty' },
        { status: 400 }
      );
    }

    if (sanitizedReply.length < 10) {
      return NextResponse.json(
        { error: 'Reply must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (sanitizedReply.length > 2048) {
      return NextResponse.json(
        { error: 'Reply must be 2048 characters or less' },
        { status: 400 }
      );
    }

    // Post reply to TrustPilot
    const result = await postReviewReply(reviewId, sanitizedReply);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to post reply' },
        { status: 500 }
      );
    }

    const replyTimestamp = result.reply?.createdAt || new Date().toISOString();
    recordReviewReply(reviewId, sanitizedReply, replyTimestamp);

    // OWASP A09: Log admin action (without sensitive data)
    console.log(`Admin ${session.user.email} replied to review ${reviewId}`);

    return NextResponse.json({
      success: true,
      reply: result.reply,
    });

  } catch (error) {
    // OWASP A09: Secure error handling
    console.error('Error posting review reply:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to post reply' },
      { status: 500 }
    );
  }
}

