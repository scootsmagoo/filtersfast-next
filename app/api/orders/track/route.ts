/**
 * Order Tracking API Route
 * 
 * POST /api/orders/track
 * Track an order by order number and email (guest or logged-in)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/security';

// Rate limiter (20 requests per minute for tracking)
const trackingRateLimiter = new RateLimiter(20, 60 * 1000);

interface TrackingRequest {
  orderNumber: string;
  email: string;
}

interface OrderTracking {
  orderNumber: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  total: number;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery?: string;
    lastUpdate?: string;
    currentLocation?: string;
  };
  timeline: Array<{
    status: string;
    date: string;
    completed: boolean;
    description?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!trackingRateLimiter.isAllowed(clientId)) {
      const retryAfter = trackingRateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { error: 'Too many tracking requests', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Parse request
    const body: TrackingRequest = await request.json();

    // Validate inputs
    if (!body.orderNumber || body.orderNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Clean inputs
    const orderNumber = body.orderNumber.trim().toUpperCase();
    const email = body.email.trim().toLowerCase();

    // TODO: Replace with actual database query
    // Query: SELECT order details WHERE orderNumber = ? AND customerEmail = ?
    const trackingData = await getOrderTracking(orderNumber, email);

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Order not found. Please check your order number and email address.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: trackingData,
    });

  } catch (error) {
    console.error('Error in order tracking API:', error);
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    );
  }
}

/**
 * Get order tracking information
 * TODO: Replace with actual database query
 */
async function getOrderTracking(
  orderNumber: string,
  email: string
): Promise<OrderTracking | null> {
  // Mock implementation
  // In production, query carthead + cartrows tables:
  /*
    SELECT 
      ch.orderNumber,
      ch.orderDate,
      ch.orderStatus,
      ch.total,
      sh.trackingNumber,
      sh.carrier,
      sh.estimatedDelivery,
      c.email as customerEmail,
      -- ... shipping address fields
      -- ... cart items
    FROM carthead ch
    LEFT JOIN shipping sh ON ch.idOrder = sh.idOrder
    LEFT JOIN customers c ON ch.idCust = c.idCust
    WHERE ch.orderNumber = @orderNumber 
      AND (c.email = @email OR ch.guestEmail = @email)
  */

  // Mock data
  if (orderNumber === 'FF-2025-001' && email === 'test@example.com') {
    return {
      orderNumber: 'FF-2025-001',
      orderDate: '2025-01-15T10:30:00Z',
      status: 'delivered',
      items: [
        {
          id: 1,
          name: 'GE MWF Refrigerator Water Filter',
          quantity: 2,
          price: 44.99,
          image: '/products/ge-mwf.jpg',
        },
      ],
      total: 89.99,
      shippingAddress: {
        name: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
      },
      trackingInfo: {
        carrier: 'UPS',
        trackingNumber: '1Z999AA10123456784',
        trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
        estimatedDelivery: '2025-01-18',
        lastUpdate: '2025-01-18T14:30:00Z',
        currentLocation: 'Delivered',
      },
      timeline: [
        { status: 'Order Placed', date: '2025-01-15T10:30:00Z', completed: true, description: 'Your order has been received' },
        { status: 'Processing', date: '2025-01-15T14:00:00Z', completed: true, description: 'Order is being prepared' },
        { status: 'Shipped', date: '2025-01-16T08:00:00Z', completed: true, description: 'Package handed to carrier' },
        { status: 'Out for Delivery', date: '2025-01-18T06:00:00Z', completed: true, description: 'Package is on the delivery truck' },
        { status: 'Delivered', date: '2025-01-18T14:30:00Z', completed: true, description: 'Package delivered successfully' },
      ],
    };
  }

  return null;
}

/**
 * GET endpoint - not supported (use POST for security)
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to track orders.' },
    { status: 405 }
  );
}

