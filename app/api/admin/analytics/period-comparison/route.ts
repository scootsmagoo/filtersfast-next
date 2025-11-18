import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getPeriodComparison } from '@/lib/db/analytics';
import { getDateRange, validateDateRange } from '@/lib/analytics-utils';
import { checkAnalyticsRateLimit } from '@/lib/rate-limit-analytics';
import { auditLog } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !hasAdminAccess(session.user)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const identifier = session.user.id || session.user.email || 'unknown';
  if (!checkAnalyticsRateLimit(identifier, 'analytics:period-comparison')) {
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

    // OWASP: Validate period parameter against whitelist
    const validPeriods = ['today', '7days', '30days', '90days', 'year', 'custom'];
    if (period && !validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter' },
        { status: 400 }
      );
    }

    // OWASP: Validate date format if provided (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (customStart && !dateRegex.test(customStart)) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      );
    }
    if (customEnd && !dateRegex.test(customEnd)) {
      return NextResponse.json(
        { error: 'Invalid end date format' },
        { status: 400 }
      );
    }

    const { startDate, endDate } = getDateRange(
      period || '30days',
      customStart || undefined,
      customEnd || undefined
    );

    const validation = validateDateRange(startDate, endDate);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Calculate previous period dates
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - daysDiff);

    const comparison = getPeriodComparison(
      startDate,
      endDate,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    );

    await auditLog({
      action: 'analytics_access',
      userId: session.user.id,
      resource: 'analytics',
      resourceId: 'period-comparison',
      status: 'success',
      details: { period, startDate, endDate },
    });

    return NextResponse.json({
      comparison,
      currentPeriod: { startDate, endDate },
      previousPeriod: {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    // OWASP: Don't expose internal error details to client
    console.error('Error fetching period comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch period comparison' },
      { status: 500 }
    );
  }
}

