/**
 * Admin Returns API Routes
 * Allows admins to view and manage all return requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getAllReturns, getReturnStatistics } from '@/lib/db/returns-mock';
import { ReturnStatus } from '@/lib/types/returns';

/**
 * GET /api/admin/returns
 * Get all return requests with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Returns', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReturnStatus | null;
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeStats = searchParams.get('includeStats') === 'true';

    const filters: any = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const returns = await getAllReturns(filters);

    const response: any = { returns };

    if (includeStats) {
      const stats = await getReturnStatistics();
      response.statistics = stats;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching admin returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

