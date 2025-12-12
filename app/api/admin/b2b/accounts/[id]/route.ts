/**
 * Admin B2B Account Management API
 * GET /api/admin/b2b/accounts/[id] - Get specific account
 * PATCH /api/admin/b2b/accounts/[id] - Update account
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getB2BAccountById, updateB2BAccount } from '@/lib/db/b2b';
import { auditLog } from '@/lib/audit-log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Get B2B account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse update data
    const updates = await request.json();

    // Update account
    const success = updateB2BAccount(params.id, updates);

    if (!success) {
      throw new Error('Failed to update account');
    }

    // Log audit trail
    await auditLog({
      action: 'b2b_account_updated',
      userId: permissionCheck.user.id,
      resource: 'b2b_account',
      resourceId: params.id,
      status: 'success',
      details: {
        updatedFields: Object.keys(updates),
      },
    });

    // Get updated account
    const updatedAccount = getB2BAccountById(params.id);

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('Update B2B account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update account' },
      { status: 500 }
    );
  }
}

