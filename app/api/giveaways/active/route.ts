/**
 * Public Giveaways API - Get Active Giveaways
 * GET /api/giveaways/active - Get all currently active giveaways
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getActiveGiveaways, hasEntered } from '@/lib/db/giveaways';
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

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier + ':giveaways-active', 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get active giveaways
    const giveaways = getActiveGiveaways();

    // Get session to check if user has entered
    let session = null;
    try {
      session = await auth.api.getSession({ headers: await headers() });
    } catch {
      // Not logged in - that's okay
    }

    // Format response
    const publicGiveaways: PublicGiveaway[] = giveaways.map((g: any) => {
      const status = calculateStatus(g.start_date, g.end_date);
      
      // Check if user has entered (if logged in)
      if (session?.user?.email) {
        status.hasEntered = hasEntered(g.id, session.user.email);
      }

      return {
        id: g.id,
        campaignName: g.campaign_name,
        title: g.title,
        description: g.description,
        productName: g.product_name,
        productUrl: g.product_url,
        productImageUrl: g.product_image_url,
        prizeDescription: g.prize_description,
        startDate: g.start_date,
        endDate: g.end_date,
        entryCount: g.entry_count || 0,
        status
      };
    });

    return NextResponse.json({
      success: true,
      giveaways: publicGiveaways
    });

  } catch (error) {
    console.error('Error fetching active giveaways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch giveaways' },
      { status: 500 }
    );
  }
}

