/**
 * Public API: Backorder Notifications
 * POST /api/backorder-notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { createBackorderNotification } from '@/lib/db/backorder-notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
    const optionId =
      body.optionId && typeof body.optionId === 'string' && body.optionId.trim().length > 0
        ? body.optionId.trim()
        : null;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    // Rate limit by client identifier (IP)
    const clientId = getClientIdentifier(request);
    const limit = await rateLimit(clientId, 5, 600); // 5 requests per 10 minutes
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const result = createBackorderNotification({
      productId,
      optionId,
      email,
      source: 'web',
    });

    if (result.reason === 'invalid-product') {
      return NextResponse.json(
        { success: false, error: 'This product is not available.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        created: result.created,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(limit.reset),
        },
      },
    );
  } catch (error: any) {
    console.error('Error creating backorder notification:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to process request. Please try again.' },
      { status: 500 }
    );
  }
}


