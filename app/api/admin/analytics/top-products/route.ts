import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getTopProductsByQuantity, getTopProductsByRevenue } from '@/lib/db/analytics';
import { getDateRange, validateDateRange } from '@/lib/analytics-utils';
import { checkAnalyticsRateLimit } from '@/lib/rate-limit-analytics';

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !hasAdminAccess(session.user)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Rate limiting
  const identifier = session.user.id || session.user.email || 'unknown';
  if (!checkAnalyticsRateLimit(identifier)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as 'today' | '7days' | '30days' | '90days' | 'year' | 'custom';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'revenue';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100); // Max 100

    const { startDate, endDate } = getDateRange(
      period || '30days',
      customStart || undefined,
      customEnd || undefined
    );

    // Validate date range
    const validation = validateDateRange(startDate, endDate);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const topProducts = sortBy === 'quantity' 
      ? getTopProductsByQuantity(startDate, endDate, limit)
      : getTopProductsByRevenue(startDate, endDate, limit);

    return NextResponse.json({
      topProducts,
      period: { startDate, endDate },
      sortBy,
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    );
  }
}

