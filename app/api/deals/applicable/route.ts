/**
 * Public Applicable Deal API
 * GET - Get applicable deal for a cart total
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApplicableDeal } from '@/lib/db/deals';

// Rate limiting for public endpoint
const RATE_LIMIT = 120; // 120 requests per minute (more frequent for cart checks)
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
 * GET /api/deals/applicable?total=123.45
 * Get applicable deal for cart total (public)
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

    const { searchParams } = new URL(request.url);
    const totalParam = searchParams.get('total');

    if (!totalParam) {
      return NextResponse.json(
        { success: false, error: 'Missing total parameter' },
        { status: 400 }
      );
    }

    // Validate input format (only digits, decimal point, no other characters)
    if (!/^\d+(\.\d{1,2})?$/.test(totalParam.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid total format' },
        { status: 400 }
      );
    }

    const total = parseFloat(totalParam);
    // Validate: must be a valid number, non-negative, and within reasonable bounds
    if (isNaN(total) || total < 0 || total > 999999.99 || !isFinite(total)) {
      return NextResponse.json(
        { success: false, error: 'Invalid total value' },
        { status: 400 }
      );
    }

    const deal = getApplicableDeal(total);

    return NextResponse.json({
      success: true,
      deal: deal || null
    });
  } catch (error: any) {
    console.error('Error fetching applicable deal:', error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to fetch applicable deal'
      : 'Failed to fetch applicable deal';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

