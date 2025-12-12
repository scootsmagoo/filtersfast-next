/**
 * Customer Lookup API Route
 * 
 * GET /api/admin/customers/lookup - Lookup customer/order IDs by email
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { lookupCustomersByEmail } from '@/lib/db/customers';

/**
 * GET /api/admin/customers/lookup
 * Lookup customer or order IDs by email address
 */
export async function GET(request: NextRequest) {
  try {
    // Get headers
    const headersList = await headers();
    
    // Authenticate admin user
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const excludeIdCust = parseInt(searchParams.get('excludeIdCust') || '0');
    const type = searchParams.get('type') as 'customer' | 'order' || 'customer';
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    if (type !== 'customer' && type !== 'order') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "customer" or "order"' },
        { status: 400 }
      );
    }
    
    const ids = lookupCustomersByEmail(email, excludeIdCust, type);
    
    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Error in GET /api/admin/customers/lookup:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customers' },
      { status: 500 }
    );
  }
}

