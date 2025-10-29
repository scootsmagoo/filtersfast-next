/**
 * Recover Abandoned Cart
 * GET /api/abandoned-carts/recover/[token]
 * 
 * Retrieves abandoned cart data by recovery token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCartByToken } from '@/lib/db/abandoned-carts';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimitFn(identifier, 20, 60); // 20 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { token } = await params;

    // Validate token format (64 hex characters)
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid recovery token' },
        { status: 400 }
      );
    }

    // Get abandoned cart
    const cart = getAbandonedCartByToken(token);

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found or recovery link has expired' },
        { status: 404 }
      );
    }

    // Check if already converted
    if (cart.converted) {
      return NextResponse.json(
        { 
          error: 'This cart has already been converted to an order',
          order_id: cart.order_id 
        },
        { status: 410 } // Gone
      );
    }

    // Check if opted out
    if (cart.opted_out) {
      return NextResponse.json(
        { error: 'Cart recovery has been disabled' },
        { status: 410 }
      );
    }

    // Parse cart data
    let cartItems;
    try {
      cartItems = JSON.parse(cart.cart_data);
    } catch {
      return NextResponse.json(
        { error: 'Invalid cart data' },
        { status: 500 }
      );
    }

    // Return cart data
    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        email: cart.email,
        cart_items: cartItems,
        cart_value: cart.cart_value,
        abandoned_at: cart.abandoned_at,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error recovering abandoned cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

