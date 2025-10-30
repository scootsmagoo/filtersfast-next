/**
 * Admin Giveaways API - List and Create
 * GET /api/admin/giveaways - List all giveaways
 * POST /api/admin/giveaways - Create new giveaway
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getAllGiveaways, 
  createGiveaway, 
  getGiveawayStats 
} from '@/lib/db/giveaways';
import { CreateGiveawayRequest } from '@/lib/types/giveaway';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
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
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways', 100, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'active' | 'upcoming' | 'ended' | 'all' || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch giveaways
    const giveaways = getAllGiveaways({ limit, offset, status });
    const stats = getGiveawayStats();

    return NextResponse.json({
      success: true,
      giveaways,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: giveaways.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching giveaways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch giveaways' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways-create', 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: CreateGiveawayRequest = await request.json();
    
    // Validation
    if (!body.campaignName || !body.title || !body.description) {
      return NextResponse.json(
        { error: 'Campaign name, title, and description are required' },
        { status: 400 }
      );
    }

    if (!body.prizeDescription) {
      return NextResponse.json(
        { error: 'Prize description is required' },
        { status: 400 }
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
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

    // Create giveaway with sanitized input (OWASP A03:2021 - Injection Prevention)
    const result = createGiveaway({
      campaignName: sanitizeText(body.campaignName),
      title: sanitizeText(body.title),
      description: sanitizeText(body.description),
      productName: body.productName ? sanitizeText(body.productName) : undefined,
      productUrl: body.productUrl ? sanitizeUrl(body.productUrl) : undefined,
      productImageUrl: body.productImageUrl ? sanitizeUrl(body.productImageUrl) : undefined,
      prizeDescription: sanitizeText(body.prizeDescription),
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive !== false
    });

    // Audit log
    await auditLog({
      action: 'giveaway.create',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'giveaway',
      resourceId: result.id.toString(),
      status: 'success',
      details: { campaignName: body.campaignName, title: body.title }
    });

    return NextResponse.json({
      success: true,
      giveawayId: result.id,
      message: 'Giveaway created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating giveaway:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json(
        { error: 'A giveaway with this campaign name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create giveaway' },
      { status: 500 }
    );
  }
}

