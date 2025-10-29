/**
 * Product Reviews API Route
 * 
 * GET /api/reviews/[productId]?page=1
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchProductReviews } from '@/lib/trustpilot';
import { RateLimiter } from '@/lib/security';

// Initialize rate limiter for reviews API (30 requests per minute)
const reviewsRateLimiter = new RateLimiter(30, 60 * 1000);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!reviewsRateLimiter.isAllowed(clientId)) {
      const retryAfter = reviewsRateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    const { productId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Validate inputs
    if (!productId || productId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (page < 1 || page > 100) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    // Fetch reviews
    const reviewsData = await fetchProductReviews(productId, page);

    if (!reviewsData) {
      // Trustpilot not configured or error occurred
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        hasMore: false,
        configured: false,
      });
    }

    return NextResponse.json({
      ...reviewsData,
      configured: true,
    });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

