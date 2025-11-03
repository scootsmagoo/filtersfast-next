/**
 * Customer Payment Logs API Route
 * 
 * GET /api/admin/customers/[id]/payment-logs - Get customer's payment processing logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getCustomerById, getCustomerPaymentLogs } from '@/lib/db/customers';

/**
 * GET /api/admin/customers/[id]/payment-logs
 * Get payment processing history for a customer
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
    
    // Verify customer exists
    const customer = getCustomerById(idCust);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const paymentLogs = getCustomerPaymentLogs(idCust);
    
    return NextResponse.json({
      customer: {
        idCust: customer.idCust,
        email: customer.email,
        name: customer.name,
        lastName: customer.lastName,
      },
      paymentLogs,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/customers/${params.id}/payment-logs:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch payment logs' },
      { status: 500 }
    );
  }
}

