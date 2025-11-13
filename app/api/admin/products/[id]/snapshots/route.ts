/**
 * Product Snapshot API
 * GET  - list snapshots for product
 * POST - capture new snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getProductById } from '@/lib/db/products';
import {
  createProductSnapshot,
  listProductSnapshots
} from '@/lib/db/product-snapshots';

const createSnapshotSchema = z.object({
  note: z.string().trim().max(500).optional(),
  extras: z.record(z.any()).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const product = getProductById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    const snapshots = listProductSnapshots(id, {
      limit: Number.isFinite(limitNum) ? limitNum : undefined,
      offset: Number.isFinite(offsetNum) ? offsetNum : undefined
    });

    return NextResponse.json({
      success: true,
      snapshots
    });

  } catch (error) {
    console.error('Error listing product snapshots:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDev && error instanceof Error
          ? error.message
          : 'Failed to list product snapshots'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const product = getProductById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 1048576) {
      return NextResponse.json(
        { success: false, error: 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = createSnapshotSchema.parse(body);

    if (validated.extras) {
      try {
        const extrasJson = JSON.stringify(validated.extras);
        if (Buffer.byteLength(extrasJson, 'utf-8') > 50000) {
          return NextResponse.json(
            {
              success: false,
              error: 'Extras payload is too large. Limit extras to 50KB of JSON.'
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Extras payload contains unsupported data.'
          },
          { status: 400 }
        );
      }
    }

    const snapshot = await createProductSnapshot(
      id,
      session.user.id,
      session.user.name || session.user.email,
      {
        note: validated.note ?? null,
        extras: validated.extras
      }
    );

    return NextResponse.json({
      success: true,
      snapshot
    });

  } catch (error) {
    console.error('Error creating product snapshot:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDev && error instanceof Error
          ? error.message
          : 'Failed to create product snapshot'
      },
      { status: 500 }
    );
  }
}

