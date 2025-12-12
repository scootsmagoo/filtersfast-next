/**
 * Admin Workflow Executions API
 * Get execution history for a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getWorkflowExecutions, type WorkflowExecutionStatus } from '@/lib/db/workflows';
import { headers } from 'next/headers';

/**
 * GET /api/admin/workflows/[id]/executions
 * Get execution history for a workflow
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') as WorkflowExecutionStatus | null;

    const executions = getWorkflowExecutions(params.id, {
      limit,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      executions,
    });
  } catch (error: any) {
    console.error('Error getting workflow executions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get workflow executions' },
      { status: 500 }
    );
  }
}

