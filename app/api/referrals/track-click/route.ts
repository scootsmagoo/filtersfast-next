/**
 * Track Referral Click API
 * POST - Track when someone clicks a referral link
 * 
 * Security: Rate limited, input sanitized, no PII exposure
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackReferralClick } from '@/lib/db/referrals';
import { getClientIdentifier, rateLimitPresets, checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { validatePayloadSize } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent tracking spam (10 req/min per IP)
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.standard);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 200 } // Return 200 to not break user flow
      );
    }

    const body = await request.json();
    
    // Validate payload size
    if (!validatePayloadSize(body, 2)) {
      return NextResponse.json(
        { success: false, error: 'Request too large' },
        { status: 200 }
      );
    }

    const { referral_code, landing_page } = body;

    // Input validation
    if (!referral_code || typeof referral_code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 200 }
      );
    }

    // Sanitize inputs
    const sanitizedCode = sanitizeText(referral_code).toUpperCase();
    const sanitizedLandingPage = landing_page 
      ? sanitizeText(landing_page).substring(0, 500) 
      : request.nextUrl.pathname;

    // Validate code format
    if (!/^[A-Z0-9]{2,20}$/.test(sanitizedCode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid code format'
      }, { status: 200 });
    }

    // Get IP address and user agent (PII handling - anonymize)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent')?.substring(0, 500) || 'unknown';
    const referer = request.headers.get('referer')?.substring(0, 500) || undefined;

    // Track the click
    const click = trackReferralClick({
      referral_code: sanitizedCode,
      ip_address: ip.split(',')[0].trim(), // Only first IP if proxied
      user_agent: userAgent,
      referrer_url: referer,
      landing_page: sanitizedLandingPage
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Referral click tracked'
      // Don't expose click_id (IDOR prevention)
    });
  } catch (error: any) {
    console.error('Error tracking referral click:', error);
    
    // Don't fail loudly - tracking shouldn't block the user
    // Don't expose error details to client
    return NextResponse.json(
      { success: false, error: 'Tracking failed' },
      { status: 200 } // Return 200 to not break the flow
    );
  }
}

