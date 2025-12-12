import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProductRecommendations } from '@/lib/recommendations-engine';
import { getProductById } from '@/lib/db/products';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { z } from 'zod';
import type { RecommendationType } from '@/lib/db/product-recommendations';

const validRecommendationTypes: RecommendationType[] = [
  'frequently_bought_together',
  'similar',
  'trending',
  'cross_sell',
  'upsell',
  'recently_viewed',
  'personalized',
];

/**
 * GET /api/products/[id]/recommendations
 * Get product recommendations for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `recommendations-${identifier}`,
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
    
    // Validate and sanitize productId
    const productId = params.id?.trim();
    if (!productId || productId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Get session for user context
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    const userId = session?.user?.id || null;
    
    // Get session ID from cookies
    const sessionId = request.cookies.get('sessionId')?.value || null;
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const typesParam = searchParams.get('types');
    let types: RecommendationType[] | undefined;
    
    if (typesParam) {
      const typeArray = typesParam.split(',').map(t => t.trim()).filter(Boolean);
      // Validate all types are valid
      const validTypes = typeArray.filter(t => 
        validRecommendationTypes.includes(t as RecommendationType)
      ) as RecommendationType[];
      
      if (validTypes.length > 0) {
        types = validTypes;
      }
    }
    
    // Validate and bound limit
    const limitParam = searchParams.get('limit');
    const limit = limitParam 
      ? Math.min(Math.max(1, parseInt(limitParam, 10)), 50) // Between 1 and 50
      : 10;
    
    // Verify product exists
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get recommendations
    const recommendations = getProductRecommendations(productId, {
      types,
      limit,
      userId,
      sessionId,
    });
    
    // Convert to API response format (sanitize output)
    const response = recommendations.map(rec => ({
      product: {
        id: String(rec.product.id || '').substring(0, 100),
        name: String(rec.product.name || '').substring(0, 200),
        brand: String(rec.product.brand || '').substring(0, 100),
        sku: String(rec.product.sku || '').substring(0, 100),
        price: typeof rec.product.price === 'number' ? rec.product.price : 0,
        compareAtPrice: typeof rec.product.compareAtPrice === 'number' ? rec.product.compareAtPrice : null,
        image: String(rec.product.primaryImage || '/images/product-placeholder.jpg').substring(0, 500),
        rating: typeof rec.product.rating === 'number' ? Math.max(0, Math.min(5, rec.product.rating)) : 0,
        reviewCount: typeof rec.product.reviewCount === 'number' ? Math.max(0, rec.product.reviewCount) : 0,
        inStock: Boolean(rec.product.inventoryQuantity > 0 || !rec.product.trackInventory),
        badges: Array.isArray(rec.product.badges) 
          ? rec.product.badges.slice(0, 5).map(b => String(b).substring(0, 50))
          : [],
        slug: String(rec.product.slug || '').substring(0, 200),
      },
      recommendationType: rec.recommendationType,
      score: typeof rec.score === 'number' ? Math.max(0, Math.min(100, rec.score)) : 0,
      reason: String(rec.reason || '').substring(0, 200),
    }));
    
    const jsonResponse = NextResponse.json({
      success: true,
      recommendations: response,
      count: response.length,
    });
    
    // Set rate limit headers
    jsonResponse.headers.set('X-RateLimit-Limit', rateLimitPresets.generous.maxRequests.toString());
    jsonResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    jsonResponse.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    return jsonResponse;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

