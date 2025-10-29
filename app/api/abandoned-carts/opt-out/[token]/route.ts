/**
 * Opt Out of Abandoned Cart Emails
 * POST /api/abandoned-carts/opt-out/[token]
 * 
 * Allows users to unsubscribe from abandoned cart reminder emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { markCartAsOptedOut, getAbandonedCartByToken } from '@/lib/db/abandoned-carts';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimitFn(identifier, 5, 60); // 5 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { token } = await params;

    // Validate token format
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Check if cart exists
    const cart = getAbandonedCartByToken(token);
    if (!cart) {
      // Don't reveal if token is invalid for security
      return NextResponse.json({
        success: true,
        message: 'You have been unsubscribed from cart reminder emails',
      }, { status: 200 });
    }

    // Mark as opted out
    markCartAsOptedOut(token);

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from cart reminder emails',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error opting out of abandoned cart emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

