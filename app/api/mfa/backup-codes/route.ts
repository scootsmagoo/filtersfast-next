import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  generateBackupCodes, 
  getBackupCodesCount, 
  getMFAFactor,
  verifyMFAToken,
  logMFAAction 
} from '@/lib/db/mfa';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * GET /api/mfa/backup-codes
 * Get backup codes count
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Check if user has MFA enabled
    const factor = getMFAFactor(userId);
    if (!factor) {
      return NextResponse.json(
        { error: 'MFA is not enabled' },
        { status: 400 }
      );
    }

    const codes = getBackupCodesCount(userId);

    return NextResponse.json({
      total: codes.total,
      used: codes.used,
      remaining: codes.remaining,
    });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return NextResponse.json(
      { error: 'Failed to get backup codes count' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mfa/backup-codes
 * Regenerate backup codes (requires MFA token)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per hour
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 3, 60 * 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Parse request body
    const body = await request.json();
    const token = sanitizeInput(body.token || '').replace(/\s/g, '');

    // Validation
    if (!token || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'Valid MFA token is required' },
        { status: 400 }
      );
    }

    // Check if user has MFA enabled
    const factor = getMFAFactor(userId);
    if (!factor) {
      return NextResponse.json(
        { error: 'MFA is not enabled' },
        { status: 400 }
      );
    }

    // Verify MFA token
    const tokenValid = verifyMFAToken(userId, token);
    if (!tokenValid) {
      logMFAAction(userId, 'backup_codes_regeneration_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid MFA token',
      });

      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 400 }
      );
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(userId);

    // Log action
    logMFAAction(userId, 'backup_codes_regenerated', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      backupCodes: backupCodes,
      message: 'New backup codes generated. Save them in a secure location.',
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}

