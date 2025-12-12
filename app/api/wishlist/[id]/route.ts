import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getWishlistById,
  updateWishlist,
  deleteWishlist,
  getWishlistWithItemCount,
} from '@/lib/db/wishlist';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/wishlist/[id]
 * Get a specific wishlist with items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const wishlistId = params.id?.trim();
    
    if (!wishlistId) {
      return NextResponse.json(
        { success: false, error: 'Invalid wishlist ID' },
        { status: 400 }
      );
    }
    
    // Get wishlist with items
    const wishlist = getWishlistWithItemCount(wishlistId, userId);
    
    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        itemCount: wishlist.itemCount,
        items: wishlist.items,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/wishlist/[id]
 * Update wishlist name
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-update-${identifier}`,
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
    const name = body.name?.trim();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Wishlist name is required' },
        { status: 400 }
      );
    }
    
    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Wishlist name must be 100 characters or less' },
        { status: 400 }
      );
    }
    
    // Update wishlist
    const success = updateWishlist(wishlistId, userId, name);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found or update failed' },
        { status: 404 }
      );
    }
    
    // Get updated wishlist
    const wishlist = getWishlistById(wishlistId, userId);
    
    return NextResponse.json({
      success: true,
      wishlist: {
        id: wishlist!.id,
        name: wishlist!.name,
        isDefault: wishlist!.isDefault,
        createdAt: wishlist!.createdAt,
        updatedAt: wishlist!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist/[id]
 * Delete a wishlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-delete-${identifier}`,
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
    
    // Check if wishlist exists and belongs to user
    const wishlist = getWishlistById(wishlistId, userId);
    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }
    
    // Prevent deleting default wishlist
    if (wishlist.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default wishlist' },
        { status: 400 }
      );
    }
    
    // Delete wishlist
    const success = deleteWishlist(wishlistId, userId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete wishlist' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Wishlist deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
}

