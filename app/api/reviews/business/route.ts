/**
 * Business Reviews API Route
 * Fetches overall company reviews from TrustPilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessReviews, getBusinessSummary } from '@/lib/trustpilot/client';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 20, // 20 requests per minute per IP
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please slow down and try again later',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);

    // Input validation
    if (page < 1 || perPage < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch business reviews and summary
    const [reviewsData, summary] = await Promise.all([
      getBusinessReviews(page, perPage),
      getBusinessSummary(),
    ]);

    return NextResponse.json(
      {
        reviews: reviewsData.reviews,
        summary: summary
          ? {
              totalReviews: summary.numberOfReviews.total,
              averageRating: summary.stars,
              trustScore: summary.trustScore,
              starDistribution: {
                1: summary.numberOfReviews.oneStar,
                2: summary.numberOfReviews.twoStars,
                3: summary.numberOfReviews.threeStars,
                4: summary.numberOfReviews.fourStars,
                5: summary.numberOfReviews.fiveStars,
              },
            }
          : null,
        pagination: {
          page,
          perPage,
          hasMore: reviewsData.links.some((link) => link.rel === 'next-page'),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // Cache for 30 minutes
        },
      }
    );
  } catch (error) {
    // OWASP A09: Secure error handling - don't expose internal details
    console.error('Error fetching business reviews:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch business reviews',
        message: 'An error occurred while fetching reviews. Please try again later.',
      },
      { status: 500 }
    );
  }
}

