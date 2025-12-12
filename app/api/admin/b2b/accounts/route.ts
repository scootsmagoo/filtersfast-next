/**
 * Admin B2B Accounts API
 * GET /api/admin/b2b/accounts - Get all B2B accounts (paginated, filtered)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getAllB2BAccounts } from '@/lib/db/b2b';
import { B2BAccountStatus } from '@/lib/types/b2b';

export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'B2B', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as B2BAccountStatus | null;
    const businessType = searchParams.get('businessType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get accounts with filters
    const { accounts, total } = getAllB2BAccounts({
      status: status || undefined,
      businessType: businessType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get B2B accounts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get accounts' },
      { status: 500 }
    );
  }
}

