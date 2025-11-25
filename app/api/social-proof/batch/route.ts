import { NextRequest, NextResponse } from 'next/server';
import { getSocialProofDataBatch } from '@/lib/db/social-proof';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { z } from 'zod';

// OWASP: Strict validation for product IDs (alphanumeric, hyphens, underscores, dots only)
const productIdSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/);

const batchRequestSchema = z.object({
  productIds: z.array(productIdSchema).min(1).max(50), // Max 50 products per request
});

/**
 * POST /api/social-proof/batch
 * Get social proof data for multiple products at once
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `social-proof-batch-${identifier}`,
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
    
    const body = await request.json();
    const { productIds } = batchRequestSchema.parse(body);
    
    // Get social proof data for all products
    const dataMap = getSocialProofDataBatch(productIds);
    
    // Convert Map to object for JSON response
    const result: Record<string, {
      recentViews: number;
      uniqueViewers: number;
      recentPurchases: number;
      totalQuantityPurchased: number;
    }> = {};
    
    for (const [productId, data] of dataMap.entries()) {
      result[productId] = {
        recentViews: data.recentViews,
        uniqueViewers: data.uniqueViewers,
        recentPurchases: data.recentPurchases,
        totalQuantityPurchased: data.totalQuantityPurchased,
      };
    }
    
    const response = NextResponse.json(result);
    
    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitPresets.generous.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    // Cache for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    // OWASP: Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // OWASP: Don't expose validation details in production
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          ...(isDev && { details: error.errors })
        },
        { status: 400 }
      );
    }
    
    // OWASP: Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    console.error('Error fetching batch social proof data:', error);
    return NextResponse.json(
      { error: isDev && error instanceof Error ? error.message : 'Failed to fetch social proof data' },
      { status: 500 }
    );
  }
}

