import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getUserWishlists,
  createWishlist,
  getWishlistWithItemCount,
} from '@/lib/db/wishlist';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/wishlist
 * Get all wishlists for the authenticated user
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
    
    // Get all wishlists with item counts
    const wishlists = getUserWishlists(userId);
    const wishlistsWithItems = wishlists.map(wishlist => {
      const withItems = getWishlistWithItemCount(wishlist.id, userId);
      return {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        itemCount: withItems?.itemCount || 0,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      };
    });
    
    return NextResponse.json({
      success: true,
      wishlists: wishlistsWithItems,
    });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Create a new wishlist
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `wishlist-create-${identifier}`,
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
    
    // Parse request body
    const body = await request.json();
    const name = body.name?.trim() || 'My Wishlist';
    
    // Validate name: length and sanitize
    if (name.length === 0 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Wishlist name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }
    
    // Sanitize: remove potentially dangerous characters, but allow unicode for international names
    // Allow letters, numbers, spaces, hyphens, underscores, and common punctuation
    const sanitizedName = name.replace(/[<>\"'&]/g, '');
    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid wishlist name' },
        { status: 400 }
      );
    }
    
    // Create wishlist with sanitized name
    const wishlist = createWishlist(userId, sanitizedName);
    
    return NextResponse.json({
      success: true,
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        itemCount: 0,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

