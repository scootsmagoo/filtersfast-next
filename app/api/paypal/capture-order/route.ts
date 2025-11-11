import { NextRequest, NextResponse } from 'next/server';
import { logPayPalTransaction, updatePayPalTransactionOrderId } from '@/lib/db/paypal-transactions';
import { createOrder } from '@/lib/db/orders';
import type { CreateOrderRequest } from '@/lib/types/order';
import { rateLimit } from '@/lib/rate-limit';
import DOMPurify from 'isomorphic-dompurify';

// OWASP A07: Rate limiting - 5 requests per minute per IP (lower for captures)
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // OWASP A07: Rate limiting (disabled in development)
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous';
      try {
        await limiter.check(identifier, 5);
      } catch {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    
    const { 
      orderId: paypalOrderId,
      orderData  // Contains cart items, shipping, customer info, etc.
    } = body;

    // OWASP A03: Input Validation
    if (!paypalOrderId || typeof paypalOrderId !== 'string') {
      return NextResponse.json(
        { error: 'PayPal Order ID is required' },
        { status: 400 }
      );
    }

    // Validate PayPal order ID format
    if (!/^[A-Z0-9]{17}$/.test(paypalOrderId) && !/^[0-9A-Z\-]{10,50}$/.test(paypalOrderId)) {
      return NextResponse.json(
        { error: 'Invalid PayPal Order ID format' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const errorMsg = `PayPal token error: ${tokenData.error_description || 'Unknown error'}`;
      
      // Log error
      try {
        logPayPalTransaction({
          paypal_order_id: paypalOrderId,
          transaction_type: 'error',
          status: 'FAILED',
          amount: 0,
          currency: 'USD',
          error_message: errorMsg,
          raw_request: { action: 'get_token_for_capture' },
          raw_response: tokenData,
        });
      } catch (logError) {
        console.error('Failed to log PayPal error:', logError);
      }
      
      throw new Error(errorMsg);
    }

    // Capture order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      const errorMsg = `PayPal capture error: ${captureData.message || 'Unknown error'}`;
      
      // Log error
      try {
        logPayPalTransaction({
          paypal_order_id: paypalOrderId,
          transaction_type: 'error',
          status: 'FAILED',
          amount: 0,
          currency: 'USD',
          error_message: errorMsg,
          raw_request: { action: 'capture', paypalOrderId },
          raw_response: captureData,
        });
      } catch (logError) {
        console.error('Failed to log PayPal error:', logError);
      }

      // Check for specific errors
      if (captureData.details && captureData.details.some((d: any) => d.issue === 'INSTRUMENT_DECLINED')) {
        return NextResponse.json(
          { error: 'Your payment method was declined. Please try a different payment method.' },
          { status: 400 }
        );
      }
      
      throw new Error(errorMsg);
    }

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = captureData.payer;
    const amount = capture?.amount;
    const paymentSource = captureData.payment_source;

    // Determine payment source (PayPal, Venmo, etc.)
    let source: 'paypal' | 'venmo' | 'credit' = 'paypal';
    if (paymentSource?.venmo) {
      source = 'venmo';
    } else if (paymentSource?.card) {
      source = 'credit';
    }

    // Log successful capture
    // OWASP A09: Sanitize logs - Remove PII from logs
    const sanitizedCaptureResponse = {
      id: captureData.id,
      status: captureData.status,
      amount: amount,
      // Don't log payer email or other PII
    };
    
    const transactionLogId = logPayPalTransaction({
      paypal_order_id: paypalOrderId,
      payer_id: payer?.payer_id,
      transaction_type: 'capture',
      status: captureData.status,
      amount: parseFloat(amount?.value || '0'),
      currency: amount?.currency_code || 'USD',
      payment_source: source,
      raw_request: { action: 'capture', paypalOrderId },
      raw_response: sanitizedCaptureResponse,
    });

    // Create order in database if orderData is provided
    let dbOrder = null;
    if (orderData) {
      try {
        // OWASP A03: Sanitize all text inputs before database insertion
        const sanitizedEmail = DOMPurify.sanitize(orderData.customerEmail || payer?.email_address || '').substring(0, 255);
        const sanitizedName = DOMPurify.sanitize(orderData.customerName || `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim()).substring(0, 255);
        
        const appliedDeals = Array.isArray(orderData.appliedDeals)
          ? orderData.appliedDeals.slice(0, 20).map((deal: any) => {
              const id = Number(deal?.id)
              if (!Number.isFinite(id)) return null
              const description = DOMPurify.sanitize(String(deal?.description || '')).substring(0, 200)
              return { id, description }
            }).filter(Boolean) as Array<{ id: number; description: string }>
          : []

        const orderRequest: CreateOrderRequest = {
          customer_email: sanitizedEmail,
          customer_name: sanitizedName,
          is_guest: orderData.isGuest !== undefined ? orderData.isGuest : true,
          user_id: orderData.userId || null,
          items: orderData.items.map((item: any) => ({
            product_id: DOMPurify.sanitize(item.id).substring(0, 255),
            product_name: DOMPurify.sanitize(item.name || '').substring(0, 500),
            product_sku: DOMPurify.sanitize(item.sku || item.id).substring(0, 255),
            product_image: item.image ? DOMPurify.sanitize(item.image).substring(0, 1000) : null,
            quantity: Math.max(1, Math.min(1000, parseInt(item.quantity) || 1)),
            unit_price: parseFloat(item.price) || 0,
          })),
          shipping_address: {
            name: DOMPurify.sanitize(orderData.shippingAddress?.name || '').substring(0, 255),
            address_line1: DOMPurify.sanitize(orderData.shippingAddress?.address_line1 || orderData.shippingAddress?.address1 || '').substring(0, 255),
            address_line2: DOMPurify.sanitize(orderData.shippingAddress?.address_line2 || orderData.shippingAddress?.address2 || '').substring(0, 255),
            city: DOMPurify.sanitize(orderData.shippingAddress?.city || '').substring(0, 100),
            state: DOMPurify.sanitize(orderData.shippingAddress?.state || '').substring(0, 50),
            postal_code: DOMPurify.sanitize(orderData.shippingAddress?.postal_code || orderData.shippingAddress?.zipCode || '').substring(0, 20),
            country: (orderData.shippingAddress?.country || 'US').substring(0, 2),
            phone: orderData.shippingAddress?.phone ? DOMPurify.sanitize(orderData.shippingAddress.phone).substring(0, 20) : undefined,
          },
          billing_address: orderData.billingAddress || orderData.shippingAddress,
          payment_method: 'paypal',
          payment_intent_id: paypalOrderId,
          transaction_id: capture?.id,
          subtotal: parseFloat(orderData.subtotal) || 0,
          discount_amount: parseFloat(orderData.discount) || 0,
          shipping_cost: parseFloat(orderData.shipping) || 0,
          tax_amount: parseFloat(orderData.tax) || 0,
          total: parseFloat(amount?.value || '0'),
          promo_code: orderData.promoCode ? DOMPurify.sanitize(orderData.promoCode).substring(0, 50) : undefined,
          promo_discount: parseFloat(orderData.promoDiscount) || 0,
          donation_amount: parseFloat(orderData.donation) || 0,
          donation_charity_id: orderData.donationCharityId || undefined,
          customer_notes: orderData.customerNotes ? DOMPurify.sanitize(orderData.customerNotes).substring(0, 1000) : undefined,
          shipping_method: orderData.shippingMethod ? DOMPurify.sanitize(orderData.shippingMethod).substring(0, 255) : undefined,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent')?.substring(0, 500) || null,
          source: 'web',
          applied_deals: appliedDeals,
        };

        dbOrder = createOrder(orderRequest);

        // Update transaction log with order ID
        updatePayPalTransactionOrderId(paypalOrderId, dbOrder.id);

      } catch (orderError) {
        console.error('Error creating order in database:', orderError);
        // Don't fail the whole request if order creation fails
        // The transaction is already captured
      }
    }

    // OWASP A05: Security Headers
    const response = NextResponse.json({
      success: true,
      paypalOrderId: captureData.id,
      orderId: dbOrder?.id || null,
      orderNumber: dbOrder?.order_number || null,
      status: captureData.status,
      amount: amount,
      payer: {
        email: payer?.email_address,
        name: `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim(),
        payerId: payer?.payer_id,
      },
      paymentSource: source,
      transactionId: capture?.id,
    });
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    
    // OWASP A09: Don't leak implementation details in error messages
    const errorMessage = error instanceof Error && error.message.includes('declined') 
      ? error.message 
      : 'Failed to process PayPal payment. Please try again.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
