import { NextRequest, NextResponse } from 'next/server';
import { verifyMFAToken, getMFAFactor, logMFAAction, createTrustedDevice } from '@/lib/db/mfa';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * POST /api/mfa/verify
 * Verify TOTP token during login
 * Note: This is called after email/password verification
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 5 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 5 * 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const email = sanitizeInput(body.email || '');
    const token = sanitizeInput(body.token || '').replace(/\s/g, '');
    const trustDevice = body.trustDevice === true;

    // Validation
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Check if user has MFA enabled
    const factor = getMFAFactor(email);
    if (!factor) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyMFAToken(email, token);
    if (!isValid) {
      // Log failed verification
      logMFAAction(email, 'mfa_login_verification_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid token provided',
      });

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Create trusted device if requested
    let deviceToken: string | undefined;
    if (trustDevice) {
      deviceToken = createTrustedDevice(email, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        deviceName: 'Browser',
      });
    }

    // Log success
    logMFAAction(email, 'mfa_login_verified', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      message: trustDevice ? 'Device trusted for 30 days' : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA verification successful',
      deviceToken: deviceToken,
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA token' },
      { status: 500 }
    );
  }
}

