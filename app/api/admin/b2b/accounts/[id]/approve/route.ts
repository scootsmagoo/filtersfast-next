/**
 * Admin B2B Account Approval API
 * POST /api/admin/b2b/accounts/[id]/approve - Approve B2B account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/auth-admin';
import { approveB2BAccount, getB2BAccountById } from '@/lib/db/b2b';
import { logAudit } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // OWASP A07: Rate limiting for admin actions
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 30,
    windowMs: 10 * 60 * 1000, // 10 minutes
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Get session and verify admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      // OWASP A09: Log unauthorized access attempts
      console.warn('Unauthorized B2B approval attempt:', session?.user?.email);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
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
        { error: 'Only pending accounts can be approved' },
        { status: 400 }
      );
    }

    // Parse approval data
    const approvalData = await request.json();

    // OWASP A03: Validate required fields
    if (!approvalData.pricingTier || !approvalData.paymentTerms) {
      return NextResponse.json(
        { error: 'Missing required approval fields' },
        { status: 400 }
      );
    }

    // Validate pricing tier
    const validTiers = ['standard', 'silver', 'gold', 'platinum', 'custom'];
    if (!validTiers.includes(approvalData.pricingTier)) {
      return NextResponse.json(
        { error: 'Invalid pricing tier' },
        { status: 400 }
      );
    }

    // Validate payment terms
    const validTerms = ['net-15', 'net-30', 'net-45', 'net-60', 'prepay'];
    if (!validTerms.includes(approvalData.paymentTerms)) {
      return NextResponse.json(
        { error: 'Invalid payment terms' },
        { status: 400 }
      );
    }

    // Validate discount percentage
    if (approvalData.discountPercentage && 
        (approvalData.discountPercentage < 0 || approvalData.discountPercentage > 100)) {
      return NextResponse.json(
        { error: 'Discount must be between 0 and 100%' },
        { status: 400 }
      );
    }

    // Approve account
    const success = approveB2BAccount(params.id, {
      pricingTier: approvalData.pricingTier,
      discountPercentage: approvalData.discountPercentage || 0,
      paymentTerms: approvalData.paymentTerms,
      creditLimit: approvalData.creditLimit,
      salesRepId: session.user.id,
      salesRepName: session.user.name || session.user.email,
      salesRepEmail: session.user.email,
    });

    if (!success) {
      throw new Error('Failed to approve account');
    }

    // Log audit trail
    logAudit({
      userId: session.user.id,
      action: 'b2b_account_approved',
      category: 'b2b',
      severity: 'info',
      details: {
        accountId: params.id,
        companyName: account.companyName,
        pricingTier: approvalData.pricingTier,
        discountPercentage: approvalData.discountPercentage,
      },
    });

    // TODO: Send approval email to customer

    const updatedAccount = getB2BAccountById(params.id);

    return NextResponse.json({
      success: true,
      message: 'Account approved successfully',
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('Approve B2B account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve account' },
      { status: 500 }
    );
  }
}

