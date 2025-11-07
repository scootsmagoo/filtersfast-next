/**
 * Public Deals API
 * GET - Get active deals for public display
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveDeals } from '@/lib/db/deals';

// Rate limiting for public endpoint
const RATE_LIMIT = 60; // 60 requests per minute
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

/**
 * GET /api/deals
 * Get active deals (public)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const deals = getActiveDeals();

    return NextResponse.json({
      success: true,
      deals,
      total: deals.length
    });
  } catch (error: any) {
    console.error('Error fetching active deals:', error);
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

