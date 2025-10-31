/**
 * Admin Affiliate Settings API Routes
 * GET /api/admin/affiliates/settings - Get affiliate program settings
 * PUT /api/admin/affiliates/settings - Update affiliate program settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getAffiliateSettings, updateAffiliateSettings } from '@/lib/db/affiliates';
import { AffiliateSettings } from '@/lib/types/affiliate';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Check admin access
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const settings = getAffiliateSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[Admin Affiliate Settings API] Error:', error);
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Check admin access
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const updates: Partial<AffiliateSettings> = await request.json();

    // Validate numeric fields
    if (updates.default_commission_rate !== undefined) {
      if (updates.default_commission_rate < 0 || updates.default_commission_rate > 100) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (updates.cookie_duration_days !== undefined) {
      if (updates.cookie_duration_days < 1 || updates.cookie_duration_days > 365) {
        return NextResponse.json(
          { error: 'Cookie duration must be between 1 and 365 days' },
          { status: 400 }
        );
      }
    }

    if (updates.minimum_payout_threshold !== undefined) {
      if (updates.minimum_payout_threshold < 0) {
        return NextResponse.json(
          { error: 'Minimum payout threshold must be positive' },
          { status: 400 }
        );
      }
    }

    if (updates.commission_hold_days !== undefined) {
      if (updates.commission_hold_days < 0 || updates.commission_hold_days > 365) {
        return NextResponse.json(
          { error: 'Commission hold days must be between 0 and 365' },
          { status: 400 }
        );
      }
    }

    const settings = updateAffiliateSettings(updates);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[Admin Affiliate Settings API] Error updating settings:', error);
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

