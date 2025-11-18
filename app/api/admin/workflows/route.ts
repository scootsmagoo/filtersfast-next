/**
 * Admin Workflows API
 * CRUD operations for automated workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  createWorkflow,
  listWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  type WorkflowTriggerType,
} from '@/lib/db/workflows';
import { headers } from 'next/headers';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  triggerType: z.enum(['event', 'schedule', 'manual']),
  triggerConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  triggerType: z.enum(['event', 'schedule', 'manual']).optional(),
  triggerConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/workflows
 * List all workflows
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const triggerType = searchParams.get('triggerType') as WorkflowTriggerType | null;

    try {
      const workflows = listWorkflows({
        includeInactive,
        triggerType: triggerType || undefined,
      });

      return NextResponse.json({
        success: true,
        workflows,
      });
    } catch (dbError: any) {
      console.error('Database error listing workflows:', dbError);
      // If it's a table doesn't exist error, try to initialize
      if (dbError.message?.includes('no such table') || dbError.message?.includes('does not exist')) {
        try {
          const { initWorkflowTables } = await import('@/lib/db/workflows');
          initWorkflowTables();
          const workflows = listWorkflows({
            includeInactive,
            triggerType: triggerType || undefined,
          });
          return NextResponse.json({
            success: true,
            workflows,
          });
        } catch (initError: any) {
          console.error('Error initializing workflow tables:', initError);
          return NextResponse.json(
            { success: false, error: `Failed to initialize workflow tables: ${initError.message}` },
            { status: 500 }
          );
        }
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error listing workflows:', error);
    // Security: Don't expose stack traces in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to list workflows'
      : error.message || 'Failed to list workflows';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, triggerType, triggerConfig, isActive } = validation.data;

    const workflow = createWorkflow(name, session.user.id, {
      description,
      triggerType,
      triggerConfig,
      isActive,
    });

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

