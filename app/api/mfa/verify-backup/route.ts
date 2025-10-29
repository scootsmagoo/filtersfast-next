import { NextRequest, NextResponse } from 'next/server';
import { verifyBackupCode, getMFAFactor, logMFAAction, createTrustedDevice } from '@/lib/db/mfa';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * POST /api/mfa/verify-backup
 * Verify backup code during login
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 attempts per 10 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 3, 10 * 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many backup code attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const email = sanitizeInput(body.email || '');
    const code = sanitizeInput(body.code || '').replace(/\s/g, '').toUpperCase();
    const trustDevice = body.trustDevice === true;

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and backup code are required' },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid backup code format' },
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

    // Verify backup code
    const isValid = verifyBackupCode(email, code);
    if (!isValid) {
      // Log failed verification
      logMFAAction(email, 'mfa_backup_code_verification_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid or already used backup code',
      });

      return NextResponse.json(
        { error: 'Invalid or already used backup code' },
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
    logMFAAction(email, 'mfa_backup_code_used', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      message: 'Backup code used successfully',
    });

    return NextResponse.json({
      success: true,
      message: 'Backup code verified successfully',
      deviceToken: deviceToken,
      warning: 'This backup code can only be used once. Generate new codes if running low.',
    });
  } catch (error) {
    console.error('Backup code verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify backup code' },
      { status: 500 }
    );
  }
}

