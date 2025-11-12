/**
 * Admin Shipping Zones API
 * GET - List shipping zones for association with store locations and other modules
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getAllShippingZones } from '@/lib/db/shipping-config';
import { headers } from 'next/headers';

const RATE_LIMIT = 60;
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!checkRateLimit(`shipping-zones-${session.user.id}`)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const zones = getAllShippingZones();

    return NextResponse.json({
      success: true,
      zones,
      total: zones.length,
    });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to fetch shipping zones',
      },
      { status: 500 }
    );
  }
}


