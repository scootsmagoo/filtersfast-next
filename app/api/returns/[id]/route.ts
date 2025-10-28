/**
 * Individual Return API Routes
 * Handles operations on specific return requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getReturnById, cancelReturnRequest } from '@/lib/db/returns-mock';
import { logAuditEvent } from '@/lib/audit-log';

/**
 * GET /api/returns/:id
 * Get a specific return request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuth();
    const user = auth?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const returnRequest = await getReturnById(params.id, user.id);

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnRequest });
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/returns/:id
 * Cancel a return request (only pending returns)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuth();
    const user = auth?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const returnRequest = await cancelReturnRequest(params.id, user.id);

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'return_cancelled',
      resourceType: 'return',
      resourceId: returnRequest.id,
      details: {
        orderId: returnRequest.orderId
      }
    });

    return NextResponse.json({ 
      success: true,
      returnRequest 
    });

  } catch (error: any) {
    console.error('Error cancelling return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel return request' },
      { status: 400 }
    );
  }
}

