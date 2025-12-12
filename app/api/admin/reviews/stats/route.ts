/**
 * Admin Review Statistics API
 * Provides aggregate review metrics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { getReviewStats } from '@/lib/db/reviews';

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

    const stats = getReviewStats();

    const totalReviews = stats.totalReviews;
    const positive = stats.starDistribution[4] + stats.starDistribution[5];
    const negative = stats.starDistribution[1] + stats.starDistribution[2];
    const neutral = stats.starDistribution[3];

    const sentimentTrend = totalReviews > 0
      ? {
          positive: Math.round((positive / totalReviews) * 100),
          neutral: Math.round((neutral / totalReviews) * 100),
          negative: Math.round((negative / totalReviews) * 100),
        }
      : { positive: 0, neutral: 0, negative: 0 };

    const responsePayload = {
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating || 0,
      trustScore: Math.round((stats.averageRating || 0) * 20),
      pendingReplies: stats.pendingReplies,
      recentReviews: stats.recentReviews,
      starDistribution: stats.starDistribution,
      responseRate: stats.responseRate,
      avgResponseTime: stats.avgResponseHours,
      sentimentTrend,
    };

    return NextResponse.json(responsePayload, {
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

