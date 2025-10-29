import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeTrustedDevice, logMFAAction } from '@/lib/db/mfa';

/**
 * DELETE /api/mfa/trusted-devices/[id]
 * Remove a trusted device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;
    const { id } = await params;
    const deviceId = id;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Remove device
    const removed = removeTrustedDevice(userId, deviceId);
    if (!removed) {
      return NextResponse.json(
        { error: 'Device not found or already removed' },
        { status: 404 }
      );
    }

    // Log action
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    logMFAAction(userId, 'trusted_device_removed', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      message: `Device ${deviceId} removed`,
    });

    return NextResponse.json({
      success: true,
      message: 'Trusted device removed successfully',
    });
  } catch (error) {
    console.error('Remove trusted device error:', error);
    return NextResponse.json(
      { error: 'Failed to remove trusted device' },
      { status: 500 }
    );
  }
}

