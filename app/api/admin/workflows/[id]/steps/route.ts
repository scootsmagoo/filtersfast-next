/**
 * Admin Workflow Steps API
 * Manage steps for a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getWorkflowById,
  addWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  type WorkflowActionType,
} from '@/lib/db/workflows';
import { headers } from 'next/headers';
import { z } from 'zod';

const createStepSchema = z.object({
  actionType: z.enum([
    'update_product',
    'update_product_status',
    'update_inventory',
    'send_email',
    'create_notification',
    'update_order_status',
    'create_backorder_notification',
    'log_event',
  ]),
  actionConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.any())])),
  stepOrder: z.number().int().min(0).max(1000).optional(),
  conditions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

const updateStepSchema = z.object({
  stepOrder: z.number().int().min(0).max(1000).optional(),
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
  actionConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.any())])).optional(),
  conditions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().nullable(),
});

/**
 * GET /api/admin/workflows/[id]/steps
 * Get all steps for a workflow
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
      steps: workflow.steps || [],
    });
  } catch (error: any) {
    console.error('Error getting workflow steps:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get workflow steps' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/workflows/[id]/steps
 * Add a step to a workflow
 */
export async function POST(
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

    const body = await request.json();
    const validation = createStepSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { actionType, actionConfig, stepOrder, conditions } = validation.data;

    const step = addWorkflowStep(params.id, actionType, actionConfig, {
      stepOrder,
      conditions,
    });

    return NextResponse.json({
      success: true,
      step,
    });
  } catch (error: any) {
    console.error('Error adding workflow step:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add workflow step' },
      { status: 500 }
    );
  }
}

