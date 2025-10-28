/**
 * Reminder Preferences API Route
 * GET /api/reminders/preferences - Get customer preferences
 * PUT /api/reminders/preferences - Update customer preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCustomerPreferences, updateCustomerPreferences } from '@/lib/db/reminders-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  const ip = getClientIdentifier(request);
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const preferences = await getCustomerPreferences(session.user.id, session.user.email);
    
    return NextResponse.json(preferences);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching preferences:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate days before replacement
    if (body.daysBeforeReplacement !== undefined && (body.daysBeforeReplacement < 0 || body.daysBeforeReplacement > 90)) {
      return NextResponse.json(
        { error: 'Days before replacement must be between 0 and 90' },
        { status: 400 }
      );
    }
    
    const preferences = await updateCustomerPreferences(session.user.id, body);
    
    // Log success
    await auditLog({
      action: 'reminder_preferences_updated',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'preferences',
      status: 'success',
      details: body,
    });
    
    return NextResponse.json(preferences);
  } catch (error) {
    await auditLog({
      action: 'reminder_preferences_error',
      ip,
      userAgent,
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating preferences:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

