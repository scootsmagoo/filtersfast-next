/**
 * B2B Dashboard Stats API
 * GET /api/b2b/dashboard - Get B2B dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getB2BAccountByUserId, getB2BDashboardStats } from '@/lib/db/b2b';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get B2B account
    const account = getB2BAccountByUserId(session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: 'No B2B account found' },
        { status: 404 }
      );
    }

    // Get dashboard stats
    const stats = getB2BDashboardStats(account.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to load dashboard stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Get B2B dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get dashboard' },
      { status: 500 }
    );
  }
}

