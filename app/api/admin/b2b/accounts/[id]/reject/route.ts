/**
 * Admin B2B Account Rejection API
 * POST /api/admin/b2b/accounts/[id]/reject - Reject B2B account
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { rejectB2BAccount, getB2BAccountById } from '@/lib/db/b2b';
import { auditLog } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // OWASP A07: Rate limiting
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Get session and verify admin
    const permissionCheck = await checkPermission(request, 'B2B', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    },
        { status: 403 }
      );
    }

    const account = getB2BAccountById(params.id);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (account.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending accounts can be rejected' },
        { status: 400 }
      );
    }

    // Parse rejection data
    const { reason } = await request.json();

    // OWASP A03: Validate and sanitize input
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    if (reason.length < 10 || reason.length > 1000) {
      return NextResponse.json(
        { error: 'Rejection reason must be between 10 and 1000 characters' },
        { status: 400 }
      );
    }

    const sanitizedReason = sanitizeInput(reason);

    // Reject account
    const success = rejectB2BAccount(params.id, sanitizedReason);

    if (!success) {
      throw new Error('Failed to reject account');
    }

    // Log audit trail
    await auditLog({
      action: 'b2b_account_rejected',
      userId: permissionCheck.user.id,
      resource: 'b2b_account',
      resourceId: params.id,
      status: 'success',
      details: {
        companyName: account.companyName,
        reason: sanitizedReason,
      },
    });

    // TODO: Send rejection email to customer

    const updatedAccount = getB2BAccountById(params.id);

    return NextResponse.json({
      success: true,
      message: 'Account rejected',
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('Reject B2B account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject account' },
      { status: 500 }
    );
  }
}

