import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getOrCreateDefaultWishlist,
  addToDefaultWishlist,
  removeFromDefaultWishlist,
  isProductInDefaultWishlist,
} from '@/lib/db/wishlist';
import { getProductById } from '@/lib/db/products';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * POST /api/wishlist/default/products/[productId]
 * Add a product to the default wishlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> | { productId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-add-${identifier}`,
      rateLimitPresets.strict
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
    const productId = resolvedParams.productId?.trim();
    
    // Input validation: productId must be non-empty and reasonable length
    if (!productId || productId.length === 0 || productId.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Sanitize: only allow alphanumeric, hyphens, underscores, and dots (for UUIDs and numeric IDs)
    if (!/^[a-zA-Z0-9._-]+$/.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Verify product exists (optional check - we'll allow adding even if product doesn't exist yet)
    try {
      const product = getProductById(productId);
      if (!product) {
        console.warn('[Wishlist API] Product not found in database:', productId);
        // Continue anyway - product might be added later
      }
    } catch (productCheckError: any) {
      console.warn('[Wishlist API] Error checking if product exists:', productCheckError);
      // Continue anyway
    }
    
    // Check if already in wishlist
    try {
      const alreadyInWishlist = isProductInDefaultWishlist(productId, userId);
      console.log('[Wishlist API] Already in wishlist?', alreadyInWishlist);
      if (alreadyInWishlist) {
        return NextResponse.json(
          { success: false, error: 'Product already in wishlist' },
          { status: 400 }
        );
      }
    } catch (checkError: any) {
      console.error('[Wishlist API] Error checking wishlist status:', checkError);
      // Continue anyway - might be a database issue, but we'll try to add
    }
    
    // Add product to default wishlist
    try {
      const success = addToDefaultWishlist(productId, userId);
      console.log('[Wishlist API] addToDefaultWishlist result:', success);
      
      if (!success) {
        // Check if it's because the product is already in the wishlist
        const checkAgain = isProductInDefaultWishlist(productId, userId);
        if (checkAgain) {
          return NextResponse.json(
            { success: false, error: 'Product already in wishlist' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to add product to wishlist. Please try again.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Product added to wishlist',
      });
    } catch (addError: any) {
      console.error('[Wishlist API] Error in addToDefaultWishlist:', addError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add product to wishlist'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error adding product to wishlist:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add product to wishlist'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist/default/products/[productId]
 * Remove a product from the default wishlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> | { productId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-remove-${identifier}`,
      rateLimitPresets.strict
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
    const productId = resolvedParams.productId?.trim();
    
    // Input validation: productId must be non-empty and reasonable length
    if (!productId || productId.length === 0 || productId.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Sanitize: only allow alphanumeric, hyphens, underscores, and dots
    if (!/^[a-zA-Z0-9._-]+$/.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Remove product from default wishlist
    const success = removeFromDefaultWishlist(productId, userId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Product not in wishlist or failed to remove' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wishlist/default/products/[productId]
 * Check if a product is in the default wishlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> | { productId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 13+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    
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
    const productId = resolvedParams.productId?.trim();
    
    // Input validation: productId must be non-empty and reasonable length
    if (!productId || productId.length === 0 || productId.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Sanitize: only allow alphanumeric, hyphens, underscores, and dots
    if (!/^[a-zA-Z0-9._-]+$/.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Check if product is in default wishlist
    const inWishlist = isProductInDefaultWishlist(productId, userId);
    
    return NextResponse.json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check wishlist status' },
      { status: 500 }
    );
  }
}

