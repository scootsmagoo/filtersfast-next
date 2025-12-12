/**
 * Public Giveaways API - Get Specific Giveaway
 * GET /api/giveaways/[identifier] - Get giveaway by ID or campaign name
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getGiveawayById, getGiveawayByCampaignName, hasEntered } from '@/lib/db/giveaways';
import { PublicGiveaway, GiveawayStatus } from '@/lib/types/giveaway';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';

/**
 * Calculate giveaway status
 */
function calculateStatus(startDate: string, endDate: string): GiveawayStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      status: 'upcoming',
      daysRemaining: daysUntil,
      canEnter: false
    };
  }

  if (now > end) {
    return {
      status: 'ended',
      canEnter: false
    };
  }

  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    status: 'active',
    daysRemaining,
    canEnter: true
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier + ':giveaways-get', 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Try to get by ID first, then by campaign name
    let giveaway;
    const id = parseInt(params.identifier);
    
    if (!isNaN(id)) {
      giveaway = getGiveawayById(id);
    } else {
      giveaway = getGiveawayByCampaignName(params.identifier);
    }

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    // Check if giveaway is active
    if (!giveaway.is_active) {
      return NextResponse.json({ error: 'Giveaway is not active' }, { status: 404 });
    }

    // Get session to check if user has entered
    let session = null;
    try {
      session = await auth.api.getSession({ headers: await headers() });
    } catch {
      // Not logged in - that's okay
    }

    // Calculate status
    const status = calculateStatus(giveaway.start_date, giveaway.end_date);
    
    // Check if user has entered
    if (session?.user?.email) {
      status.hasEntered = hasEntered(giveaway.id, session.user.email);
    }

    // Format response
    const publicGiveaway: PublicGiveaway = {
      id: giveaway.id,
      campaignName: giveaway.campaign_name,
      title: giveaway.title,
      description: giveaway.description,
      productName: giveaway.product_name,
      productUrl: giveaway.product_url,
      productImageUrl: giveaway.product_image_url,
      prizeDescription: giveaway.prize_description,
      startDate: giveaway.start_date,
      endDate: giveaway.end_date,
      entryCount: giveaway.entry_count || 0,
      status
    };

    return NextResponse.json({
      success: true,
      giveaway: publicGiveaway
    });

  } catch (error) {
    console.error('Error fetching giveaway:', error);
    return NextResponse.json(
      { error: 'Failed to fetch giveaway' },
      { status: 500 }
    );
  }
}

