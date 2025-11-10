/**
 * Admin API: Backorder Notifications Detail
 * PATCH /api/admin/backorder-notifications/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeBackorderNotification } from '@/lib/db/backorder-notifications';
import { verifyPermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await verifyPermission('BackorderNotifications', PERMISSION_LEVEL.FULL_CONTROL, request);

  if (!check.authorized || !check.user) {
    return NextResponse.json(
      { error: check.error || 'Unauthorized' },
      { status: check.user ? 403 : 401 }
    );
  }

  try {
    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: 'Invalid backorder request ID.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const note =
      typeof body.note === 'string' && body.note.trim().length > 0
        ? body.note.trim()
        : null;

    const updated = completeBackorderNotification(numericId, check.user.id, note);
    if (!updated) {
      return NextResponse.json(
        { error: 'Backorder request not found or already completed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing backorder notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete backorder notification.' },
      { status: 500 }
    );
  }
}


