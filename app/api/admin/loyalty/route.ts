import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getLoyaltySettings,
  updateLoyaltySettings,
  getLoyaltyStats,
  getLoyaltyAccountByEmail,
  adjustLoyaltyPoints,
} from '@/lib/db/loyalty';
import { rateLimit } from '@/lib/rate-limit-admin';
import { z } from 'zod';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 300,
});

// GET - Get loyalty settings or stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 30);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      const stats = getLoyaltyStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Default: return settings
    const settings = getLoyaltySettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load loyalty data' },
      { status: 500 }
    );
  }
}

// PATCH - Update loyalty settings
const settingsSchema = z.object({
  is_enabled: z.number().int().min(0).max(1).optional(),
  points_per_dollar: z.number().positive().optional(),
  points_per_review: z.number().int().min(0).optional(),
  points_per_referral: z.number().int().min(0).optional(),
  points_per_birthday: z.number().int().min(0).optional(),
  min_redeem_amount: z.number().int().min(1).optional(),
  redemption_rate: z.number().positive().optional(),
  expiration_days: z.number().int().min(1).nullable().optional(),
  tier_enabled: z.number().int().min(0).max(1).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 20);
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', issues: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = updateLoyaltySettings(result.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'No changes to apply' },
        { status: 400 }
      );
    }

    const settings = getLoyaltySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating loyalty settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update loyalty settings' },
      { status: 500 }
    );
  }
}

