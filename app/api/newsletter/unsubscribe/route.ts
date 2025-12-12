/**
 * Newsletter Unsubscribe API
 * POST /api/newsletter/unsubscribe
 * 
 * Unsubscribes a user from newsletters using a token
 * GDPR/CAN-SPAM compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterToken, markTokenAsUsed } from '@/lib/db/newsletter-tokens';
import { updateUserPreferences } from '@/lib/db/user-preferences';
import { auditLog } from '@/lib/audit-log';
import { getClientIdentifier, checkRateLimit, rateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.strict);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { token } = body;

    // OWASP: Input validation - token format and length
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // OWASP: Validate token format (base64url, expected length)
    if (token.length < 20 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = getNewsletterToken(token);
    
    if (!tokenData) {
      await auditLog({
        action: 'newsletter_unsubscribe_invalid_token',
        ip,
        userAgent,
        status: 'failure',
        details: { reason: 'Invalid or expired token' },
      });
      
      // OWASP: Consistent error message to prevent token enumeration
      return NextResponse.json(
        { success: false, error: 'Unable to process unsubscribe request. The link may be invalid or expired.' },
        { status: 400 }
      );
    }

    // Update user preferences to disable newsletter
    const success = updateUserPreferences(tokenData.userId, {
      newsletter: false,
      productReminders: false, // Also disable reminders as part of marketing emails
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Mark token as used
    markTokenAsUsed(token);

    // Audit log
    await auditLog({
      action: 'newsletter_unsubscribed',
      userId: tokenData.userId,
      ip,
      userAgent,
      resource: 'newsletter',
      status: 'success',
      details: { 
        email: tokenData.email,
        method: 'token'
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter',
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    
    await auditLog({
      action: 'newsletter_unsubscribe_error',
      ip,
      userAgent,
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

