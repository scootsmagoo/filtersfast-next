/**
 * Customer Appliance Models API Route
 * 
 * GET /api/admin/customers/[id]/models - Get customer's saved appliance models
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getCustomerById, getCustomerModels } from '@/lib/db/customers';

/**
 * GET /api/admin/customers/[id]/models
 * Get customer's saved appliance models (refrigerators, etc.)
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
    
    const models = getCustomerModels(idCust);
    
    return NextResponse.json({
      customer: {
        idCust: customer.idCust,
        email: customer.email,
        name: customer.name,
        lastName: customer.lastName,
      },
      models,
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/customers/${params.id}/models:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch customer models' },
      { status: 500 }
    );
  }
}

