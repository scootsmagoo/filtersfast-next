/**
 * Admin Partners Stats API Route
 * GET /api/admin/partners/stats - Get stats for all partners
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPartnerStats } from '@/lib/db/partners';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { hasAdminAccess } from '@/lib/auth-admin';

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', userId: null };
  }
  
  // OWASP A01 Fix: Proper admin role check
  if (!hasAdminAccess(session.user)) {
    return { authorized: false, error: 'Forbidden - Admin access required', userId: session.user.id };
  }
  
  return { authorized: true, userId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    // OWASP A05 Fix: Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.moderate);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.moderate.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }
    
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error.includes('Forbidden') ? 403 : 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Allow custom date range with validation
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    // OWASP A03 Fix: Validate date parameters
    let start = startDate;
    let end = endDate;
    
    if (startParam) {
      const parsedStart = new Date(startParam);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        );
      }
      start = parsedStart;
    }
    
    if (endParam) {
      const parsedEnd = new Date(endParam);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
      end = parsedEnd;
    }
    
    // Validate date range (max 1 year)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 365 days' },
        { status: 400 }
      );
    }
    
    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    
    const stats = getAllPartnerStats(start, end);
    
    return NextResponse.json({
      stats,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.moderate.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error) {
    // OWASP A09 Fix: Secure error handling
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners Stats API] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch partner stats' },
      { status: 500 }
    );
  }
}

