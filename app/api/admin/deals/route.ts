/**
 * Admin Deals API
 * GET - List deals
 * POST - Create new deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getAllDeals, createDeal, deleteDeals } from '@/lib/db/deals';
import type { DealFormData } from '@/lib/types/deal';
import { headers } from 'next/headers';
import { z } from 'zod';

// Rate limiting
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Validation schema
const dealSchema = z.object({
  dealdiscription: z.string().min(1).max(100).trim(),
  startprice: z.number().min(0).max(999999.99),
  endprice: z.number().min(0).max(999999.99),
  units: z.number().int().min(0).max(999),
  active: z.number().int().min(0).max(1).optional(),
  validFrom: z.string().nullable().optional(),
  validTo: z.string().nullable().optional(),
});

/**
 * GET /api/admin/deals
 * List all deals
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Rate limiting
    const userIdentifier = session.user.id || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(userIdentifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const deals = getAllDeals();

    return NextResponse.json({
      success: true,
      deals,
      total: deals.length
    });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to fetch deals'
      : 'Failed to fetch deals';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deals
 * Create new deal
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Rate limiting
    const userIdentifier = session.user.id || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(userIdentifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = dealSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate price range
    if (data.endprice < data.startprice) {
      return NextResponse.json(
        { success: false, error: 'End price must be greater than or equal to start price' },
        { status: 400 }
      );
    }

    // Validate date range if both provided
    if (data.validFrom && data.validTo) {
      const fromDate = new Date(data.validFrom);
      const toDate = new Date(data.validTo);
      // Validate dates are valid
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }
      if (toDate < fromDate) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const deal = createDeal(data as DealFormData);

    return NextResponse.json({
      success: true,
      deal
    });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to create deal'
      : 'Failed to create deal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/deals
 * Bulk delete deals
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Rate limiting
    const userIdentifier = session.user.id || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(userIdentifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: 'Missing ids parameter' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').map(id => {
      const numId = parseInt(id.trim(), 10);
      if (isNaN(numId) || numId < 1 || numId > 2147483647) {
        throw new Error('Invalid ID format');
      }
      return numId;
    });

    // Limit bulk delete to prevent DoS
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid IDs provided' },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Too many IDs. Maximum 100 items per request' },
        { status: 400 }
      );
    }

    const deletedCount = deleteDeals(ids);

    return NextResponse.json({
      success: true,
      deletedCount
    });
  } catch (error: any) {
    console.error('Error deleting deals:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to delete deals'
      : 'Failed to delete deals';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

