import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { trackRecommendationClick } from '@/lib/db/product-recommendations';
import { z } from 'zod';
import type { RecommendationType } from '@/lib/db/product-recommendations';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

const trackClickSchema = z.object({
  productId: z.string().min(1).max(100), // Limit length
  recommendedProductId: z.string().min(1).max(100), // Limit length
  recommendationType: z.enum([
    'frequently_bought_together',
    'similar',
    'trending',
    'cross_sell',
    'upsell',
    'recently_viewed',
    'personalized',
  ]),
  position: z.number().int().min(1).max(1000).optional(), // Reasonable max
});

/**
 * POST /api/recommendations/track-click
 * Track when a user clicks on a recommendation
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `track-click-${identifier}`,
      rateLimitPresets.generous
    );
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }
    
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    const userId = session?.user?.id || null;
    const sessionId = request.cookies.get('sessionId')?.value || null;
    
    const body = await request.json();
    const data = trackClickSchema.parse(body);
    
    // Track the click
    const clickId = trackRecommendationClick({
      idProduct: data.productId,
      recommendedProductId: data.recommendedProductId,
      recommendationType: data.recommendationType as RecommendationType,
      userId,
      sessionId,
      position: data.position || null,
    });
    
    const response = NextResponse.json({
      success: true,
      clickId,
    });
    
    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitPresets.generous.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    console.error('Error tracking recommendation click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

