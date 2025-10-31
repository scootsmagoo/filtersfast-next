/**
 * Admin Tier Pricing Management API
 * DELETE /api/admin/b2b/tier-pricing/[id] - Delete tier pricing rule
 * PATCH /api/admin/b2b/tier-pricing/[id] - Update tier pricing rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/auth-admin';
import { deleteTierPricing, updateTierPricing } from '@/lib/db/b2b';
import { auditLog } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { validateTierPricing } from '@/lib/b2b-pricing';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.warn('Unauthorized tier pricing deletion:', session?.user?.email);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Delete tier pricing
    const success = deleteTierPricing(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Tier pricing not found' },
        { status: 404 }
      );
    }

    // Log audit trail
    await auditLog({
      action: 'tier_pricing_deleted',
      userId: session.user.id,
      resource: 'tier_pricing',
      resourceId: params.id,
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete tier pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tier pricing' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.warn('Unauthorized tier pricing update:', session?.user?.email);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { tiers } = await request.json();

    // Validate tiers
    const validation = validateTierPricing(tiers);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Update tier pricing
    const success = updateTierPricing(params.id, tiers);

    if (!success) {
      return NextResponse.json(
        { error: 'Tier pricing not found' },
        { status: 404 }
      );
    }

    // Log audit trail
    await auditLog({
      action: 'tier_pricing_updated',
      userId: session.user.id,
      resource: 'tier_pricing',
      resourceId: params.id,
      status: 'success',
      details: {
        tierCount: tiers.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update tier pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to update tier pricing' },
      { status: 500 }
    );
  }
}

