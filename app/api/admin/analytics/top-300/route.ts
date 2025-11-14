import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { checkAnalyticsRateLimit } from '@/lib/rate-limit-analytics';
import { getTop300ProductsReport } from '@/lib/db/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = session.user.id || session.user.email || 'unknown';
    if (!checkAnalyticsRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const limitParam = parseInt(searchParams.get('limit') || '300', 10);

    const days = Number.isFinite(daysParam)
      ? Math.min(Math.max(daysParam, 1), 30)
      : 7;
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 50), 350)
      : 300;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const report = getTop300ProductsReport({
      startTimeMs: startDate.getTime(),
      endTimeMs: endDate.getTime(),
      limit,
    });

    return NextResponse.json({
      report,
      meta: {
        days,
        limit,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to load top 300 report:', error);
    return NextResponse.json(
      { error: 'Failed to load top 300 products' },
      { status: 500 }
    );
  }
}


