/**
 * Individual Return API Routes
 * Handles operations on specific return requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReturnById, cancelReturnRequest } from '@/lib/db/returns-mock';
// import { logAuditEvent } from '@/lib/audit-log';

/**
 * GET /api/returns/:id
 * Get a specific return request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const returnRequest = await getReturnById(id, user.id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const returnRequest = await cancelReturnRequest(id, user.id);

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Audit logging removed
    console.log('[INFO] Return cancelled:', { userId: user.id, returnId: id });

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

