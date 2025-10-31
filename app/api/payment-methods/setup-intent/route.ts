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

    // Create SetupIntent with timeout (OWASP A04: Insecure Design)
    const setupIntentPromise = createSetupIntent(customerId, {
      user_id: session.user.id,
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SetupIntent creation timed out')), 10000)
    );

    const setupIntent = await Promise.race([setupIntentPromise, timeoutPromise]) as any;

    // OWASP A09: Security logging
    console.log('[SECURITY] SetupIntent created:', {
      user_id: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
    });
  } catch (error: any) {
    // OWASP A09: Security logging without sensitive data
    console.error('[ERROR] SetupIntent creation failed:', {
      error_type: error.type || 'unknown',
      error_message: error.message?.substring(0, 100) || 'unknown',
      timestamp: new Date().toISOString(),
    });
    
    // OWASP A04: Generic error messages to prevent information disclosure
    if (error.message && error.message.includes('Stripe is not configured')) {
      return NextResponse.json(
        { error: 'Payment processing is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }
    
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Request timed out. Please check your connection and try again.' },
        { status: 504 }
      );
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Unable to initialize payment setup. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initialize payment method setup. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

