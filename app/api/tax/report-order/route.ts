/**
 * TaxJar Order Reporting API Endpoint
 * Report completed orders to TaxJar for compliance tracking
 * ADMIN ONLY - Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { reportOrderToTaxJar, updateTaxJarOrder, deleteTaxJarOrder, reportRefundToTaxJar } from '@/lib/taxjar';
import { createOrderPost, isOrderPostedToTaxJar, addToRetryQueue, removeFromRetryQueue } from '@/lib/db/taxjar';
import { getOrder, getOrderItems } from '@/lib/db/orders';

// Rate limiting
const RATE_LIMIT = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get headers for auth and rate limiting
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';

    // Rate limiting
    if (!checkRateLimit(`taxjar-report-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Auth check - ADMIN ONLY
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, action = 'create' } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    // Get order details
    const order = getOrder(order_id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order items
    const items = getOrderItems(order_id);

    // Handle different actions
    switch (action) {
      case 'create':
        return await handleCreateOrder(order, items);
      case 'update':
        return await handleUpdateOrder(order, items);
      case 'delete':
        return await handleDeleteOrder(order);
      case 'refund':
        return await handleRefundOrder(order, items);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('TaxJar Order Reporting Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process TaxJar request',
      },
      { status: 500 }
    );
  }
}

async function handleCreateOrder(order: any, items: any[]) {
  try {
    // Check if already posted
    if (isOrderPostedToTaxJar(order.id)) {
      return NextResponse.json({
        success: true,
        message: 'Order already reported to TaxJar',
        already_posted: true,
      });
    }

    // Only report US orders
    const shippingAddress = order.shipping_address;
    const country = shippingAddress.country === 'USA' ? 'US' : shippingAddress.country;
    
    if (country !== 'US') {
      return NextResponse.json({
        success: false,
        message: 'Non-US orders are not reported to TaxJar',
      });
    }

    // Exclude marketplace orders (handled directly by marketplace)
    const marketplacePaymentTypes = ['amazon', 'walmart', 'ebay'];
    if (marketplacePaymentTypes.includes(order.payment_method.toLowerCase())) {
      return NextResponse.json({
        success: false,
        message: 'Marketplace orders are not reported to TaxJar',
      });
    }

    // Prepare line items with proper tax distribution
    const lineItems = items.map(item => {
      // Calculate line item's share of total tax
      const lineRatio = (item.total_price / order.subtotal) || 0;
      const lineTax = order.tax_amount * lineRatio;
      const lineDiscount = order.discount_amount * lineRatio;

      return {
        id: item.id,
        quantity: item.quantity,
        product_identifier: item.product_id,
        description: `${item.product_sku} - ${item.product_name}`,
        unit_price: item.unit_price,
        discount: lineDiscount,
        sales_tax: lineTax,
      };
    });

    // Calculate total amount (subtotal + shipping - discounts)
    const amount = order.subtotal + order.shipping_cost - order.discount_amount;

    // Prepare order data for TaxJar
    const orderData = {
      transaction_id: order.order_number,
      transaction_date: new Date(order.created_at).toISOString().split('T')[0],
      customer_id: order.user_id || undefined,
      to_country: country,
      to_zip: shippingAddress.zipCode,
      to_state: shippingAddress.state,
      to_city: shippingAddress.city,
      to_street: shippingAddress.address1,
      amount: amount,
      shipping: order.shipping_cost,
      sales_tax: order.tax_amount,
      exemption_type: undefined, // Add exemption logic if needed
      line_items: lineItems,
    };

    // Report to TaxJar
    const result = await reportOrderToTaxJar(orderData);

    // Log the result
    createOrderPost({
      order_id: order.id,
      order_status: order.status,
      tj_resp_status: result.status,
      tj_response: JSON.stringify(result.response),
      success: result.success,
    });

    if (result.success) {
      // Remove from retry queue if present
      removeFromRetryQueue(order.id);

      return NextResponse.json({
        success: true,
        message: 'Order successfully reported to TaxJar',
        transaction_id: order.order_number,
      });
    } else {
      // Add to retry queue
      addToRetryQueue({
        order_id: order.id,
        last_error: JSON.stringify(result.response),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Order reporting failed. Added to retry queue.',
          added_to_retry_queue: true,
        },
        { status: result.status }
      );
    }
  } catch (error: any) {
    console.error('Create Order Error:', error);
    
    // Add to retry queue
    addToRetryQueue({
      order_id: order.id,
      last_error: error.message,
    });

    throw error;
  }
}

async function handleUpdateOrder(order: any, items: any[]) {
  try {
    // Prepare line items
    const lineItems = items.map(item => {
      const lineRatio = (item.total_price / order.subtotal) || 0;
      const lineTax = order.tax_amount * lineRatio;
      const lineDiscount = order.discount_amount * lineRatio;

      return {
        quantity: item.quantity,
        product_identifier: item.product_id,
        unit_price: item.unit_price,
        discount: lineDiscount,
        sales_tax: lineTax,
      };
    });

    const amount = order.subtotal + order.shipping_cost - order.discount_amount;

    // Update order in TaxJar
    const result = await updateTaxJarOrder(order.order_number, {
      amount: amount,
      shipping: order.shipping_cost,
      sales_tax: order.tax_amount,
      line_items: lineItems,
      customer_id: order.user_id || undefined,
    });

    // Log the result
    createOrderPost({
      order_id: order.id,
      order_status: 'updated',
      tj_resp_status: result.status,
      tj_response: JSON.stringify(result.response),
      success: result.success,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Order successfully updated in TaxJar' : 'Failed to update order',
      transaction_id: order.order_number,
    });
  } catch (error: any) {
    console.error('Update Order Error:', error);
    throw error;
  }
}

async function handleDeleteOrder(order: any) {
  try {
    // Delete order from TaxJar (used for cancelled orders within same month)
    const result = await deleteTaxJarOrder(order.order_number);

    // Log the result
    createOrderPost({
      order_id: order.id,
      order_status: 'deleted',
      tj_resp_status: result.status,
      tj_response: JSON.stringify(result.response),
      success: result.success,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Order successfully deleted from TaxJar' : 'Failed to delete order',
      transaction_id: order.order_number,
    });
  } catch (error: any) {
    console.error('Delete Order Error:', error);
    throw error;
  }
}

async function handleRefundOrder(order: any, items: any[]) {
  try {
    const shippingAddress = order.shipping_address;
    const country = shippingAddress.country === 'USA' ? 'US' : shippingAddress.country;

    // Prepare line items for refund (negative amounts)
    const lineItems = items.map(item => {
      const lineRatio = (item.total_price / order.subtotal) || 0;
      const lineTax = order.tax_amount * lineRatio;
      const lineDiscount = order.discount_amount * lineRatio;

      return {
        id: item.id,
        quantity: item.quantity,
        product_identifier: item.product_id,
        description: `${item.product_sku} - ${item.product_name}`,
        unit_price: item.unit_price,
        discount: lineDiscount,
        sales_tax: lineTax,
      };
    });

    const amount = order.subtotal + order.shipping_cost - order.discount_amount;

    // Report refund to TaxJar
    const result = await reportRefundToTaxJar({
      transaction_id: `${order.order_number}-rf`,
      transaction_reference_id: order.order_number,
      transaction_date: new Date().toISOString().split('T')[0],
      customer_id: order.user_id || undefined,
      to_country: country,
      to_zip: shippingAddress.zipCode,
      to_state: shippingAddress.state,
      to_city: shippingAddress.city,
      to_street: shippingAddress.address1,
      amount: amount,
      shipping: order.shipping_cost,
      sales_tax: order.tax_amount,
      line_items: lineItems,
    });

    // Log the result
    createOrderPost({
      order_id: order.id,
      order_status: 'refunded',
      tj_resp_status: result.status,
      tj_response: JSON.stringify(result.response),
      success: result.success,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Refund successfully reported to TaxJar' : 'Failed to report refund',
      transaction_id: `${order.order_number}-rf`,
    });
  } catch (error: any) {
    console.error('Refund Order Error:', error);
    throw error;
  }
}

// GET endpoint to check order status in TaxJar
export async function GET(request: NextRequest) {
  try {
    // Get headers for auth
    const headersList = await headers();

    // Auth check - ADMIN ONLY
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id parameter' },
        { status: 400 }
      );
    }

    const posted = isOrderPostedToTaxJar(order_id);

    return NextResponse.json({
      order_id,
      posted_to_taxjar: posted,
    });
  } catch (error: any) {
    console.error('Check Order Status Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check order status',
      },
      { status: 500 }
    );
  }
}

