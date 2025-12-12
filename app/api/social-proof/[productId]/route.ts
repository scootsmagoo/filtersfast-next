import { NextRequest, NextResponse } from 'next/server';
import { getSocialProofData, isSocialProofEnabled } from '@/lib/db/social-proof';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/social-proof/[productId]
 * Get real-time social proof data for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `social-proof-${identifier}`,
      rateLimitPresets.generous
    );
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    const { productId } = await params;
    
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // OWASP: Validate product ID format (alphanumeric, hyphens, underscores, dots, max 100 chars)
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Check if social proof is enabled for this product
    const enabled = isSocialProofEnabled(productId);
    
    if (!enabled) {
      return NextResponse.json({
        enabled: false,
        recentViews: 0,
        uniqueViewers: 0,
        recentPurchases: 0,
        totalQuantityPurchased: 0,
      });
    }
    
    // Get social proof data
    const data = getSocialProofData(productId);
    
    if (!data) {
      return NextResponse.json({
        enabled: true,
        recentViews: 0,
        uniqueViewers: 0,
        recentPurchases: 0,
        totalQuantityPurchased: 0,
      });
    }
    
    const response = NextResponse.json({
      enabled: true,
      recentViews: data.recentViews,
      uniqueViewers: data.uniqueViewers,
      recentPurchases: data.recentPurchases,
      totalQuantityPurchased: data.totalQuantityPurchased,
    });
    
    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitPresets.generous.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    // Cache for 30 seconds (social proof updates frequently)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    // OWASP: Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;
  } catch (error) {
    // OWASP: Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    console.error('Error fetching social proof data:', error);
    return NextResponse.json(
      { error: isDev && error instanceof Error ? error.message : 'Failed to fetch social proof data' },
      { status: 500 }
    );
  }
}

