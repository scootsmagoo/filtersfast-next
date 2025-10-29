/**
 * Track Cart Abandonment
 * POST /api/abandoned-carts/track
 * 
 * Creates an abandoned cart record when user leaves checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAbandonedCart, getActiveAbandonedCartByEmail } from '@/lib/db/abandoned-carts';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

// Security constants
const MAX_CART_DATA_SIZE = 50000; // 50KB max
const MAX_SESSION_ID_LENGTH = 256;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MIN_CART_VALUE = 0;
const MAX_CART_VALUE = 999999.99;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimitFn(identifier, 10, 60); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Request size limit check
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_CART_DATA_SIZE) {
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { session_id, user_id, email, cart_data, cart_value } = body;

    // Validation - Required fields
    if (!session_id || !email || !cart_data || cart_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session_id format (alphanumeric, hyphens, underscores only)
    if (typeof session_id !== 'string' || session_id.length > MAX_SESSION_ID_LENGTH || !/^[a-zA-Z0-9_-]+$/.test(session_id)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeText(email.trim().toLowerCase());
    if (sanitizedEmail.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: 'Email address too long' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate cart_value
    const numericCartValue = parseFloat(cart_value);
    if (isNaN(numericCartValue) || numericCartValue < MIN_CART_VALUE || numericCartValue > MAX_CART_VALUE) {
      return NextResponse.json(
        { error: 'Invalid cart value' },
        { status: 400 }
      );
    }

    // Validate cart_data is an array
    if (!Array.isArray(cart_data)) {
      return NextResponse.json(
        { error: 'Invalid cart data format' },
        { status: 400 }
      );
    }

    // Validate cart_data items and sanitize
    const sanitizedCartData = cart_data.map((item: any) => {
      if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        throw new Error('Invalid cart item format');
      }
      return {
        id: sanitizeText(String(item.id)),
        name: sanitizeText(String(item.name)),
        quantity: Math.max(1, Math.min(999, Math.floor(item.quantity))),
        price: Math.max(0, Math.min(999999.99, parseFloat(item.price))),
      };
    });

    // Check if user already has an active abandoned cart
    const existingCart = getActiveAbandonedCartByEmail(sanitizedEmail);
    if (existingCart) {
      // Don't expose cart_id in response (security)
      return NextResponse.json(
        { 
          success: true,
          message: 'Cart tracking updated'
        },
        { status: 200 }
      );
    }

    // Generate recovery token (32 bytes = 64 hex characters)
    const recovery_token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 7 days
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    const recovery_token_expires = expiration.toISOString();

    // Create abandoned cart record
    const cartId = createAbandonedCart({
      session_id,
      user_id: user_id || null,
      email: sanitizedEmail,
      cart_data: JSON.stringify(sanitizedCartData),
      cart_value: numericCartValue,
      recovery_token,
      recovery_token_expires,
    });

    // Audit log (security monitoring)
    console.log('[AUDIT] Abandoned cart tracked', {
      cart_id: cartId,
      email: sanitizedEmail.substring(0, 3) + '***', // Partial email for privacy
      cart_value: numericCartValue,
      items_count: sanitizedCartData.length,
      ip: identifier,
      timestamp: new Date().toISOString(),
    });

    // Don't expose recovery_token in response (sent via email only)
    return NextResponse.json({
      success: true,
      message: 'Cart abandonment tracked successfully',
    }, { status: 201 });

  } catch (error: any) {
    // Security: Don't expose internal error details
    console.error('[ERROR] Failed to track abandoned cart:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 500 }
    );
  }
}

