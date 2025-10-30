/**
 * Referral Code Validation API
 * POST - Validate a referral code
 * 
 * Security: Rate limited, input sanitized
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReferralCodeByCode } from '@/lib/db/referrals';
import { getClientIdentifier, rateLimitPresets, checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { validatePayloadSize } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 30 requests per minute
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.generous);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { valid: false, error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate payload size (DOS protection)
    if (!validatePayloadSize(body, 1)) {
      return NextResponse.json(
        { valid: false, error: 'Request payload too large' },
        { status: 413 }
      );
    }

    const { code } = body;

    // Input validation
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Sanitize and validate code format
    const sanitizedCode = sanitizeText(code).toUpperCase();
    
    // Referral codes should be alphanumeric only
    if (!/^[A-Z0-9]{2,20}$/.test(sanitizedCode)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid referral code format'
      });
    }

    // Get referral code
    const referralCode = getReferralCodeByCode(sanitizedCode);

    if (!referralCode) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid referral code'
      });
    }

    if (!referralCode.active) {
      return NextResponse.json({
        valid: false,
        error: 'This referral code is no longer active'
      });
    }

    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      message: 'Valid referral code! Your discount will be applied at checkout.'
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}

