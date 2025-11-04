/**
 * Admin Return Statistics API Route
 * Provides analytics and metrics for returns
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getReturnStatistics } from '@/lib/db/returns-mock';

/**
 * GET /api/admin/returns/stats
 * Get return statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(permissionCheck.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
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

