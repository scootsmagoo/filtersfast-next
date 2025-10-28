import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMFAStatistics } from '@/lib/db/mfa';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || "./auth.db";
const db = new Database(dbPath);

/**
 * GET /api/admin/mfa/stats
 * Get MFA statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Authorization: Check if user is admin
    const user = db.prepare('SELECT * FROM user WHERE email = ?').get(userId) as any;
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get MFA statistics
    const stats = getMFAStatistics();

    // Get additional metrics
    const recentSetups = db.prepare(`
      SELECT COUNT(*) as count
      FROM mfa_factors
      WHERE enabled = 1 AND created_at > ?
    `).get(Date.now() - (30 * 24 * 60 * 60 * 1000)) as any; // Last 30 days

    const failedAttempts = db.prepare(`
      SELECT COUNT(*) as count
      FROM mfa_audit_log
      WHERE success = 0 AND created_at > ?
    `).get(Date.now() - (24 * 60 * 60 * 1000)) as any; // Last 24 hours

    const successfulLogins = db.prepare(`
      SELECT COUNT(*) as count
      FROM mfa_audit_log
      WHERE action = 'mfa_login_verified' AND success = 1 AND created_at > ?
    `).get(Date.now() - (24 * 60 * 60 * 1000)) as any; // Last 24 hours

    return NextResponse.json({
      ...stats,
      recentSetups: recentSetups.count,
      failedAttemptsLast24h: failedAttempts.count,
      successfulLoginsLast24h: successfulLogins.count,
    });
  } catch (error) {
    console.error('Get MFA stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get MFA statistics' },
      { status: 500 }
    );
  }
}

