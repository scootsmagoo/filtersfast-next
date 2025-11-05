/**
 * Admin API: Redirect Statistics
 * GET - Get redirect analytics and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { getRedirectStats } from '@/lib/db/redirects';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/redirects/stats
 * Get redirect statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    // OWASP A01 Fix: Authorization check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05 Fix: Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.standard);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    const stats = getRedirectStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching redirect stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirect statistics' },
      { status: 500 }
    );
  }
}

