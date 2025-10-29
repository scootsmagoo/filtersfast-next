/**
 * Returns API Routes
 * Handles return request creation and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  createReturnRequest, 
  getCustomerReturns,
  checkReturnEligibility 
} from '@/lib/db/returns-mock';
import { CreateReturnRequest } from '@/lib/types/returns';
import { sanitizeInput } from '@/lib/sanitize';
import { logAuditEvent } from '@/lib/audit-log';

/**
 * GET /api/returns
 * Get all returns for authenticated customer
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

    const returns = await getCustomerReturns(user.id);

    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/returns
 * Create a new return request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.orderId || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item must be selected for return' },
        { status: 400 }
      );
    }

    // Check return eligibility
    const eligibility = await checkReturnEligibility(body.orderId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: 'Order not eligible for return',
          reason: eligibility.reason 
        },
        { status: 400 }
      );
    }

    // Sanitize customer notes
    const customerNotes = body.customerNotes 
      ? sanitizeInput(body.customerNotes)
      : undefined;

    // Sanitize reason notes for each item
    const sanitizedItems = body.items.map((item: any) => ({
      orderItemId: sanitizeInput(item.orderItemId),
      quantity: parseInt(item.quantity, 10),
      reason: item.reason,
      reasonNotes: item.reasonNotes ? sanitizeInput(item.reasonNotes) : undefined
    }));

    const returnData: CreateReturnRequest = {
      orderId: sanitizeInput(body.orderId),
      items: sanitizedItems,
      refundMethod: body.refundMethod || 'original_payment',
      customerNotes
    };

    // Create the return request
    const returnRequest = await createReturnRequest(user.id, returnData);

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'return_created',
      resourceType: 'return',
      resourceId: returnRequest.id,
      details: {
        orderId: returnRequest.orderId,
        itemCount: returnRequest.items.length,
        refundAmount: returnRequest.refundAmount
      }
    });

    // TODO: Send email notification to customer
    // TODO: Send notification to admin/support team
    // TODO: Generate return label if auto-approved

    return NextResponse.json({ 
      success: true,
      returnRequest 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}

