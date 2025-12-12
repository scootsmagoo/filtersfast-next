/**
 * Admin Workflow API (Single Workflow)
 * Get, update, or delete a specific workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  type WorkflowTriggerType,
} from '@/lib/db/workflows';
import { headers } from 'next/headers';
import { z } from 'zod';

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  triggerType: z.enum(['event', 'schedule', 'manual']).optional(),
  triggerConfig: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/workflows/[id]
 * Get a specific workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Validate workflow ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID format' },
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

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error('Error getting workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/workflows/[id]
 * Update a workflow
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Validate workflow ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const workflow = updateWorkflow(params.id, validation.data);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Validate workflow ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID format' },
        { status: 400 }
      );
    }

    const deleted = deleteWorkflow(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}

