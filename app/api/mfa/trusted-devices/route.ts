import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTrustedDevices, verifyTrustedDevice } from '@/lib/db/mfa';

/**
 * GET /api/mfa/trusted-devices
 * Get list of trusted devices for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Get trusted devices
    const devices = getTrustedDevices(userId);

    // Format response (hide sensitive tokens)
    const formattedDevices = devices.map(device => ({
      id: device.id,
      deviceName: device.deviceName || 'Unknown Device',
      ipAddress: device.ipAddress,
      lastUsedAt: device.lastUsedAt,
      createdAt: device.createdAt,
      expiresAt: device.expiresAt,
    }));

    return NextResponse.json({
      devices: formattedDevices,
    });
  } catch (error) {
    console.error('Get trusted devices error:', error);
    return NextResponse.json(
      { error: 'Failed to get trusted devices' },
      { status: 500 }
    );
  }
}

