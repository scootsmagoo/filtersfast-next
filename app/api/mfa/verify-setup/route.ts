import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  verifyMFAToken, 
  enableMFAFactor, 
  getPendingMFAFactor,
  generateBackupCodes,
  logMFAAction 
} from '@/lib/db/mfa';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * POST /api/mfa/verify-setup
 * Verify TOTP token and enable MFA
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 5 minutes
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 5 * 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Parse and validate request body
    const body = await request.json();
    const token = sanitizeInput(body.token || '').replace(/\s/g, ''); // Remove whitespace

    if (!token || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Get pending MFA factor
    const pendingFactor = getPendingMFAFactor(userId);
    if (!pendingFactor) {
      return NextResponse.json(
        { error: 'No pending MFA setup found. Please start setup first.' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyMFAToken(userId, token);
    if (!isValid) {
      // Log failed verification
      logMFAAction(userId, 'mfa_setup_verification_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid token provided',
      });

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Enable MFA
    const enabled = enableMFAFactor(userId, pendingFactor.id);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Failed to enable MFA. Please try again.' },
        { status: 500 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(userId);

    // Log success
    logMFAAction(userId, 'mfa_enabled', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully',
      backupCodes: backupCodes,
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA setup' },
      { status: 500 }
    );
  }
}

