import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { listProductBulkJobs } from '@/lib/db/product-bulk-jobs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const jobs = listProductBulkJobs({
      limit,
      offset,
      createdBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Failed to list bulk jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load bulk jobs' },
      { status: 500 }
    );
  }
}

