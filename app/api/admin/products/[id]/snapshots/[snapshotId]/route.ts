/**
 * Product Snapshot Detail API
 * GET - fetch snapshot payload for product
 * DELETE - remove snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  deleteProductSnapshot,
  getProductSnapshot
} from '@/lib/db/product-snapshots';

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

    return NextResponse.json({
      success: true,
      snapshot
    });

  } catch (error) {
    console.error('Error fetching product snapshot:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDev && error instanceof Error
          ? error.message
          : 'Failed to fetch product snapshot'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const removed = await deleteProductSnapshot(snapshotId);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshotId
    });

  } catch (error) {
    console.error('Error deleting product snapshot:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDev && error instanceof Error
          ? error.message
          : 'Failed to delete product snapshot'
      },
      { status: 500 }
    );
  }
}

