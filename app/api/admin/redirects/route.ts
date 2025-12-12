/**
 * Admin API: Redirects Management
 * GET - List all redirects with pagination and filtering
 * POST - Create a new redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { getAllRedirects, createRedirect, CreateRedirectInput } from '@/lib/db/redirects';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/redirects
 * List all redirects with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // OWASP A01 Fix: Authorization check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05 Fix: Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.standard);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // OWASP A03 Fix: Validate pagination parameters
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (1-1000)' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter' },
        { status: 400 }
      );
    }

    const result = getAllRedirects({ activeOnly, search, limit, offset });

    return NextResponse.json({
      success: true,
      data: result.redirects,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total
      }
    });

  } catch (error) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/redirects
 * Create a new redirect
 */
export async function POST(request: NextRequest) {
  try {
    // OWASP A01 Fix: Authorization check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05 Fix: Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.standard);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    const body = await request.json();

    // OWASP A03 Fix: Validate required fields
    if (!body.source_path || !body.destination_path) {
      return NextResponse.json(
        { error: 'source_path and destination_path are required' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate source_path format
    if (typeof body.source_path !== 'string' || body.source_path.length === 0 || body.source_path.length > 500) {
      return NextResponse.json(
        { error: 'Invalid source_path (must be 1-500 characters)' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate destination_path format
    if (typeof body.destination_path !== 'string' || body.destination_path.length === 0 || body.destination_path.length > 500) {
      return NextResponse.json(
        { error: 'Invalid destination_path (must be 1-500 characters)' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate redirect_type
    if (body.redirect_type && !['301', '302'].includes(body.redirect_type)) {
      return NextResponse.json(
        { error: 'Invalid redirect_type (must be 301 or 302)' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate regex pattern if is_regex is true
    if (body.is_regex) {
      try {
        new RegExp(body.source_path);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid regex pattern in source_path' },
          { status: 400 }
        );
      }
    }

    const redirectInput: CreateRedirectInput = {
      source_path: body.source_path.trim(),
      destination_path: body.destination_path.trim(),
      redirect_type: body.redirect_type || '301',
      is_regex: body.is_regex || false,
      is_active: body.is_active !== false,
      description: body.description?.trim() || undefined,
      created_by: 'admin' // TODO: Get from session
    };

    const redirect = createRedirect(redirectInput);

    // Refresh the redirect cache asynchronously
    fetch(`${request.nextUrl.origin}/api/redirects/refresh-cache`, { method: 'POST' })
      .catch(err => console.error('Failed to refresh redirect cache:', err));

    return NextResponse.json({
      success: true,
      data: redirect
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating redirect:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A redirect with this source_path already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create redirect' },
      { status: 500 }
    );
  }
}

