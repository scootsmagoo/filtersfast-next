/**
 * Admin B2B Quotes API
 * GET /api/admin/b2b/quotes - Get all quote requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/auth-admin';
import { getAllQuoteRequests } from '@/lib/db/b2b';
import { QuoteStatus } from '@/lib/types/b2b';

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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as QuoteStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get quotes with filters
    const { quotes, total } = getAllQuoteRequests({
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get quotes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quotes' },
      { status: 500 }
    );
  }
}

