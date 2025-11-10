import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getProductBulkJob,
  getProductBulkJobResult
} from '@/lib/db/product-bulk-jobs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const job = getProductBulkJob(id, { createdBy: session.user.id });
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Job has not completed yet' },
        { status: 409 }
      );
    }

    const result = getProductBulkJobResult(id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No export file found for this job' },
        { status: 404 }
      );
    }

    return new NextResponse(result.content, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`
      }
    });
  } catch (error) {
    console.error('Failed to download job result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download job result' },
      { status: 500 }
    );
  }
}

