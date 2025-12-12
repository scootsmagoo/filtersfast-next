/**
 * Customer Account Unlock API Route
 * 
 * POST /api/admin/customers/[id]/unlock - Unlock customer account (reset failed login attempts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { unlockCustomerAccount, getCustomerById } from '@/lib/db/customers';

/**
 * POST /api/admin/customers/[id]/unlock
 * Reset customer signin attempts to unlock account
 */
export async function POST(
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
    
    const success = unlockCustomerAccount(idCust);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unlock account' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account unlocked successfully',
    });
  } catch (error) {
    console.error(`Error in POST /api/admin/customers/${params.id}/unlock:`, error);
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    );
  }
}

