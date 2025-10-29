/**
 * Admin: Get All Abandoned Carts
 * GET /api/admin/abandoned-carts
 * 
 * Returns paginated list of abandoned carts with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCartsForAdmin } from '@/lib/db/abandoned-carts';
import { auth } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let session: any = null;
  
  try {
    // Check authentication and admin role
    session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      // Audit log - unauthorized access attempt
      console.warn('[SECURITY] Unauthorized abandoned cart admin access attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        user_id: session?.user?.id || 'none',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Audit log - admin accessed abandoned carts
    const duration = Date.now() - startTime;
    console.log('[AUDIT] Admin accessed abandoned carts', {
      admin_id: session.user.id,
      admin_email: session.user.email,
      filter,
      page,
      results_count: carts.length,
      duration_ms: duration,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

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
    // Security: Don't expose internal details
    console.error('[ERROR] Failed to fetch abandoned carts:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      admin_id: session?.user?.id,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'Unable to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

