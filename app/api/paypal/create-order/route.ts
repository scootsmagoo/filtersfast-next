import { NextRequest, NextResponse } from 'next/server';
import { logPayPalTransaction } from '@/lib/db/paypal-transactions';
import { rateLimit } from '@/lib/rate-limit';
import DOMPurify from 'isomorphic-dompurify';

// OWASP A07: Rate limiting - 10 requests per minute per IP
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
        await limiter.check(identifier, 10);
      } catch {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    
    const { 
      items, 
      subtotal, 
      shipping, 
      tax, 
      discount = 0,
      handling = 0,
      donation = 0,
      insurance = 0,
      total,
      shippingAddress,
      customerEmail,
      customerName 
    } = body;

    // OWASP A03: Input Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Too many items in cart' },
        { status: 400 }
      );
    }

    // OWASP A03: Validate numeric inputs
    if (typeof subtotal !== 'number' || subtotal < 0 || subtotal > 999999) {
      return NextResponse.json(
        { error: 'Invalid subtotal' },
        { status: 400 }
      );
    }

    // OWASP A04: Insecure Design - Recalculate totals server-side (don't trust client)
    const calculatedSubtotal = items.reduce((sum: number, item: any) => {
      // Validate each item
      if (typeof item.price !== 'number' || item.price < 0 || item.price > 99999) {
        throw new Error('Invalid item price');
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 1000) {
        throw new Error('Invalid item quantity');
      }
      return sum + (item.price * item.quantity);
    }, 0);

    // Validate calculated total matches provided total (prevent price manipulation)
    const itemTotal = calculatedSubtotal + (donation || 0) + (insurance || 0);
    const serverCalculatedTotal = itemTotal + (shipping || 0) + (tax || 0) + (handling || 0) - (discount || 0);
    
    // Allow 1 cent difference for rounding
    if (Math.abs(serverCalculatedTotal - total) > 0.01) {
      console.error('Total mismatch:', { serverCalculatedTotal, clientTotal: total });
      return NextResponse.json(
        { error: 'Order total verification failed. Please refresh and try again.' },
        { status: 400 }
      );
    }

    const finalTotal = serverCalculatedTotal;

    // OWASP A03: Input Sanitization - Sanitize text inputs to prevent XSS
    const sanitizedCustomerName = DOMPurify.sanitize(customerName || '').substring(0, 255);
    const sanitizedCustomerEmail = DOMPurify.sanitize(customerEmail || '').substring(0, 255);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedCustomerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create PayPal order payload with full breakdown
    const orderPayload: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'default',
          invoice_id: `FF-${Date.now()}`,
          amount: {
            currency_code: 'USD',
            value: finalTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: itemTotal.toFixed(2),
              },
              shipping: {
                currency_code: 'USD',
                value: (shipping || 0).toFixed(2),
              },
              tax_total: {
                currency_code: 'USD',
                value: (tax || 0).toFixed(2),
              },
              handling: {
                currency_code: 'USD',
                value: (handling || 0).toFixed(2),
              },
              discount: {
                currency_code: 'USD',
                value: (discount || 0).toFixed(2),
              },
            },
          },
          items: [
            ...items.map((item: any) => ({
              // OWASP A03: Sanitize item names
              name: DOMPurify.sanitize(item.name || 'Product').substring(0, 127), // PayPal max length
              unit_amount: {
                currency_code: 'USD',
                value: item.price.toFixed(2),
              },
              quantity: item.quantity.toString(),
              // OWASP A03: Sanitize SKU
              sku: DOMPurify.sanitize(item.sku || item.id).substring(0, 127),
              category: 'PHYSICAL_GOODS',
            })),
            // Add donation as line item if present
            ...(donation > 0 ? [{
              name: 'Charitable Donation',
              unit_amount: {
                currency_code: 'USD',
                value: donation.toFixed(2),
              },
              quantity: '1',
              category: 'DONATION',
            }] : []),
            // Add insurance as line item if present
            ...(insurance > 0 ? [{
              name: 'Shipping Insurance',
              unit_amount: {
                currency_code: 'USD',
                value: insurance.toFixed(2),
              },
              quantity: '1',
              category: 'PHYSICAL_GOODS',
            }] : []),
          ],
        },
      ],
      application_context: {
        brand_name: 'FiltersFast',
        landing_page: 'NO_PREFERENCE',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
        return_url: `${request.nextUrl.origin}/checkout/paypal-return`,
        cancel_url: `${request.nextUrl.origin}/checkout`,
      },
    };

    // Add shipping address if provided
    if (shippingAddress) {
      // OWASP A03: Sanitize address fields
      orderPayload.purchase_units[0].shipping = {
        name: {
          full_name: DOMPurify.sanitize(shippingAddress.name || sanitizedCustomerName).substring(0, 300),
        },
        address: {
          address_line_1: DOMPurify.sanitize(shippingAddress.address_line1 || shippingAddress.address1 || '').substring(0, 300),
          address_line_2: DOMPurify.sanitize(shippingAddress.address_line2 || shippingAddress.address2 || '').substring(0, 300),
          admin_area_2: DOMPurify.sanitize(shippingAddress.city || '').substring(0, 120),
          admin_area_1: DOMPurify.sanitize(shippingAddress.state || '').substring(0, 50),
          postal_code: DOMPurify.sanitize(shippingAddress.postal_code || shippingAddress.zipCode || '').substring(0, 20),
          country_code: (shippingAddress.country || 'US').substring(0, 2).toUpperCase(),
        },
      };
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
          paypal_order_id: 'auth_error',
          transaction_type: 'error',
          status: 'FAILED',
          amount: finalTotal,
          currency: 'USD',
          error_message: errorMsg,
          raw_request: { action: 'get_token' },
          raw_response: tokenData,
        });
      } catch (logError) {
        console.error('Failed to log PayPal error:', logError);
      }
      
      throw new Error(errorMsg);
    }

    // Create order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'PayPal-Request-Id': `order-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      const errorMsg = `PayPal order error: ${orderData.message || 'Unknown error'}`;
      
      // Log error
      try {
        logPayPalTransaction({
          paypal_order_id: orderData.debug_id || 'create_error',
          transaction_type: 'error',
          status: 'FAILED',
          amount: finalTotal,
          currency: 'USD',
          error_message: errorMsg,
          raw_request: orderPayload,
          raw_response: orderData,
        });
      } catch (logError) {
        console.error('Failed to log PayPal error:', logError);
      }
      
      throw new Error(errorMsg);
    }

    // Log successful order creation
    try {
      // OWASP A09: Sanitize logs - Remove sensitive data before logging
      const sanitizedRequest = {
        ...orderPayload,
        // Remove customer email from logs
        customer_email: undefined,
      };
      
      const sanitizedResponse = {
        id: orderData.id,
        status: orderData.status,
        intent: orderData.intent,
        // Don't log full response with potential PII
      };
      
      logPayPalTransaction({
        paypal_order_id: orderData.id,
        transaction_type: 'create',
        status: orderData.status,
        amount: finalTotal,
        currency: 'USD',
        payment_source: 'paypal',
        raw_request: sanitizedRequest,
        raw_response: sanitizedResponse,
      });
    } catch (logError) {
      console.error('Failed to log PayPal transaction:', logError);
    }

    // OWASP A05: Security Headers
    const response = NextResponse.json({
      orderId: orderData.id,
      status: orderData.status,
      approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href,
    });
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    
    // OWASP A09: Don't leak implementation details in error messages
    const errorMessage = error instanceof Error && error.message.includes('Invalid') 
      ? error.message 
      : 'Failed to create PayPal order. Please try again.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
