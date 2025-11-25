import { NextResponse } from 'next/server';

/**
 * GET /api/push-notifications/key
 * Get VAPID public key for push notification subscription
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey });
}

