/**
 * Admin Giveaways API - Individual Giveaway Operations
 * GET /api/admin/giveaways/[id] - Get giveaway details
 * PUT /api/admin/giveaways/[id] - Update giveaway
 * DELETE /api/admin/giveaways/[id] - Delete giveaway
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getGiveawayById, 
  updateGiveaway, 
  deleteGiveaway 
} from '@/lib/db/giveaways';
import { UpdateGiveawayRequest } from '@/lib/types/giveaway';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';

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

    const giveawayId = parseInt(params.id);
    if (isNaN(giveawayId)) {
      return NextResponse.json({ error: 'Invalid giveaway ID' }, { status: 400 });
    }

    const giveaway = getGiveawayById(giveawayId);
    
    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      giveaway
    });

  } catch (error) {
    console.error('Error fetching giveaway:', error);
    return NextResponse.json(
      { error: 'Failed to fetch giveaway' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways-update', 50, 60);
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
    const existing = getGiveawayById(giveawayId);
    if (!existing) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    // Parse request body
    const body: Partial<UpdateGiveawayRequest> = await request.json();

    // Validate dates if provided
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Update giveaway
    updateGiveaway({
      id: giveawayId,
      ...body
    });

    // Audit log
    await auditLog({
      action: 'giveaway.update',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'giveaway',
      resourceId: giveawayId.toString(),
      status: 'success',
      details: { updates: body }
    });

    return NextResponse.json({
      success: true,
      message: 'Giveaway updated successfully'
    });

  } catch (error) {
    console.error('Error updating giveaway:', error);
    return NextResponse.json(
      { error: 'Failed to update giveaway' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways-delete', 20, 60);
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
    const existing = getGiveawayById(giveawayId);
    if (!existing) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    // Delete giveaway (CASCADE will delete entries)
    deleteGiveaway(giveawayId);

    // Audit log
    await auditLog({
      action: 'giveaway.delete',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'giveaway',
      resourceId: giveawayId.toString(),
      status: 'success',
      details: { campaignName: existing.campaign_name }
    });

    return NextResponse.json({
      success: true,
      message: 'Giveaway deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting giveaway:', error);
    return NextResponse.json(
      { error: 'Failed to delete giveaway' },
      { status: 500 }
    );
  }
}

