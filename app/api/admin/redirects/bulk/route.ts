/**
 * Admin API: Bulk Redirect Operations
 * POST - Bulk import redirects from CSV/JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { bulkCreateRedirects, CreateRedirectInput } from '@/lib/db/redirects';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/redirects/bulk
 * Bulk import redirects
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

    // OWASP A05 Fix: Rate limiting (stricter for bulk operations)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.strict);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Bulk imports are limited. Please try again later.' },
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

    // OWASP A03 Fix: Validate input
    if (!Array.isArray(body.redirects)) {
      return NextResponse.json(
        { error: 'redirects must be an array' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Limit bulk import size
    if (body.redirects.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 redirects per bulk import' },
        { status: 400 }
      );
    }

    if (body.redirects.length === 0) {
      return NextResponse.json(
        { error: 'No redirects provided' },
        { status: 400 }
      );
    }

    // OWASP A03 Fix: Validate each redirect
    const validatedRedirects: CreateRedirectInput[] = [];
    const validationErrors: Array<{ row: number; error: string }> = [];

    body.redirects.forEach((redirect: any, index: number) => {
      const rowNumber = index + 1;

      // Validate required fields
      if (!redirect.source_path || !redirect.destination_path) {
        validationErrors.push({
          row: rowNumber,
          error: 'Missing source_path or destination_path'
        });
        return;
      }

      // Validate field types and lengths
      if (typeof redirect.source_path !== 'string' || redirect.source_path.length === 0 || redirect.source_path.length > 500) {
        validationErrors.push({
          row: rowNumber,
          error: 'Invalid source_path (must be 1-500 characters)'
        });
        return;
      }

      if (typeof redirect.destination_path !== 'string' || redirect.destination_path.length === 0 || redirect.destination_path.length > 500) {
        validationErrors.push({
          row: rowNumber,
          error: 'Invalid destination_path (must be 1-500 characters)'
        });
        return;
      }

      // Validate redirect_type
      const redirectType = redirect.redirect_type || '301';
      if (!['301', '302'].includes(redirectType)) {
        validationErrors.push({
          row: rowNumber,
          error: 'Invalid redirect_type (must be 301 or 302)'
        });
        return;
      }

      // Validate regex pattern if is_regex is true
      if (redirect.is_regex) {
        try {
          new RegExp(redirect.source_path);
        } catch (e) {
          validationErrors.push({
            row: rowNumber,
            error: 'Invalid regex pattern in source_path'
          });
          return;
        }
      }

      validatedRedirects.push({
        source_path: redirect.source_path.trim(),
        destination_path: redirect.destination_path.trim(),
        redirect_type: redirectType,
        is_regex: redirect.is_regex || false,
        is_active: redirect.is_active !== false,
        description: redirect.description?.trim() || undefined,
        created_by: 'admin-bulk' // TODO: Get from session
      });
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        validationErrors
      }, { status: 400 });
    }

    // Perform bulk insert
    const result = bulkCreateRedirects(validatedRedirects);

    // Refresh the redirect cache asynchronously
    fetch(`${request.nextUrl.origin}/api/redirects/refresh-cache`, { method: 'POST' })
      .catch(err => console.error('Failed to refresh redirect cache:', err));

    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${result.created} created, ${result.failed} failed`,
      data: {
        created: result.created,
        failed: result.failed,
        errors: result.errors
      }
    }, { status: result.failed > 0 ? 207 : 201 }); // 207 Multi-Status if some failed

  } catch (error) {
    console.error('Error bulk importing redirects:', error);
    return NextResponse.json(
      { error: 'Failed to bulk import redirects' },
      { status: 500 }
    );
  }
}

