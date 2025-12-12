import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlistItems,
  getWishlistById,
} from '@/lib/db/wishlist';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * POST /api/wishlist/[id]/items
 * Add a product to a wishlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const wishlistId = params.id?.trim();
    
    if (!wishlistId) {
      return NextResponse.json(
        { success: false, error: 'Invalid wishlist ID' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const productId = body.productId?.trim();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Verify wishlist exists and belongs to user
    const wishlist = getWishlistById(wishlistId, userId);
    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // Add product to wishlist
    const success = addToWishlist(wishlistId, productId, userId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Product already in wishlist or failed to add' },
        { status: 400 }
      );
    }
    
    // Get updated items
    const items = getWishlistItems(wishlistId, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Product added to wishlist',
      itemCount: items.length,
    });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add product to wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist/[id]/items
 * Remove a product from a wishlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const wishlistId = params.id?.trim();
    
    if (!wishlistId) {
      return NextResponse.json(
        { success: false, error: 'Invalid wishlist ID' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const productId = body.productId?.trim();
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Verify wishlist exists and belongs to user
    const wishlist = getWishlistById(wishlistId, userId);
    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // Remove product from wishlist
    const success = removeFromWishlist(wishlistId, productId, userId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Product not in wishlist or failed to remove' },
        { status: 404 }
      );
    }
    
    // Get updated items
    const items = getWishlistItems(wishlistId, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Product removed from wishlist',
      itemCount: items.length,
    });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}

