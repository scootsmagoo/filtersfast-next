import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMFAFactor, getBackupCodesCount } from '@/lib/db/mfa';

/**
 * GET /api/mfa/status
 * Check if user has MFA enabled and get status
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Get MFA factor
    const factor = getMFAFactor(userId);
    const backupCodes = factor ? getBackupCodesCount(userId) : null;

    return NextResponse.json({
      enabled: !!factor,
      createdAt: factor?.createdAt,
      verifiedAt: factor?.verifiedAt,
      backupCodes: backupCodes ? {
        total: backupCodes.total,
        remaining: backupCodes.remaining,
        used: backupCodes.used,
      } : null,
    });
  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
}

