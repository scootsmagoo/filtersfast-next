/**
 * Newsletter Resubscribe API
 * POST /api/newsletter/resubscribe
 * 
 * Allows users to resubscribe to newsletters
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

    // Parse request body for specific preferences
    let body;
    try {
      body = await request.json();
    } catch (error) {
      // Default to enabling newsletter
      body = { newsletter: true };
    }

    const preferences: any = {};
    
    // Allow resubscribing to specific types
    if (body.newsletter !== undefined) {
      preferences.newsletter = Boolean(body.newsletter);
    }
    if (body.productReminders !== undefined) {
      preferences.productReminders = Boolean(body.productReminders);
    }

    // If no preferences specified, enable newsletter by default
    if (Object.keys(preferences).length === 0) {
      preferences.newsletter = true;
    }

    // Update user preferences
    const success = updateUserPreferences(session.user.id, preferences);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Audit log
    await auditLog({
      action: 'newsletter_resubscribed',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'newsletter',
      status: 'success',
      details: { 
        email: session.user.email,
        preferences: Object.keys(preferences)
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You have been successfully resubscribed',
    });
  } catch (error) {
    console.error('Newsletter resubscribe error:', error);
    
    await auditLog({
      action: 'newsletter_resubscribe_error',
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

