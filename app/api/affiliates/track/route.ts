/**
 * Affiliate Tracking API Routes
 * POST /api/affiliates/track - Track affiliate click
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackAffiliateClick } from '@/lib/db/affiliates';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { sanitizeInput, sanitizeUrl } from '@/lib/sanitize';
import { TrackAffiliateClickInput } from '@/lib/types/affiliate';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (generous for click tracking)
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.generous);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { affiliate_code, landing_page } = body;

    if (!affiliate_code || !landing_page) {
      return NextResponse.json(
        { error: 'Missing required fields: affiliate_code and landing_page' },
        { status: 400 }
      );
    }

    // SECURITY: Validate affiliate code format (alphanumeric only)
    const sanitizedCode = sanitizeInput(affiliate_code).toUpperCase();
    if (!/^[A-Z0-9]{2,20}$/.test(sanitizedCode)) {
      return NextResponse.json(
        { error: 'Invalid affiliate code format' },
        { status: 400 }
      );
    }

    // SECURITY: Validate landing page is a valid URL (prevent open redirect)
    const sanitizedLandingPage = sanitizeUrl(landing_page);
    if (!sanitizedLandingPage) {
      return NextResponse.json(
        { error: 'Invalid landing page URL' },
        { status: 400 }
      );
    }

    // Get client info
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || undefined; // Limit length
    const referrer = request.headers.get('referer') ? sanitizeUrl(request.headers.get('referer')!) : undefined;

    // Track click
    const input: TrackAffiliateClickInput = {
      affiliate_code: sanitizedCode,
      landing_page: sanitizedLandingPage,
      ip_address: ip.slice(0, 45), // IPv6 max length
      user_agent: userAgent,
      referrer_url: referrer
    };

    const click = trackAffiliateClick(input);

    // Return session token for cookie storage (to track conversions later)
    return NextResponse.json(
      { 
        success: true,
        session_token: click.session_token,
        affiliate_code: click.affiliate_code
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      }
    );
  } catch (error: any) {
    console.error('[Affiliate Track API] Error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('inactive')) {
      return NextResponse.json(
        { error: 'Invalid or inactive affiliate code' },
        { status: 400 }
      );
    }
    
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to track affiliate click' },
      { status: 500 }
    );
  }
}

