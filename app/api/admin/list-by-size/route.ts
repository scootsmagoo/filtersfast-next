/**
 * Admin API: List-by-size management
 * GET /api/admin/list-by-size
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getSizeFilterSummary, listSizeFilterEntries } from '@/lib/db/list-by-size';
import type { ListBySizeFilters } from '@/lib/types/product';

function sanitizeFilters(params: URLSearchParams): ListBySizeFilters {
  const filters: ListBySizeFilters = {};

  const search = params.get('search');
  if (search) {
    filters.search = search.slice(0, 120);
  }

  const size = params.get('size');
  if (size) {
    filters.size = size.slice(0, 50);
  }

  const active = params.get('active');
  if (active === 'all' || active === 'inactive' || active === 'active') {
    filters.active = active;
  } else {
    filters.active = 'active';
  }

  return filters;
}

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

export async function GET(request: NextRequest) {
  const permission = await checkPermission(request, 'ListBySize', 'read');
  if (!permission.authorized) {
    return withNoStore(
      NextResponse.json(
        { error: permission.message || 'Not authorized' },
        { status: 403 },
      ),
    );
  }

  try {
    const filters = sanitizeFilters(new URL(request.url).searchParams);
    const entries = listSizeFilterEntries(filters);
    const summary = getSizeFilterSummary();

    return withNoStore(
      NextResponse.json({
        success: true,
        entries,
        total: entries.length,
        filters,
        summary,
      }),
    );
  } catch (error: any) {
    console.error('[list-by-size] Failed to load entries', error);
    return withNoStore(
      NextResponse.json(
        { error: error?.message || 'Failed to load list-by-size data' },
        { status: 500 },
      ),
    );
  }
}

