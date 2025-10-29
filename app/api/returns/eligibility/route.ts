/**
 * Return Eligibility API Route
 * Checks if an order is eligible for return
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkReturnEligibility, getReturnPolicy } from '@/lib/db/returns-mock';

/**
 * GET /api/returns/eligibility?orderId=xxx
 * Check if an order is eligible for return
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // TODO: Verify order belongs to user

    const eligibility = await checkReturnEligibility(orderId);
    const policy = await getReturnPolicy();

    return NextResponse.json({
      eligibility,
      policy
    });

  } catch (error) {
    console.error('Error checking return eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}

