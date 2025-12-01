/**
 * One-Click Checkout API
 * 
 * Streamlined checkout for returning customers with saved payment methods and addresses
 * POST /api/checkout/one-click - Process order with saved payment method and default address
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { getDefaultPaymentMethod, getPaymentMethodById } from '@/lib/db/payment-methods';
import { getUserAddresses } from '@/lib/db/addresses';
import { getStripeOrThrow, formatAmountForStripe } from '@/lib/stripe';
import { createOrder } from '@/lib/db/orders';
import { getProductById } from '@/lib/db/products';
import { getOrCreateStripeCustomer } from '@/lib/stripe-payment-methods';
import { sanitizeText } from '@/lib/sanitize';

interface CartItem {
  id: string | number;
  productId?: string | number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  productType?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for one-click checkout
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 10, 60); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication required
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use one-click checkout.' },
        { status: 401 }
      );
    }

    // OWASP A03:2021 - Validate content length to prevent DoS
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 100000) { // 100KB max
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { items, paymentMethodId, addressId } = body as {
      items: CartItem[];
      paymentMethodId?: number;
      addressId?: number;
    };

    // OWASP A04:2021 - Idempotency key for duplicate transaction prevention
    const idempotencyKey = request.headers.get('idempotency-key');
    // Note: In production, check for duplicate transactions with same idempotency key

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // OWASP A03:2021 - Validate and sanitize all cart items
    const productCache = new Map<string, ReturnType<typeof getProductById>>();
    for (const item of items) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return NextResponse.json(
          { error: 'Invalid cart items' },
          { status: 400 }
        );
      }
      
      // OWASP A03:2021 - Sanitize string inputs to prevent injection
      if (typeof item.name === 'string') {
        item.name = sanitizeText(item.name).substring(0, 250);
      }
      if (typeof item.brand === 'string') {
        item.brand = sanitizeText(item.brand).substring(0, 100);
      }
      if (typeof item.sku === 'string') {
        item.sku = sanitizeText(item.sku).substring(0, 100);
      }
      
      if (!Number.isFinite(item.price) || item.price < 0 || item.price > 100000) {
        return NextResponse.json(
          { error: 'Invalid item price' },
          { status: 400 }
        );
      }
      
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
        return NextResponse.json(
          { error: 'Invalid item quantity' },
          { status: 400 }
        );
      }

      // Validate product exists
      const normalizeProductIdentifier = (value: unknown): string | null => {
        if (value === null || value === undefined) return null;
        const normalized = String(value).trim();
        if (!normalized) return null;
        return normalized.length > 100 ? normalized.substring(0, 100) : normalized;
      };

      const lookupId = normalizeProductIdentifier(item.productId) ?? normalizeProductIdentifier(item.id);
      if (lookupId) {
        let productRecord = productCache.get(lookupId);
        if (productRecord === undefined) {
          productRecord = getProductById(lookupId);
          productCache.set(lookupId, productRecord);
        }
        const maxCartQty = productRecord?.maxCartQty && productRecord.maxCartQty > 0
          ? productRecord.maxCartQty
          : null;
        if (maxCartQty && item.quantity > maxCartQty) {
          return NextResponse.json(
            { error: `Maximum quantity for ${productRecord?.name ?? 'this product'} is ${maxCartQty}` },
            { status: 400 }
          );
        }
      }
    }

    // OWASP A01:2021 - Validate payment method ID format and ownership
    let paymentMethod;
    if (paymentMethodId) {
      // Validate payment method ID is a positive integer
      if (!Number.isInteger(paymentMethodId) || paymentMethodId <= 0) {
        return NextResponse.json(
          { error: 'Invalid payment method ID' },
          { status: 400 }
        );
      }
      paymentMethod = getPaymentMethodById(paymentMethodId, session.user.id);
      if (!paymentMethod) {
        // OWASP A09:2021 - Log security event without exposing sensitive data
        console.log('[SECURITY] Payment method access denied:', {
          user_id: session.user.id,
          payment_method_id: paymentMethodId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: 'Payment method not found' },
          { status: 404 }
        );
      }
    } else {
      paymentMethod = getDefaultPaymentMethod(session.user.id);
      if (!paymentMethod) {
        return NextResponse.json(
          { 
            error: 'No saved payment method found',
            error_code: 'NO_PAYMENT_METHOD',
            suggestion: 'Please add a payment method in your account settings or use standard checkout.'
          },
          { status: 400 }
        );
      }
    }

    // Check if payment method is expired
    const now = new Date();
    const isExpired = paymentMethod.card_exp_year < now.getFullYear() ||
      (paymentMethod.card_exp_year === now.getFullYear() && paymentMethod.card_exp_month < now.getMonth() + 1);
    
    if (isExpired) {
      return NextResponse.json(
        { 
          error: 'Your saved payment method has expired',
          error_code: 'EXPIRED_PAYMENT_METHOD',
          suggestion: 'Please update your payment method in account settings.'
        },
        { status: 400 }
      );
    }

    // OWASP A01:2021 - Validate address ID format and ownership
    const addresses = getUserAddresses(session.user.id);
    let shippingAddress;
    
    if (addressId) {
      // Validate address ID is a positive integer
      if (!Number.isInteger(addressId) || addressId <= 0) {
        return NextResponse.json(
          { error: 'Invalid address ID' },
          { status: 400 }
        );
      }
      shippingAddress = addresses.find(addr => addr.id === addressId);
      if (!shippingAddress) {
        // OWASP A09:2021 - Log security event
        console.log('[SECURITY] Address access denied:', {
          user_id: session.user.id,
          address_id: addressId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: 'Shipping address not found' },
          { status: 404 }
        );
      }
    } else {
      shippingAddress = addresses.find(addr => addr.is_default === 1);
      if (!shippingAddress) {
        return NextResponse.json(
          { 
            error: 'No default shipping address found',
            error_code: 'NO_SHIPPING_ADDRESS',
            suggestion: 'Please add a shipping address in your account settings or use standard checkout.'
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      if (!Number.isFinite(lineTotal) || lineTotal < 0) {
        throw new Error('Invalid cart calculation');
      }
      return sum + lineTotal;
    }, 0);

    if (!Number.isFinite(subtotal) || subtotal > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json(
        { error: 'Cart total exceeds maximum' },
        { status: 400 }
      );
    }

    // Check if shipping is required
    const requiresShipping = items.some(item => (item.productType ?? '').toLowerCase() !== 'gift-card');
    
    // Calculate shipping - simplified for one-click checkout
    // Free shipping if over $50, otherwise $9.99
    let shippingCost = 0;
    if (requiresShipping) {
      shippingCost = subtotal >= 50 ? 0 : 9.99;
    }

    // Calculate tax using TaxJar API
    let taxAmount = 0;
    if (requiresShipping) {
      try {
        const taxResponse = await fetch(`${request.nextUrl.origin}/api/tax/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: shippingAddress.address_line1,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.postal_code,
            country: shippingAddress.country,
            subtotal,
            shipping: shippingCost,
            line_items: items.map(item => ({
              quantity: item.quantity,
              unit_price: item.price,
            })),
          }),
        });

        if (taxResponse.ok) {
          const taxData = await taxResponse.json();
          taxAmount = taxData.tax?.amount || 0;
        }
      } catch (error) {
        console.error('Tax calculation error:', error);
        // Continue with zero tax on error
        taxAmount = 0;
      }
    }

    const total = subtotal + shippingCost + taxAmount;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email || '',
      session.user.name || undefined
    );

    // Create Payment Intent with saved payment method
    const stripe = getStripeOrThrow();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(total, 'usd'),
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.stripe_payment_method_id,
      confirmation_method: 'automatic',
      confirm: true,
      return_url: `${request.nextUrl.origin}/checkout/success`,
      metadata: {
        user_id: session.user.id,
        order_type: 'one_click_checkout',
        // OWASP A02:2021 - Limit metadata size, sanitize sensitive data
        items: JSON.stringify(items.map(item => ({
          id: String(item.id).substring(0, 100),
          name: sanitizeText(item.name).substring(0, 100),
          quantity: item.quantity,
          price: item.price,
        }))).substring(0, 4000),
        idempotency_key: idempotencyKey || undefined,
      },
      shipping: {
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.address_line1,
          line2: shippingAddress.address_line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
        phone: shippingAddress.phone || undefined,
      },
    });

    // Check if payment requires additional action (3D Secure, etc.)
    if (paymentIntent.status === 'requires_action' && paymentIntent.next_action) {
      return NextResponse.json({
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    }

    // If payment failed
    if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      return NextResponse.json(
        { 
          error: 'Payment failed. Please try a different payment method.',
          error_code: 'PAYMENT_FAILED',
          payment_intent_id: paymentIntent.id
        },
        { status: 400 }
      );
    }

    // Payment succeeded - create order
    if (paymentIntent.status === 'succeeded') {
      const order = createOrder({
        user_id: session.user.id,
        email: session.user.email || '',
        order_items: items.map(item => ({
          product_id: String(item.productId || item.id),
          name: item.name,
          brand: item.brand,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          metadata: item.metadata,
        })),
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total,
        payment_method: 'stripe',
        payment_method_type: 'card',
        payment_intent_id: paymentIntent.id,
        shipping_address: {
          name: shippingAddress.name,
          address_line1: shippingAddress.address_line1,
          address_line2: shippingAddress.address_line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
          phone: shippingAddress.phone || undefined,
        },
        billing_address: {
          name: paymentMethod.billing_name || shippingAddress.name,
          address_line1: paymentMethod.billing_address_line1 || shippingAddress.address_line1,
          address_line2: paymentMethod.billing_address_line2 || shippingAddress.address_line2 || undefined,
          city: paymentMethod.billing_address_city || shippingAddress.city,
          state: paymentMethod.billing_address_state || shippingAddress.state,
          postal_code: paymentMethod.billing_address_zip || shippingAddress.postal_code,
          country: paymentMethod.billing_address_country || shippingAddress.country,
        },
        status: 'pending',
      });

      // Update last used timestamp on payment method
      // OWASP A01:2021 - Ensure payment method belongs to user (already verified above)
      const db = require('better-sqlite3')(process.env.DATABASE_URL || './auth.db');
      const updateStmt = db.prepare(`
        UPDATE saved_payment_methods 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `);
      updateStmt.run(paymentMethod.id, session.user.id);
      db.close();

      // OWASP A09:2021 - Security logging
      console.log('[SECURITY] One-click checkout completed:', {
        user_id: session.user.id,
        order_id: order.id,
        order_number: order.order_number,
        payment_intent_id: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        order_id: order.id,
        order_number: order.order_number,
        payment_intent_id: paymentIntent.id,
        total,
      });
    }

    // Unexpected status
    return NextResponse.json(
      { 
        error: 'Payment processing incomplete. Please check your order status.',
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status
      },
      { status: 500 }
    );

  } catch (error: any) {
    // OWASP A09:2021 - Security logging without sensitive data exposure
    // OWASP A05:2021 - Generic error messages to prevent information disclosure
    console.error('[ERROR] One-click checkout failed:', {
      error_type: error.type || 'unknown',
      error_message: error.message?.substring(0, 100) || 'Unknown error',
      user_id: session?.user?.id || 'unknown',
      timestamp: new Date().toISOString(),
      // Don't log full error details or sensitive data
    });
    
    // OWASP A05:2021 - Generic error message
    return NextResponse.json(
      { error: 'Failed to process one-click checkout. Please try again or use standard checkout.' },
      { status: 500 }
    );
  }
}

