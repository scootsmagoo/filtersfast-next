/**
 * Admin Deal API (Single Deal)
 * GET - Get deal by ID
 * PUT - Update deal
 * DELETE - Delete deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getDealById, updateDeal, deleteDeal } from '@/lib/db/deals';
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
 * GET /api/admin/deals/[id]
 * Get deal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid deal ID' },
        { status: 400 }
      );
    }

    const deal = getDealById(id);

    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deal
    });
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to fetch deal'
      : 'Failed to fetch deal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/deals/[id]
 * Update deal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid deal ID' },
        { status: 400 }
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

    const deal = updateDeal(id, data as DealFormData);

    return NextResponse.json({
      success: true,
      deal
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to update deal'
      : 'Failed to update deal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/deals/[id]
 * Delete deal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid deal ID' },
        { status: 400 }
      );
    }

    const deleted = deleteDeal(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to delete deal'
      : 'Failed to delete deal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

