/**
 * Reorder API Route
 * 
 * POST /api/orders/[orderId]/reorder
 * Fetches all items from a previous order for quick reordering
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RateLimiter } from '@/lib/security';

// Rate limiter for reorder endpoint (10 requests per minute)
const reorderRateLimiter = new RateLimiter(10, 60 * 1000);

// Mock data structure - replace with real database queries
interface OrderItem {
  productId: number;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  brand: string;
}

interface ReorderResponse {
  success: boolean;
  items: OrderItem[];
  orderId: string;
  orderDate: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!reorderRateLimiter.isAllowed(clientId)) {
      const retryAfter = reorderRateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { 
          error: 'Too many reorder requests. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to reorder.' },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Validate order ID format
    if (!orderId || !/^\d+$/.test(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // Verify user owns this order and fetch items
    const orderItems = await fetchOrderItems(orderId, session.user.id);

    if (!orderItems) {
      return NextResponse.json(
        { error: 'Order not found or you do not have access to this order' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      items: orderItems.items,
      orderId: orderItems.orderId,
      orderDate: orderItems.orderDate,
    });

  } catch (error) {
    console.error('Error in reorder API:', error);
    return NextResponse.json(
      { error: 'Failed to process reorder request' },
      { status: 500 }
    );
  }
}

/**
 * Fetch order items for reordering
 * TODO: Replace with actual database query
 */
async function fetchOrderItems(
  orderId: string,
  userId: string
): Promise<ReorderResponse | null> {
  // Mock implementation - replace with your database query
  // Example SQL query structure:
  /*
    SELECT 
      cr.idProduct,
      p.description as productName,
      p.sku,
      cr.unitPrice as price,
      cr.quantity,
      p.smallImageUrl as image,
      p.manufacture as brand,
      ch.orderDate
    FROM cartrows cr
    JOIN products p ON cr.idProduct = p.idProduct
    JOIN carthead ch ON cr.idOrder = ch.idOrder
    WHERE cr.idOrder = @orderId 
      AND ch.idCust = @userId
      AND ch.orderStatus IN ('C', 'S', 'D') -- Only completed/shipped/delivered orders
  */

  // Mock data for development
  const mockOrderData: ReorderResponse = {
    success: true,
    orderId: orderId,
    orderDate: '2024-01-15T10:30:00Z',
    items: [
      {
        productId: 1,
        productName: 'Samsung DA29-00020B Refrigerator Water Filter',
        sku: 'DA29-00020B',
        price: 29.99,
        quantity: 2,
        image: '/images/products/samsung-filter.jpg',
        brand: 'Samsung',
      },
      {
        productId: 2,
        productName: 'Filtrete 20x25x1 Air Filter MPR 1500',
        sku: 'FILTRETE-1500',
        price: 19.99,
        quantity: 1,
        image: '/images/products/filtrete-air.jpg',
        brand: 'Filtrete',
      },
    ],
  };

  // In production, return null if order not found or user doesn't own it
  return mockOrderData;
}

/**
 * GET endpoint - not supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to reorder.' },
    { status: 405 }
  );
}

