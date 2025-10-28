/**
 * Admin Return Statistics API Route
 * Provides analytics and metrics for returns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-admin';
import { getReturnStatistics } from '@/lib/db/returns-mock';

/**
 * GET /api/admin/returns/stats
 * Get return statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth();
    const user = auth?.user;

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const statistics = await getReturnStatistics();

    return NextResponse.json({ statistics });

  } catch (error) {
    console.error('Error fetching return statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

