/**
 * Admin API: Backorder Notifications
 * GET /api/admin/backorder-notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBackorderSummary,
  getBackorderRequests,
} from '@/lib/db/backorder-notifications';
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';
import { hasPermission } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  const check = await verifyPermission('BackorderNotifications', PERMISSION_LEVEL.READ_ONLY, request);

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const optionId = searchParams.get('optionId');

    const canComplete = hasPermission(
      check.user.id,
      'BackorderNotifications',
      PERMISSION_LEVEL.FULL_CONTROL
    );

    if (productId) {
      const requests = getBackorderRequests(productId, optionId);
      return NextResponse.json({
        success: true,
        requests,
        meta: {
          canComplete,
        },
      });
    }

    const summaries = getBackorderSummary();
    return NextResponse.json({
      success: true,
      summaries,
      meta: {
        canComplete,
      },
    });
  } catch (error: any) {
    console.error('Error fetching backorder notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load backorder notifications' },
      { status: 500 }
    );
  }
}


