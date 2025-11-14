/**
 * Product Snapshot Download API
 * GET - download snapshot JSON file
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getProductSnapshot } from '@/lib/db/product-snapshots';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id, snapshotId } = await params;

    const snapshot = getProductSnapshot(snapshotId);
    if (!snapshot || snapshot.productId !== id) {
      return NextResponse.json(
        { success: false, error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    const json = JSON.stringify(snapshot.snapshot, null, 2);
    const res = new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${snapshot.fileName}"`,
        'Content-Length': Buffer.byteLength(json).toString()
      }
    });

    return res;

  } catch (error) {
    console.error('Error downloading product snapshot:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDev && error instanceof Error
          ? error.message
          : 'Failed to download product snapshot'
      },
      { status: 500 }
    );
  }
}








