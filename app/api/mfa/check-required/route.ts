import { NextRequest, NextResponse } from 'next/server';
import { getMFAFactor } from '@/lib/db/mfa';
import { sanitizeInput } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/mfa/check-required
 * Check if an email address has MFA enabled (public endpoint for login flow)
 * Note: This doesn't reveal if user exists (returns false for non-existent users)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const email = sanitizeInput(body.email || '').toLowerCase().trim();

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { required: false }, // Don't reveal invalid email
        { status: 200 }
      );
    }

    // Check if user has MFA enabled
    // Note: We don't reveal if the user exists, just return false if not found
    const factor = getMFAFactor(email);

    return NextResponse.json({
      required: !!factor,
    });
  } catch (error) {
    console.error('MFA check-required error:', error);
    // Security: Don't reveal errors, just return false
    return NextResponse.json({ required: false });
  }
}

