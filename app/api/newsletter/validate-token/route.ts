/**
 * Newsletter Token Validation API
 * POST /api/newsletter/validate-token
 * 
 * Validates a newsletter unsubscribe token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterToken } from '@/lib/db/newsletter-tokens';
import { getClientIdentifier, checkRateLimit, rateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { valid: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { token } = body;

    // OWASP: Input validation - token format and length
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // OWASP: Validate token format (base64url, expected length)
    if (token.length < 20 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = getNewsletterToken(token);
    
    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        error: 'This unsubscribe link is invalid or has expired.',
      });
    }

    return NextResponse.json({
      valid: true,
      tokenInfo: {
        email: tokenData.email,
        type: tokenData.type,
      },
    });
  } catch (error) {
    console.error('Token validation error:', error);

    return NextResponse.json(
      { valid: false, error: 'An error occurred while validating the token' },
      { status: 500 }
    );
  }
}

