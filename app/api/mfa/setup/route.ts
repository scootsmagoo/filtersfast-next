import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createMFAFactor, getMFAFactor, getPendingMFAFactor, logMFAAction } from '@/lib/db/mfa';
import QRCode from 'qrcode';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/mfa/setup
 * Initialize MFA setup - generates secret and QR code
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 5 minutes
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 5 * 60);
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

    // Check if user already has MFA enabled
    const existingFactor = getMFAFactor(userId);
    if (existingFactor) {
      return NextResponse.json(
        { error: 'MFA is already enabled. Disable it first to set up again.' },
        { status: 400 }
      );
    }

    // Check for pending setup
    let pendingFactor = getPendingMFAFactor(userId);
    let otpauth: string;
    let secret: string;

    if (pendingFactor) {
      // Return existing pending setup
      const TOTP = (await import('otpauth')).TOTP;
      const totp = new TOTP({
        issuer: 'FiltersFast',
        label: userId,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: pendingFactor.secret,
      });
      otpauth = totp.toString();
      secret = pendingFactor.secret;
    } else {
      // Create new MFA factor
      const result = createMFAFactor(userId);
      otpauth = result.otpauth;
      secret = result.qrCode;
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Log action
    logMFAAction(userId, 'mfa_setup_initiated', true, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret, // For manual entry
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize MFA setup' },
      { status: 500 }
    );
  }
}

