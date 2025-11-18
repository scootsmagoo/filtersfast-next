import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getSearchStats, getTopSearches, getFailedSearches, getSearchConversions } from '@/lib/db/search-analytics';
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
  if (!checkAnalyticsRateLimit(identifier, 'analytics:search-insights')) {
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

    const [stats, topSearches, failedSearches, conversions] = await Promise.all([
      Promise.resolve(getSearchStats(startDate, endDate)).catch(() => null),
      Promise.resolve(getTopSearches(20, startDate, endDate)).catch(() => []),
      Promise.resolve(getFailedSearches(20, 2)).catch(() => []),
      Promise.resolve(getSearchConversions(20, 5)).catch(() => []),
    ]);

    await auditLog({
      action: 'analytics_access',
      userId: session.user.id,
      resource: 'analytics',
      resourceId: 'search-insights',
      status: 'success',
      details: { period, startDate, endDate },
    });

    return NextResponse.json({
      stats,
      topSearches,
      failedSearches,
      conversions,
      period: { startDate, endDate },
    });
  } catch (error) {
    // OWASP: Don't expose internal error details to client
    console.error('Error fetching search insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search insights' },
      { status: 500 }
    );
  }
}

