/**
 * Payment Methods Setup Intent API
 * 
 * POST /api/payment-methods/setup-intent - Create SetupIntent for adding new card
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getOrCreateStripeCustomer, createSetupIntent } from '@/lib/stripe-payment-methods';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/payment-methods/setup-intent - Create SetupIntent
 * 
 * Used by Stripe Elements to securely collect card information
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 10, 60); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    // Create SetupIntent
    const setupIntent = await createSetupIntent(customerId, {
      user_id: session.user.id,
    });

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid request to payment provider' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initialize payment method setup' },
      { status: 500 }
    );
  }
}

