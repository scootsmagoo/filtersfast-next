/**
 * Customer Account Merge API Route
 * 
 * POST /api/admin/customers/merge - Merge customer accounts or orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { mergeCustomerAccounts, getCustomerById } from '@/lib/db/customers';
import type { CustomerMergeRequest } from '@/lib/types/customer';

/**
 * POST /api/admin/customers/merge
 * Merge customer accounts by customer IDs or order IDs
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { idCustTo, mergeType, mergeIDs, markInactive } = body;
    
    // Validate input
    if (!idCustTo || !mergeType || !mergeIDs || !Array.isArray(mergeIDs)) {
      return NextResponse.json(
        { error: 'Missing required fields: idCustTo, mergeType, mergeIDs' },
        { status: 400 }
      );
    }
    
    if (mergeType !== 'customer' && mergeType !== 'order') {
      return NextResponse.json(
        { error: 'Invalid mergeType. Must be "customer" or "order"' },
        { status: 400 }
      );
    }
    
    // Verify target customer exists
    const targetCustomer = getCustomerById(idCustTo);
    if (!targetCustomer) {
      return NextResponse.json(
        { error: 'Target customer not found' },
        { status: 404 }
      );
    }
    
    const mergeRequest: CustomerMergeRequest = {
      idCustTo,
      mergeType,
      mergeIDs: mergeIDs.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)),
      markInactive: Boolean(markInactive),
    };
    
    // Get admin ID from session (you may need to adjust this based on your auth setup)
    // For now, using a placeholder admin ID
    const adminId = 1; // TODO: Get from session/user table
    
    const result = mergeCustomerAccounts(mergeRequest, adminId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to merge accounts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      mergedCount: result.mergedCount,
      message: `Successfully merged ${result.mergedCount} order(s)`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/customers/merge:', error);
    return NextResponse.json(
      { error: 'Failed to merge accounts' },
      { status: 500 }
    );
  }
}

