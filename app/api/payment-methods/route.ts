/**
 * Payment Methods API - List & Create
 * 
 * GET  /api/payment-methods - List all saved payment methods
 * POST /api/payment-methods - Add a new payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getPaymentMethodsByUserId,
  createPaymentMethod,
  getStripeCustomerIdByUserId,
} from '@/lib/db/payment-methods';
import {
  getOrCreateStripeCustomer,
  attachPaymentMethodToCustomer,
  getStripePaymentMethod,
  isCardExpired,
} from '@/lib/stripe-payment-methods';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import type { PaymentMethodResponse } from '@/lib/types/payment-methods';

/**
 * GET /api/payment-methods - List all saved payment methods
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 20, 60); // 20 requests per minute
    
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

    // Get payment methods from database
    const paymentMethods = getPaymentMethodsByUserId(session.user.id);

    // Transform to response format
    const response: PaymentMethodResponse[] = paymentMethods.map((pm) => ({
      id: pm.id,
      card_brand: pm.card_brand,
      card_last4: pm.card_last4,
      card_exp_month: pm.card_exp_month,
      card_exp_year: pm.card_exp_year,
      is_default: pm.is_default,
      is_expired: isCardExpired(pm.card_exp_month, pm.card_exp_year),
      billing_name: pm.billing_name,
      created_at: pm.created_at,
      last_used_at: pm.last_used_at,
    }));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-methods - Add a new payment method
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 60); // 5 requests per minute
    
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

    // Parse request body with size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { payment_method_id, is_default } = body;

    // Validation
    if (!payment_method_id || typeof payment_method_id !== 'string') {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Validate Stripe payment method ID format (pm_xxx)
    if (!/^pm_[a-zA-Z0-9]{24,}$/.test(payment_method_id)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID format' },
        { status: 400 }
      );
    }

    // Validate is_default if provided
    if (is_default !== undefined && typeof is_default !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_default value' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    // Attach payment method to customer
    await attachPaymentMethodToCustomer(payment_method_id, customerId);

    // Get payment method details from Stripe
    const stripePaymentMethod = await getStripePaymentMethod(payment_method_id);

    if (!stripePaymentMethod.card) {
      return NextResponse.json(
        { error: 'Invalid payment method - only cards are supported' },
        { status: 400 }
      );
    }

    // Save to database
    const paymentMethodId = createPaymentMethod({
      user_id: session.user.id,
      stripe_payment_method_id: payment_method_id,
      stripe_customer_id: customerId,
      card_brand: stripePaymentMethod.card.brand,
      card_last4: stripePaymentMethod.card.last4,
      card_exp_month: stripePaymentMethod.card.exp_month,
      card_exp_year: stripePaymentMethod.card.exp_year,
      is_default: is_default || false,
      billing_name: stripePaymentMethod.billing_details.name 
        ? sanitizeText(stripePaymentMethod.billing_details.name) 
        : undefined,
      billing_email: stripePaymentMethod.billing_details.email || undefined,
      billing_address_line1: stripePaymentMethod.billing_details.address?.line1 
        ? sanitizeText(stripePaymentMethod.billing_details.address.line1) 
        : undefined,
      billing_address_line2: stripePaymentMethod.billing_details.address?.line2 
        ? sanitizeText(stripePaymentMethod.billing_details.address.line2) 
        : undefined,
      billing_address_city: stripePaymentMethod.billing_details.address?.city 
        ? sanitizeText(stripePaymentMethod.billing_details.address.city) 
        : undefined,
      billing_address_state: stripePaymentMethod.billing_details.address?.state || undefined,
      billing_address_zip: stripePaymentMethod.billing_details.address?.postal_code || undefined,
      billing_address_country: stripePaymentMethod.billing_details.address?.country || 'US',
    });

    // Audit log
    console.log('[SECURITY] Payment method added:', {
      user_id: session.user.id,
      payment_method_id: paymentMethodId,
      card_brand: stripePaymentMethod.card.brand,
      card_last4: stripePaymentMethod.card.last4,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        payment_method_id: paymentMethodId,
        message: 'Payment method saved successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[ERROR] Payment method creation failed:', error.message);
    
    // Handle Stripe errors without exposing internal details
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card declined. Please try a different card.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    );
  }
}

