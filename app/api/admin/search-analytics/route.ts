import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getSearchStats, getTopSearches, getSearchTrends, getFailedSearches, getSearchConversions, getRecentSearches } from '@/lib/db/search-analytics';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';

/**
 * GET /api/admin/search-analytics
 * Get search analytics data
 * OWASP: Admin-only, input validated and sanitized
 */
export async function GET(request: NextRequest) {
  try {
    // OWASP: Verify admin authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // OWASP: Validate and sanitize type parameter (whitelist approach)
    const validTypes = ['stats', 'top-searches', 'trends', 'failed', 'conversions', 'recent'];
    const type = searchParams.get('type') || 'stats';
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { 
          status: 400,
          headers: {
            'X-Content-Type-Options': 'nosniff',
          }
        }
      );
    }

    // OWASP: Validate and sanitize numeric parameters
    const limit = Math.max(1, Math.min(1000, Math.floor(sanitizeNumber(searchParams.get('limit') || '50', 1, 1000) || 50)));
    const days = Math.max(1, Math.min(3650, Math.floor(sanitizeNumber(searchParams.get('days') || '30', 1, 3650) || 30)));
    const minFailures = Math.max(1, Math.min(10000, Math.floor(sanitizeNumber(searchParams.get('minFailures') || '2', 1, 10000) || 2)));
    const minSearches = Math.max(1, Math.min(10000, Math.floor(sanitizeNumber(searchParams.get('minSearches') || '5', 1, 10000) || 5)));

    // OWASP: Validate and sanitize date parameters (ISO date format)
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (startDateParam) {
      // Validate ISO date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(startDateParam)) {
        startDate = startDateParam;
      }
    }

    if (endDateParam) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(endDateParam)) {
        endDate = endDateParam;
      }
    }

    // OWASP: Sanitize search term parameter
    const searchTermParam = searchParams.get('searchTerm');
    const searchTerm = searchTermParam ? sanitizeText(searchTermParam).slice(0, 200) : undefined;

    switch (type) {
      case 'stats':
        const stats = getSearchStats(startDate, endDate);
        return NextResponse.json(stats);

      case 'top-searches':
        const topSearches = getTopSearches(limit, startDate, endDate);
        return NextResponse.json(topSearches);

      case 'trends':
        const trends = getSearchTrends(days);
        return NextResponse.json(trends);

      case 'failed':
        const failedSearches = getFailedSearches(limit, minFailures);
        return NextResponse.json(failedSearches);

      case 'conversions':
        const conversions = getSearchConversions(limit, minSearches);
        return NextResponse.json(conversions);

      case 'recent':
        const recentSearches = getRecentSearches(limit, searchTerm);
        return NextResponse.json(recentSearches);

      default:
        // This should never happen due to validation above, but included for completeness
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { 
            status: 400,
            headers: {
              'X-Content-Type-Options': 'nosniff',
            }
          }
        );
    }

  } catch (error: any) {
    // OWASP: Don't leak sensitive error information
    console.error('Search analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
        }
      }
    );
  }
}

