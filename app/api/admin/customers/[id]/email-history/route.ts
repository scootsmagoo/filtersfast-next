/**
 * Customer Email History API Route
 * 
 * GET /api/admin/customers/[id]/email-history - Get customer's email delivery history
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getCustomerById, getCustomerEmailHistory } from '@/lib/db/customers';

/**
 * GET /api/admin/customers/[id]/email-history
 * Get email delivery history for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const idCust = parseInt(params.id);
    
    if (isNaN(idCust)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }
    
    // Get customer to retrieve email address
    const customer = getCustomerById(idCust);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const emailHistory = getCustomerEmailHistory(customer.email);
    
    return NextResponse.json({
      customer: {
        idCust: customer.idCust,
        email: customer.email,
        name: customer.name,
        lastName: customer.lastName,
      },
      emailHistory,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/customers/${params.id}/email-history:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch email history' },
      { status: 500 }
    );
  }
}

