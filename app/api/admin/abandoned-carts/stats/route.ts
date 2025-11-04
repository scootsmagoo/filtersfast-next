/**
 * Admin: Get Abandoned Cart Statistics
 * GET /api/admin/abandoned-carts/stats
 * 
 * Returns analytics and metrics for abandoned cart recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCartStats } from '@/lib/db/abandoned-carts';
import { checkPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Analytics', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    // Get statistics
    const stats = getAbandonedCartStats();

    return NextResponse.json({
      success: true,
      stats: {
        total_abandoned: stats.total_abandoned,
        total_recovered: stats.total_recovered,
        recovery_rate: stats.recovery_rate,
        total_value_abandoned: stats.total_value_abandoned,
        total_value_recovered: stats.total_value_recovered,
        emails_sent: stats.emails_sent,
        recent_abandons: stats.recent_abandons,
        // Calculate additional metrics
        avg_cart_value: stats.total_abandoned > 0 
          ? Math.round((stats.total_value_abandoned / stats.total_abandoned) * 100) / 100 
          : 0,
        avg_recovered_value: stats.total_recovered > 0
          ? Math.round((stats.total_value_recovered / stats.total_recovered) * 100) / 100
          : 0,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching abandoned cart stats:', error);
    return NextResponse.json(
      { error: 'Unable to fetch statistics' },
      { status: 500 }
    );
  }
}

