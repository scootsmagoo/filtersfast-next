/**
 * Admin: Get All Abandoned Carts
 * GET /api/admin/abandoned-carts
 * 
 * Returns paginated list of abandoned carts with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCartsForAdmin } from '@/lib/db/abandoned-carts';
import { checkPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Analytics', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'pending' | 'recovered' | 'opted_out';

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid page or limit' },
        { status: 400 }
      );
    }

    if (!['all', 'pending', 'recovered', 'opted_out'].includes(filter)) {
      return NextResponse.json(
        { error: 'Invalid filter' },
        { status: 400 }
      );
    }

    // Get abandoned carts
    const result = getAbandonedCartsForAdmin({ page, limit, filter });

    // Parse cart data for each cart (with error handling)
    const carts = result.carts.map(cart => {
      try {
        return {
          ...cart,
          cart_items: JSON.parse(cart.cart_data),
        };
      } catch {
        // Handle corrupted cart data gracefully
        return {
          ...cart,
          cart_items: [],
          _error: 'Invalid cart data',
        };
      }
    });

    // Log access
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      carts,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
      filter,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: 'Unable to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

