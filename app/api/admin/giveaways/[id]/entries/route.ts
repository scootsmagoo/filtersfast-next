/**
 * Admin Giveaways API - View Entries
 * GET /api/admin/giveaways/[id]/entries - Get all entries for a giveaway
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getEntriesByGiveaway, getGiveawayById } from '@/lib/db/giveaways';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways-entries', 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const giveawayId = parseInt(params.id);
    if (isNaN(giveawayId)) {
      return NextResponse.json({ error: 'Invalid giveaway ID' }, { status: 400 });
    }

    // Check if giveaway exists
    const giveaway = getGiveawayById(giveawayId);
    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    // Get all entries
    const entries = getEntriesByGiveaway(giveawayId);

    return NextResponse.json({
      success: true,
      entries,
      count: entries.length,
      giveaway: {
        id: giveaway.id,
        campaignName: giveaway.campaign_name,
        title: giveaway.title
      }
    });

  } catch (error) {
    console.error('Error fetching giveaway entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

