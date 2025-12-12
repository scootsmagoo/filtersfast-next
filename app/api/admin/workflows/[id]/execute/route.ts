/**
 * Admin Workflow Execution API
 * Manually trigger a workflow execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { executeWorkflow } from '@/lib/workflow-engine';
import { headers } from 'next/headers';
import { z } from 'zod';

// Rate limiting - 10 executions per minute per user
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute
const executionCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = executionCounts.get(userId);

  if (!record || now > record.resetAt) {
    executionCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

const executeWorkflowSchema = z.object({
  triggerData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

/**
 * POST /api/admin/workflows/[id]/execute
 * Manually execute a workflow
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

    // Rate limiting
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait before executing another workflow.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = executeWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const triggerData = validation.data.triggerData || {};

    const executionId = await executeWorkflow(params.id, triggerData);

    return NextResponse.json({
      success: true,
      executionId,
      message: 'Workflow execution started',
    });
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to execute workflow'
      : error.message || 'Failed to execute workflow';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

