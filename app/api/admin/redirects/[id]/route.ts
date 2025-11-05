/**
 * Admin API: Single Redirect Operations
 * GET - Get redirect by ID
 * PUT - Update redirect
 * DELETE - Delete redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { getRedirectById, updateRedirect, deleteRedirect, CreateRedirectInput } from '@/lib/db/redirects';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/redirects/[id]
 * Get a specific redirect by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // OWASP A03 Fix: Validate ID format
    const id = parseInt(params.id);
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: 'Invalid redirect ID' },
        { status: 400 }
      );
    }

    const redirect = getRedirectById(id);

    if (!redirect) {
      return NextResponse.json(
        { error: 'Redirect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: redirect
    });

  } catch (error) {
    console.error('Error fetching redirect:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redirect' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/redirects/[id]
 * Update a redirect
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // OWASP A03 Fix: Validate ID format
    const id = parseInt(params.id);
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: 'Invalid redirect ID' },
        { status: 400 }
      );
    }

    // Check if redirect exists
    const existing = getRedirectById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Redirect not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // OWASP A03 Fix: Validate fields if provided
    if (body.source_path !== undefined) {
      if (typeof body.source_path !== 'string' || body.source_path.length === 0 || body.source_path.length > 500) {
        return NextResponse.json(
          { error: 'Invalid source_path (must be 1-500 characters)' },
          { status: 400 }
        );
      }
    }

    if (body.destination_path !== undefined) {
      if (typeof body.destination_path !== 'string' || body.destination_path.length === 0 || body.destination_path.length > 500) {
        return NextResponse.json(
          { error: 'Invalid destination_path (must be 1-500 characters)' },
          { status: 400 }
        );
      }
    }

    if (body.redirect_type && !['301', '302'].includes(body.redirect_type)) {
      return NextResponse.json(
        { error: 'Invalid redirect_type (must be 301 or 302)' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate regex pattern if is_regex is true
    if (body.is_regex && body.source_path) {
      try {
        new RegExp(body.source_path);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid regex pattern in source_path' },
          { status: 400 }
        );
      }
    }

    const updates: Partial<CreateRedirectInput> = {};
    
    if (body.source_path !== undefined) updates.source_path = body.source_path.trim();
    if (body.destination_path !== undefined) updates.destination_path = body.destination_path.trim();
    if (body.redirect_type !== undefined) updates.redirect_type = body.redirect_type;
    if (body.is_regex !== undefined) updates.is_regex = body.is_regex;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.description !== undefined) updates.description = body.description?.trim();

    const redirect = updateRedirect(id, updates);

    if (!redirect) {
      return NextResponse.json(
        { error: 'Failed to update redirect' },
        { status: 500 }
      );
    }

    // Refresh the redirect cache asynchronously
    fetch(`${request.nextUrl.origin}/api/redirects/refresh-cache`, { method: 'POST' })
      .catch(err => console.error('Failed to refresh redirect cache:', err));

    return NextResponse.json({
      success: true,
      data: redirect
    });

  } catch (error) {
    console.error('Error updating redirect:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A redirect with this source_path already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update redirect' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/redirects/[id]
 * Delete a redirect
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // OWASP A03 Fix: Validate ID format
    const id = parseInt(params.id);
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: 'Invalid redirect ID' },
        { status: 400 }
      );
    }

    const success = deleteRedirect(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Redirect not found' },
        { status: 404 }
      );
    }

    // Refresh the redirect cache asynchronously
    fetch(`${request.nextUrl.origin}/api/redirects/refresh-cache`, { method: 'POST' })
      .catch(err => console.error('Failed to refresh redirect cache:', err));

    return NextResponse.json({
      success: true,
      message: 'Redirect deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json(
      { error: 'Failed to delete redirect' },
      { status: 500 }
    );
  }
}

