/**
 * Admin Partners Stats API Route
 * GET /api/admin/partners/stats - Get stats for all partners
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPartnerStats } from '@/lib/db/partners';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  return { authorized: true, userId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Allow custom date range
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    const start = startParam ? new Date(startParam) : startDate;
    const end = endParam ? new Date(endParam) : endDate;
    
    const stats = getAllPartnerStats(start, end);
    
    return NextResponse.json({
      stats,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      }
    });
  } catch (error) {
    console.error('[Admin Partners Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner stats' },
      { status: 500 }
    );
  }
}

