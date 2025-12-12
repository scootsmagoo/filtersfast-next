import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getLoyaltyTiers } from '@/lib/db/loyalty';
import { rateLimit } from '@/lib/rate-limit-admin';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 300,
});

// GET - Get all loyalty tiers
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 30);
    }

    const tiers = getLoyaltyTiers();

    return NextResponse.json({
      success: true,
      tiers: tiers.map(t => ({
        id: t.id,
        tierLevel: t.tier_level,
        tierName: t.tier_name,
        minPoints: t.min_points,
        maxPoints: t.max_points,
        pointsMultiplier: t.points_multiplier,
        benefits: t.benefits,
      })),
    });
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load loyalty tiers' },
      { status: 500 }
    );
  }
}

