import { NextRequest, NextResponse } from 'next/server';
import { verifyTrustedDevice } from '@/lib/db/mfa';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * POST /api/mfa/check-device
 * Check if device token is valid (used during login)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const deviceToken = sanitizeInput(body.deviceToken || '');
    const email = sanitizeInput(body.email || '');

    if (!deviceToken || !email) {
      return NextResponse.json(
        { error: 'Device token and email are required' },
        { status: 400 }
      );
    }

    // Verify device
    const device = verifyTrustedDevice(deviceToken);
    
    // Check if device belongs to this user
    if (!device || device.userId !== email) {
      return NextResponse.json({
        trusted: false,
      });
    }

    return NextResponse.json({
      trusted: true,
      deviceId: device.id,
      expiresAt: device.expiresAt,
    });
  } catch (error) {
    console.error('Check device error:', error);
    return NextResponse.json(
      { error: 'Failed to check device' },
      { status: 500 }
    );
  }
}

