import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getProductBulkJobWithItems } from '@/lib/db/product-bulk-jobs';

export async function GET(
  request: NextRequest,
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('itemsLimit') || '100', 10);
    const offset = parseInt(searchParams.get('itemsOffset') || '0', 10);

    const result = getProductBulkJobWithItems(id, {
      limit,
      offset,
      createdBy: session.user.id
    });

    if (!result.job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result.job,
      items: result.items,
      itemsPagination: {
        total: result.totalItems,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Failed to load bulk job detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load job details' },
      { status: 500 }
    );
  }
}

