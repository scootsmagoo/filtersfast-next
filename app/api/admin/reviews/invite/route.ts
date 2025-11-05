/**
 * Admin API: Send Review Invitation
 * POST - Send a review invitation to a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { hasAdminAccess } from '@/lib/auth-admin';
import { auth } from '@/lib/auth';
import { sendReviewInvitation } from '@/lib/trustpilot/client';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reviews/invite
 * Send a review invitation to a customer
 */
export async function POST(request: NextRequest) {
  try {
    // OWASP A01: Admin authorization
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // OWASP A05: Rate limiting for invitation sends
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, {
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 100,
      maxRequests: 10, // 10 invitations per minute
    });
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more invitations.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { customerEmail, customerName, orderReference, productSku } = body;

    // OWASP A03: Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // OWASP A03: Validate customer name
    if (!customerName || typeof customerName !== 'string') {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const sanitizedName = customerName.trim();
    if (sanitizedName.length === 0 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Customer name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // OWASP A03: Validate order reference
    if (!orderReference || typeof orderReference !== 'string') {
      return NextResponse.json(
        { error: 'Order reference is required' },
        { status: 400 }
      );
    }

    const sanitizedOrderRef = orderReference.trim();
    if (sanitizedOrderRef.length === 0 || sanitizedOrderRef.length > 100) {
      return NextResponse.json(
        { error: 'Order reference must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // OWASP A03: Validate product SKU (optional)
    let sanitizedSku: string | undefined;
    if (productSku) {
      if (typeof productSku !== 'string') {
        return NextResponse.json(
          { error: 'Product SKU must be a string' },
          { status: 400 }
        );
      }
      sanitizedSku = productSku.trim();
      if (sanitizedSku.length > 50 || !/^[a-zA-Z0-9\-_]+$/.test(sanitizedSku)) {
        return NextResponse.json(
          { error: 'Invalid product SKU format' },
          { status: 400 }
        );
      }
    }

    // Send invitation via TrustPilot
    const result = await sendReviewInvitation(
      customerEmail.trim().toLowerCase(),
      sanitizedName,
      sanitizedOrderRef,
      sanitizedSku
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send invitation' },
        { status: 500 }
      );
    }

    // OWASP A09: Log admin action (without PII)
    console.log(`Admin ${session.user.email} sent review invitation for order ${sanitizedOrderRef}`);

    return NextResponse.json({
      success: true,
      message: 'Review invitation sent successfully',
    });

  } catch (error) {
    // OWASP A09: Secure error handling
    console.error('Error sending review invitation:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

