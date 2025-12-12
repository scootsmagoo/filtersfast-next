/**
 * Admin API: List-by-size entry mutations
 * GET, PATCH /api/admin/list-by-size/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getSizeFilterEntryById, toggleSizeFilterEntry } from '@/lib/db/list-by-size';

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const permission = await checkPermission(request, 'ListBySize', 'read');
  if (!permission.authorized) {
    return withNoStore(
      NextResponse.json(
        { error: permission.message || 'Not authorized' },
        { status: 403 },
      ),
    );
  }

  const entry = getSizeFilterEntryById(params.id);
  if (!entry) {
    return withNoStore(
      NextResponse.json({ error: 'Entry not found' }, { status: 404 }),
    );
  }

  return withNoStore(NextResponse.json({ success: true, entry }));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const permission = await checkPermission(request, 'ListBySize', 'write');
  if (!permission.authorized) {
    return withNoStore(
      NextResponse.json(
      { error: permission.message || 'Not authorized' },
      { status: 403 },
      ),
    );
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const action = payload?.action || 'toggle-active';

    if (action !== 'toggle-active') {
      return withNoStore(
        NextResponse.json(
          { error: `Unsupported action "${action}"` },
          { status: 400 },
        ),
      );
    }

    const updated = toggleSizeFilterEntry(params.id);
    return withNoStore(NextResponse.json({ success: true, entry: updated }));
  } catch (error: any) {
    console.error('[list-by-size] Failed to update entry', error);
    return withNoStore(
      NextResponse.json(
        { error: error?.message || 'Failed to update list-by-size entry' },
        { status: 500 },
      ),
    );
  }
}

