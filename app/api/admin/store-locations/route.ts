/**
 * Admin Store & Dealer Locations API
 * GET  - List locations
 * POST - Create new location
 * DELETE - Bulk delete locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  createStoreLocation,
  deleteStoreLocations,
  getStoreLocations,
} from '@/lib/db/store-locations';
import type { StoreLocationFilters, StoreLocationFormData } from '@/lib/types/store-location';
import { headers } from 'next/headers';
import { z } from 'zod';

const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;
const requestTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = requestTracker.get(key);

  if (!entry || now > entry.resetAt) {
    requestTracker.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

const hoursSchema = z.record(z.string().max(32), z.string().max(64));

const servicesSchema = z.array(z.string().min(2).max(80)).max(20);

export const storeLocationSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9-]+$/i, 'Slug may only contain letters, numbers, and dashes')
    .optional()
    .transform((val) => (val ? val.toLowerCase() : val)),
  locationType: z.enum(['retail', 'dealer', 'distributor', 'service_center']),
  status: z.enum(['active', 'inactive']).optional(),
  addressLine1: z.string().min(3).max(200).trim(),
  addressLine2: z
    .string()
    .max(200)
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  city: z.string().min(2).max(120).trim(),
  state: z.string().min(2).max(60).trim(),
  postalCode: z.string().min(3).max(20).trim(),
  country: z
    .string()
    .min(2)
    .max(60)
    .trim()
    .optional()
    .transform((val) => val ?? 'US'),
  phone: z
    .string()
    .max(40)
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  email: z
    .string()
    .email()
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  website: z
    .string()
    .url()
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  googlePlaceId: z
    .string()
    .max(255)
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  latitude: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const numeric = typeof val === 'number' ? val : Number(val);
      if (Number.isNaN(numeric)) {
        throw new Error('Invalid latitude');
      }
      return numeric;
    })
    .refine((val) => val === null || (val >= -90 && val <= 90), {
      message: 'Latitude must be between -90 and 90',
    }),
  longitude: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const numeric = typeof val === 'number' ? val : Number(val);
      if (Number.isNaN(numeric)) {
        throw new Error('Invalid longitude');
      }
      return numeric;
    })
    .refine((val) => val === null || (val >= -180 && val <= 180), {
      message: 'Longitude must be between -180 and 180',
    }),
  hours: hoursSchema.optional().nullable(),
  services: servicesSchema.optional().nullable(),
  notes: z
    .string()
    .max(500)
    .transform((val) => (val?.trim().length ? val.trim() : null))
    .optional(),
  shippingZoneId: z
    .string()
    .uuid()
    .optional()
    .transform((val) => val ?? null),
  taxRegionCode: z
    .string()
    .max(20)
    .transform((val) => (val?.trim().length ? val.trim().toUpperCase() : null))
    .optional(),
  taxRateOverride: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const numeric = typeof val === 'number' ? val : Number(val);
      if (Number.isNaN(numeric)) {
        throw new Error('Invalid tax rate');
      }
      return numeric;
    })
    .refine((val) => val === null || (val >= 0 && val <= 100), {
      message: 'Tax rate override must be between 0 and 100',
    }),
});

const deleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

/**
 * GET /api/admin/store-locations
 * List store/dealer locations with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-locations-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const params = request.nextUrl.searchParams;
    const filters: StoreLocationFilters = {};

    if (params.has('search')) {
      filters.search = params.get('search') || undefined;
    }

    const states = params.getAll('state').filter(Boolean);
    if (states.length > 0) {
      filters.states = states;
    }

    const types = params.getAll('type').filter(Boolean);
    if (types.length > 0) {
      filters.types = types as StoreLocationFilters['types'];
    }

    if (params.get('status') === 'active') {
      filters.onlyActive = true;
    }

    if (params.has('limit')) {
      const limit = Number(params.get('limit'));
      if (!Number.isNaN(limit) && limit > 0) {
        filters.limit = limit;
      }
    }

    const locations = getStoreLocations(filters);

    return NextResponse.json({
      success: true,
      locations,
      total: locations.length,
    });
  } catch (error) {
    console.error('Error fetching store locations:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to fetch store locations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/store-locations
 * Create a new store/dealer location
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-locations-create-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const payload = storeLocationSchema.parse(body) as StoreLocationFormData;

    const location = createStoreLocation(payload);

    return NextResponse.json({ success: true, location }, { status: 201 });
  } catch (error) {
    console.error('Error creating store location:', error);

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
            : 'Failed to create store location',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/store-locations
 * Bulk delete locations
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`store-locations-delete-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { ids } = deleteSchema.parse(body);
    const deleted = deleteStoreLocations(ids);

    return NextResponse.json({
      success: true,
      deleted,
    });
  } catch (error) {
    console.error('Error deleting store locations:', error);

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
            : 'Failed to delete store locations',
      },
      { status: 500 }
    );
  }
}

