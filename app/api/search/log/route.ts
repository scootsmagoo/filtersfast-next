import { NextRequest, NextResponse } from 'next/server';
import { logSearch } from '@/lib/db/search-analytics';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { sanitizeText, sanitizeNumber, sanitizeUrl } from '@/lib/sanitize';

/**
 * POST /api/search/log
 * Log a search query for analytics
 * OWASP: Rate limited, input validated, and sanitized
 */
export async function POST(request: NextRequest) {
  try {
    // OWASP: Rate limiting to prevent abuse
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.generous);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitPresets.generous.maxRequests),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          }
        }
      );
    }

    const body = await request.json();

    // Extract client information
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // OWASP: Validate and sanitize required fields
    if (!body.searchTerm || typeof body.searchTerm !== 'string') {
      return NextResponse.json(
        { error: 'searchTerm is required' },
        { status: 400 }
      );
    }

    // OWASP: Sanitize search term to prevent XSS
    const sanitizedSearchTerm = sanitizeText(body.searchTerm);
    if (!sanitizedSearchTerm.trim()) {
      return NextResponse.json(
        { error: 'Invalid search term' },
        { status: 400 }
      );
    }

    // OWASP: Validate outcome against whitelist
    if (!body.outcome || !['results_found', 'no_results', 'redirect', 'error'].includes(body.outcome)) {
      return NextResponse.json(
        { error: 'outcome must be one of: results_found, no_results, redirect, error' },
        { status: 400 }
      );
    }

    // OWASP: Validate and sanitize optional fields
    const sanitizedNormalized = body.searchTermNormalized 
      ? sanitizeText(body.searchTermNormalized) 
      : undefined;
    
    const validatedUserId = body.userId 
      ? sanitizeNumber(body.userId, 1, 999999999) 
      : undefined;
    
    const validatedResultCount = body.resultCount 
      ? sanitizeNumber(body.resultCount, 0, 1000000) 
      : 0;

    const sanitizedRedirectUrl = body.redirectUrl 
      ? sanitizeUrl(body.redirectUrl) 
      : undefined;

    // OWASP: Validate search type against whitelist
    const validSearchTypes = ['product', 'size', 'sku', 'model', 'custom'];
    const validatedSearchType = body.searchType && validSearchTypes.includes(body.searchType)
      ? body.searchType
      : undefined;

    // OWASP: Validate filtersApplied is an object and sanitize
    let sanitizedFilters = undefined;
    if (body.filtersApplied && typeof body.filtersApplied === 'object' && !Array.isArray(body.filtersApplied)) {
      try {
        // Limit object size to prevent DoS
        const jsonString = JSON.stringify(body.filtersApplied);
        if (jsonString.length <= 2000) {
          sanitizedFilters = body.filtersApplied;
        }
      } catch {
        // Invalid JSON - ignore
      }
    }

    // OWASP: Validate and sanitize product IDs array
    let sanitizedProductIds = undefined;
    if (body.resultProductIds && Array.isArray(body.resultProductIds)) {
      sanitizedProductIds = body.resultProductIds
        .slice(0, 100) // Limit array size
        .map(id => sanitizeText(String(id)))
        .filter(id => id.length > 0 && id.length <= 100);
    }

    // Get session ID from cookies or generate one
    const sessionId = request.cookies.get('sessionId')?.value || 
                     request.headers.get('x-session-id') || 
                     null;

    // Log the search
    const searchLogId = logSearch({
      searchTerm: sanitizedSearchTerm,
      searchTermNormalized: sanitizedNormalized,
      userId: validatedUserId || undefined,
      sessionId: sessionId || undefined,
      ipAddress: ipAddress.slice(0, 45), // IPv6 max length
      userAgent: userAgent.slice(0, 500),
      outcome: body.outcome,
      resultCount: validatedResultCount || 0,
      redirectUrl: sanitizedRedirectUrl,
      searchType: validatedSearchType,
      filtersApplied: sanitizedFilters,
      resultProductIds: sanitizedProductIds,
      mobile: body.mobile || /mobile|android|iphone|ipad/i.test(userAgent),
      referrer: referrer ? referrer.slice(0, 500) : undefined
    });

    return NextResponse.json({
      success: true,
      searchLogId
    }, {
      headers: {
        'X-RateLimit-Limit': String(rateLimitPresets.generous.maxRequests),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
        'X-Content-Type-Options': 'nosniff',
      }
    });

  } catch (error: any) {
    // OWASP: Don't leak sensitive error information
    console.error('Search log API error:', error);
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

