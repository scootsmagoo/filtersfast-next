import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { disableMFAFactor, verifyMFAToken, getMFAFactor, logMFAAction } from '@/lib/db/mfa';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || "./auth.db";
const db = new Database(dbPath);

/**
 * POST /api/mfa/disable
 * Disable MFA (requires current password and MFA token)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 10 minutes
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 10 * 60);
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
    const password = body.password || '';
    const token = sanitizeInput(body.token || '').replace(/\s/g, '');

    // Validation
    if (!password || !token) {
      return NextResponse.json(
        { error: 'Password and MFA token are required' },
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
    const factor = getMFAFactor(userId);
    if (!factor) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify password
    const user = db.prepare('SELECT * FROM user WHERE email = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      logMFAAction(userId, 'mfa_disable_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid password',
      });

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Verify MFA token
    const tokenValid = verifyMFAToken(userId, token);
    if (!tokenValid) {
      logMFAAction(userId, 'mfa_disable_failed', false, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        message: 'Invalid MFA token',
      });

      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 400 }
      );
    }

    // Disable MFA
    const disabled = disableMFAFactor(userId);
    if (!disabled) {
      return NextResponse.json(
        { error: 'Failed to disable MFA' },
        { status: 500 }
      );
    }

    // Log success
    logMFAAction(userId, 'mfa_disabled', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}

