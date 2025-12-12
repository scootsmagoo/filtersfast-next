import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getHourlySalesDistribution } from '@/lib/db/analytics';
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
  if (!checkAnalyticsRateLimit(identifier, 'analytics:hourly-sales')) {
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

    const hourlySales = getHourlySalesDistribution(startDate, endDate);

    await auditLog({
      action: 'analytics_access',
      userId: session.user.id,
      resource: 'analytics',
      resourceId: 'hourly-sales',
      status: 'success',
      details: { period, startDate, endDate },
    });

    return NextResponse.json({
      hourlySales,
      period: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching hourly sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hourly sales' },
      { status: 500 }
    );
  }
}

