/**
 * Admin Tier Pricing API
 * GET /api/admin/b2b/tier-pricing - Get all tier pricing rules
 * POST /api/admin/b2b/tier-pricing - Create tier pricing rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/auth-admin';
import { getAllTierPricing, createTierPricing } from '@/lib/db/b2b';
import { logAudit } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { validateTierPricing } from '@/lib/b2b-pricing';

export async function GET(request: NextRequest) {
  try {
    // Get session and verify admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get all tier pricing
    const pricingRules = getAllTierPricing();

    return NextResponse.json({ pricingRules });
  } catch (error: any) {
    console.error('Get tier pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to load tier pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Get session and verify admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      console.warn('Unauthorized tier pricing creation:', session?.user?.email);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { productId, sku, categoryId, tiers } = data;

    // Validate that at least one identifier is provided
    if (!productId && !sku && !categoryId) {
      return NextResponse.json(
        { error: 'Must specify productId, sku, or categoryId' },
        { status: 400 }
      );
    }

    // Validate tiers
    const validation = validateTierPricing(tiers);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Create tier pricing
    const tierPricing = createTierPricing({
      productId,
      sku,
      categoryId,
      tiers,
    });

    // Log audit trail
    logAudit({
      userId: session.user.id,
      action: 'tier_pricing_created',
      category: 'b2b',
      severity: 'info',
      details: {
        id: tierPricing.id,
        productId,
        sku,
        categoryId,
        tierCount: tiers.length,
      },
    });

    return NextResponse.json({
      success: true,
      tierPricing,
    });
  } catch (error: any) {
    console.error('Create tier pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to create tier pricing' },
      { status: 500 }
    );
  }
}

