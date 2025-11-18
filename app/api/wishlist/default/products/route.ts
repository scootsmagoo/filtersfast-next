import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getOrCreateDefaultWishlist,
  getWishlistItems,
  getDefaultWishlistProductIds,
} from '@/lib/db/wishlist';
import { getProductByIdOrMock } from '@/lib/db/products-helper';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/wishlist/default/products
 * Get all products in the user's default wishlist
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-${identifier}`,
      rateLimitPresets.standard
    );
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    // Get session
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get product IDs from default wishlist
    const productIds = getDefaultWishlistProductIds(userId);
    console.log('[Wishlist API] Product IDs from database:', productIds);
    
    // Fetch product details
    const products = productIds
      .map(storedProductId => {
        try {
          console.log(`[Wishlist API] Looking up product: ${storedProductId}`);
          const product = getProductByIdOrMock(storedProductId);
          
          if (!product) {
            console.warn(`[Wishlist API] Product not found: ${storedProductId}`);
            return null;
          }
          
          console.log(`[Wishlist API] Found product: ${product.id} - ${product.name}`);
          
          return {
            id: product.id, // Use the database ID (UUID) as the primary identifier
            productId: product.id, // Also include as productId for consistency
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            price: product.price,
            compareAtPrice: product.compareAtPrice || null,
            primaryImage: product.primaryImage || '/images/product-placeholder.jpg',
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            inStock: (product.inventoryQuantity > 0 || !product.trackInventory),
            slug: product.slug || null,
          };
        } catch (error) {
          console.error(`[Wishlist API] Error fetching product ${storedProductId}:`, error);
          return null;
        }
      })
      .filter(Boolean);
    
    console.log('[Wishlist API] Returning products:', products.length);
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching default wishlist products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist products' },
      { status: 500 }
    );
  }
}

