/**
 * Admin Review Statistics API
 * Provides aggregate review metrics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { getBusinessSummary } from '@/lib/trustpilot/client';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // OWASP A01: Admin authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05: Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.standard);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Fetch business summary from TrustPilot
    const summary = await getBusinessSummary();

    if (!summary) {
      return NextResponse.json(
        {
          totalReviews: 0,
          averageRating: 0,
          trustScore: 0,
          pendingReplies: 0,
          recentReviews: 0,
          starDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        },
        { status: 200 }
      );
    }

    // Calculate stats
    const stats = {
      totalReviews: summary.numberOfReviews.total,
      averageRating: summary.stars,
      trustScore: summary.trustScore,
      pendingReplies: 0, // TODO: Implement from TrustPilot API or database
      recentReviews: 0, // TODO: Calculate from recent reviews
      starDistribution: {
        1: summary.numberOfReviews.oneStar,
        2: summary.numberOfReviews.twoStars,
        3: summary.numberOfReviews.threeStars,
        4: summary.numberOfReviews.fourStars,
        5: summary.numberOfReviews.fiveStars,
      },
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    // OWASP A09: Secure error handling
    console.error('Error fetching review stats:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch review statistics' },
      { status: 500 }
    );
  }
}

