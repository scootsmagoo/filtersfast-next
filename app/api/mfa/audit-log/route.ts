import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMFAAuditLogs } from '@/lib/db/mfa';

/**
 * GET /api/mfa/audit-log
 * Get MFA audit logs for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication: Require logged-in user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email!;

    // Get query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Validation
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get audit logs
    const logs = getMFAAuditLogs(userId, limit);

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      success: log.success,
      ipAddress: log.ipAddress,
      timestamp: log.createdAt,
      details: log.details,
    }));

    return NextResponse.json({
      logs: formattedLogs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}

