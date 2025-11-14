/**
 * Admin Store & Dealer Location API (Single Record)
 * GET    - Fetch location by ID
 * PUT    - Update location
 * DELETE - Remove location
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getStoreLocationById,
  updateStoreLocation,
  deleteStoreLocation,
} from '@/lib/db/store-locations';
import type { StoreLocationFormData } from '@/lib/types/store-location';
import { headers } from 'next/headers';
import { z } from 'zod';
import { storeLocationSchema } from '../route';

const RATE_LIMIT = 80;
const RATE_WINDOW_MS = 60_000;
const tracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = tracker.get(key);

  if (!entry || now > entry.resetAt) {
    tracker.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

const updateSchema = storeLocationSchema.partial();

/**
 * GET /api/admin/store-locations/[id]
 * Fetch individual store location
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-location-get-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id } = params;
    const location = getStoreLocationById(id);

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('Error fetching store location:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to fetch location',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/store-locations/[id]
 * Update store location
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-location-update-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const payload = updateSchema.parse(body) as StoreLocationFormData;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    const updated = updateStoreLocation(params.id, payload);

    return NextResponse.json({ success: true, location: updated });
  } catch (error) {
    console.error('Error updating store location:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to update location',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/store-locations/[id]
 * Delete a single location
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-location-delete-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const deleted = deleteStoreLocation(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store location:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to delete location',
      },
      { status: 500 }
    );
  }
}




