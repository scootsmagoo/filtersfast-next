/**
 * Admin Individual Return API Routes
 * Allows admins to update return status and details
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-admin';
import { getReturnById, updateReturnStatus } from '@/lib/db/returns-mock';
import { UpdateReturnStatus } from '@/lib/types/returns';
import { logAuditEvent } from '@/lib/audit-log';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * GET /api/admin/returns/:id
 * Get a specific return request (admin view with full details)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const returnRequest = await getReturnById(params.id);

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
 * PATCH /api/admin/returns/:id
 * Update return status and details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const update: UpdateReturnStatus = {
      status: body.status,
      trackingNumber: body.trackingNumber ? sanitizeInput(body.trackingNumber) : undefined,
      carrier: body.carrier ? sanitizeInput(body.carrier) : undefined,
      adminNotes: body.adminNotes ? sanitizeInput(body.adminNotes) : undefined,
      inspectionNotes: body.inspectionNotes ? sanitizeInput(body.inspectionNotes) : undefined,
      refundAmount: body.refundAmount ? parseFloat(body.refundAmount) : undefined
    };

    const returnRequest = await updateReturnStatus(params.id, update);

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id || session.user.email,
      action: 'return_updated',
      resourceType: 'return',
      resourceId: returnRequest.id,
      details: {
        status: update.status,
        previousStatus: body.previousStatus,
        adminNotes: update.adminNotes
      }
    });

    // TODO: Send email notification to customer based on status change
    // - approved: "Your return has been approved"
    // - label_sent: "Your return label is ready" + label URL
    // - received: "We've received your return"
    // - completed: "Your refund has been processed"
    // - rejected: "Your return request was not approved" + reason

    return NextResponse.json({
      success: true,
      returnRequest
    });

  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return request' },
      { status: 500 }
    );
  }
}

