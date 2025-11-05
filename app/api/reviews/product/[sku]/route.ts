/**
 * Product Reviews API Route
 * Fetches reviews for a specific product SKU
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllProductReviews, getCombinedProductSummary } from '@/lib/trustpilot/client';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 30, // 30 requests per minute per IP
});

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
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

    const sku = params.sku;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100); // Max 100 per request

    // OWASP A03: Input validation and sanitization
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid SKU provided' },
        { status: 400 }
      );
    }

    // Sanitize SKU: alphanumeric, hyphens, underscores only, max 100 chars
    const sanitizedSKU = sku.trim().slice(0, 100);
    if (!/^[a-zA-Z0-9\-_]+$/.test(sanitizedSKU)) {
      return NextResponse.json(
        { error: 'Invalid SKU format' },
        { status: 400 }
      );
    }

    if (page < 1 || page > 1000 || perPage < 1 || isNaN(page) || isNaN(perPage)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch reviews and summary using sanitized SKU
    const [reviews, summary] = await Promise.all([
      getAllProductReviews(sanitizedSKU, perPage),
      getCombinedProductSummary(sanitizedSKU),
    ]);

    return NextResponse.json(
      {
        reviews,
        summary,
        pagination: {
          page,
          perPage,
          total: summary.totalReviews,
          hasMore: reviews.length >= perPage,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    // OWASP A09: Secure error handling - don't expose internal details
    console.error('Error fetching product reviews:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        message: 'An error occurred while fetching reviews. Please try again later.',
      },
      { status: 500 }
    );
  }
}

