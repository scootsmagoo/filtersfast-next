/**
 * Payment Methods API - Individual Operations
 * 
 * GET    /api/payment-methods/[id] - Get specific payment method
 * PATCH  /api/payment-methods/[id] - Update payment method (set default)
 * DELETE /api/payment-methods/[id] - Delete payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/lib/db/payment-methods';
import {
  detachPaymentMethodFromCustomer,
  isCardExpired,
} from '@/lib/stripe-payment-methods';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/payment-methods/[id] - Get specific payment method
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 20, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    const paymentMethodId = parseInt(params.id, 10);
    
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Get payment method (with authorization check)
    const paymentMethod = getPaymentMethodById(paymentMethodId, session.user.id);

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Transform to response format
    const response = {
      id: paymentMethod.id,
      card_brand: paymentMethod.card_brand,
      card_last4: paymentMethod.card_last4,
      card_exp_month: paymentMethod.card_exp_month,
      card_exp_year: paymentMethod.card_exp_year,
      is_default: paymentMethod.is_default,
      is_expired: isCardExpired(paymentMethod.card_exp_month, paymentMethod.card_exp_year),
      billing_name: paymentMethod.billing_name,
      created_at: paymentMethod.created_at,
      last_used_at: paymentMethod.last_used_at,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payment-methods/[id] - Update payment method
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 10, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    const paymentMethodId = parseInt(params.id, 10);
    
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const paymentMethod = getPaymentMethodById(paymentMethodId, session.user.id);
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Parse updates
    const body = await request.json();
    const { is_default } = body;

    // Update payment method
    const success = updatePaymentMethod(paymentMethodId, session.user.id, {
      is_default,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    // Audit log
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.log('[SECURITY] Payment method updated:', {
      user_id: session.user.id,
      payment_method_id: paymentMethodId,
      is_default,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
    });
  } catch (error: any) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.error('[ERROR] Payment method update failed:', {
      user_id: session?.user?.id,
      payment_method_id: params.id,
      error: error.message,
      ip,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payment-methods/[id] - Delete payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    const paymentMethodId = parseInt(params.id, 10);
    
    if (isNaN(paymentMethodId) || paymentMethodId <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Get payment method (for Stripe ID)
    const paymentMethod = getPaymentMethodById(paymentMethodId, session.user.id);
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Detach from Stripe customer
    try {
      await detachPaymentMethodFromCustomer(paymentMethod.stripe_payment_method_id);
    } catch (stripeError: any) {
      // Log but don't fail if Stripe detach fails (might already be detached)
      console.warn('[WARN] Stripe detach error:', {
        payment_method_id: paymentMethod.stripe_payment_method_id,
        error: stripeError.message,
      });
    }

    // Delete from database
    const success = deletePaymentMethod(paymentMethodId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      );
    }

    // Audit log
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.log('[SECURITY] Payment method deleted:', {
      user_id: session.user.id,
      payment_method_id: paymentMethodId,
      card_brand: paymentMethod.card_brand,
      card_last4: paymentMethod.card_last4,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.error('[ERROR] Payment method deletion failed:', {
      user_id: session?.user?.id,
      payment_method_id: params.id,
      error: error.message,
      ip,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}

