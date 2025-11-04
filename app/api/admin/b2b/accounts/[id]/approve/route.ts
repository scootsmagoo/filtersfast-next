/**
 * Admin B2B Account Approval API
 * POST /api/admin/b2b/accounts/[id]/approve - Approve B2B account
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { approveB2BAccount, getB2BAccountById } from '@/lib/db/b2b';
import { auditLog } from '@/lib/audit-log';
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
      salesRepId: permissionCheck.user.id,
      salesRepName: session.user.name || permissionCheck.user.email,
      salesRepEmail: permissionCheck.user.email,
    });

    if (!success) {
      throw new Error('Failed to approve account');
    }

    // Log audit trail
    await auditLog({
      action: 'b2b_account_approved',
      userId: permissionCheck.user.id,
      resource: 'b2b_account',
      resourceId: params.id,
      status: 'success',
      details: {
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

