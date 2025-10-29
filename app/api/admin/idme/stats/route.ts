/**
 * Admin ID.me Statistics API
 * 
 * Get verification statistics for admin dashboard
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVerificationStats } from '@/lib/db/idme';

export async function GET(request: NextRequest) {
  try {
    // Request size limit check
    const url = new URL(request.url);
    if (url.search.length > 100) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Check admin authentication
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    // TODO: Implement proper role-based access control
    if (!session?.user || session.user.email !== 'adam@example.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get statistics
    const stats = getVerificationStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('[Admin ID.me Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

