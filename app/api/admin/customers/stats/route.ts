/**
 * Customer Statistics API Route
 * 
 * GET /api/admin/customers/stats - Get customer statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getCustomerStats } from '@/lib/db/customers';

// OWASP A04: Rate limiting
const RATE_LIMIT = 100;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

/**
 * GET /api/admin/customers/stats
 * Get aggregate statistics about customers
 */
export async function GET(request: NextRequest) {
  try {
    // Get headers
    const headersList = await headers();
    
    // OWASP A04: Rate limiting
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`admin-customer-stats-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // OWASP A07: Authenticate admin user
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = getCustomerStats();
    
    return NextResponse.json({ stats });
  } catch (error) {
    // OWASP A09: Log for monitoring
    console.error('[Admin Customers API] Error fetching stats:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch customer statistics' },
      { status: 500 }
    );
  }
}

