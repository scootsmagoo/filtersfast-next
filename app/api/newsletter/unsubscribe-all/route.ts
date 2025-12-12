/**
 * Newsletter Unsubscribe All API
 * POST /api/newsletter/unsubscribe-all
 * 
 * Unsubscribes authenticated user from all marketing emails
 * GDPR/CAN-SPAM compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateUserPreferences } from '@/lib/db/user-preferences';
import { auditLog } from '@/lib/audit-log';
import { getClientIdentifier, checkRateLimit, rateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user preferences to disable all marketing emails
    const success = updateUserPreferences(session.user.id, {
      newsletter: false,
      productReminders: false,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Audit log
    await auditLog({
      action: 'newsletter_unsubscribed_all',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'newsletter',
      status: 'success',
      details: { 
        email: session.user.email,
        method: 'authenticated'
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from all marketing emails',
    });
  } catch (error) {
    console.error('Newsletter unsubscribe all error:', error);
    
    await auditLog({
      action: 'newsletter_unsubscribe_all_error',
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

