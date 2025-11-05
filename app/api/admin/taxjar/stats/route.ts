/**
 * Admin TaxJar Stats API
 * GET /api/admin/taxjar/stats - Get TaxJar statistics and recent logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getTaxJarStats,
  getRecentSalesTaxLogs,
  getRecentOrderPosts,
  getFailedOrderPosts,
} from '@/lib/db/taxjar';

export async function GET(request: NextRequest) {
  try {
    // Get headers once
    const headersList = await headers();

    // Auth check
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get statistics
    const stats = getTaxJarStats();

    // Get recent logs
    const recent_logs = getRecentSalesTaxLogs(20);

    // Get recent order posts
    const recent_posts = getRecentOrderPosts(20);

    // Get failed posts for monitoring
    const failed_posts = getFailedOrderPosts(10);

    return NextResponse.json({
      stats,
      recent_logs,
      recent_posts,
      failed_posts,
    });
  } catch (error: any) {
    console.error('Error getting TaxJar stats:', error);

    // Check if it's a database table error
    if (error.message && error.message.includes('no such table')) {
      return NextResponse.json(
        { error: 'TaxJar tables not initialized. Please run: npm run init:taxjar' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



