/**
 * Admin Workflow Step API (Single Step)
 * Update or delete a specific workflow step
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getWorkflowById,
  updateWorkflowStep,
  deleteWorkflowStep,
} from '@/lib/db/workflows';
import { headers } from 'next/headers';
import { z } from 'zod';

const updateStepSchema = z.object({
  stepOrder: z.number().int().optional(),
  actionType: z.enum([
    'update_product',
    'update_product_status',
    'update_inventory',
    'send_email',
    'create_notification',
    'update_order_status',
    'create_backorder_notification',
    'log_event',
  ]).optional(),
  actionConfig: z.record(z.any()).optional(),
  conditions: z.record(z.any()).optional().nullable(),
});

/**
 * PATCH /api/admin/workflows/[id]/steps/[stepId]
 * Update a workflow step
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Validate IDs format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.stepId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const workflow = getWorkflowById(params.id);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateStepSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const step = updateWorkflowStep(params.stepId, validation.data);

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      step,
    });
  } catch (error: any) {
    console.error('Error updating workflow step:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workflow step' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/workflows/[id]/steps/[stepId]
 * Delete a workflow step
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Validate IDs format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.stepId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const workflow = getWorkflowById(params.id);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const deleted = deleteWorkflowStep(params.stepId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Step deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting workflow step:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete workflow step' },
      { status: 500 }
    );
  }
}

