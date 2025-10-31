/**
 * Admin Affiliate API Routes
 * GET /api/admin/affiliates - Get all affiliates
 * PUT /api/admin/affiliates - Update affiliate
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getAllAffiliates, updateAffiliate, getAdminAffiliateOverview } from '@/lib/db/affiliates';
import { UpdateAffiliateInput } from '@/lib/types/affiliate';

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

    const { searchParams } = new URL(request.url);
    const overview = searchParams.get('overview') === 'true';

    if (overview) {
      const data = getAdminAffiliateOverview();
      return NextResponse.json(data);
    }

    const affiliates = getAllAffiliates();
    return NextResponse.json(affiliates);
  } catch (error: any) {
    console.error('[Admin Affiliates API] Error:', error);
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to fetch affiliates' },
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

    const input: UpdateAffiliateInput = await request.json();

    if (!input.id) {
      return NextResponse.json(
        { error: 'Missing affiliate ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate commission rate if provided
    if (input.commission_rate !== undefined) {
      const rate = parseFloat(input.commission_rate as any);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'Invalid commission rate. Must be between 0 and 100.' },
          { status: 400 }
        );
      }
    }

    const updated = updateAffiliate(input);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Admin Affiliates API] Error updating affiliate:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to update affiliate' },
      { status: 500 }
    );
  }
}

