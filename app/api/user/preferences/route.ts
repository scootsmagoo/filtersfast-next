/**
 * User Preferences API
 * GET/PUT /api/user/preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPreferences, updateUserPreferences } from '@/lib/db/user-preferences';
import { auditLog } from '@/lib/audit-log';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIdentifier(request);
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const preferences = getUserPreferences(session.user.id);
    
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.standard);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Request size limit (check before parsing)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    // Only allow expected fields (prevent mass assignment)
    const allowedFields = ['emailNotifications', 'productReminders', 'newsletter', 'smsNotifications', 'theme'];
    const sanitizedBody: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        sanitizedBody[field] = body[field];
      }
    }
    
    // Validate theme value
    if (sanitizedBody.theme && !['light', 'dark', 'system'].includes(sanitizedBody.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value. Must be light, dark, or system' },
        { status: 400 }
      );
    }
    
    // Validate boolean fields
    const booleanFields = ['emailNotifications', 'productReminders', 'newsletter', 'smsNotifications'];
    for (const field of booleanFields) {
      if (sanitizedBody[field] !== undefined && typeof sanitizedBody[field] !== 'boolean') {
        return NextResponse.json(
          { error: `${field} must be a boolean value` },
          { status: 400 }
        );
      }
    }
    
    const success = updateUserPreferences(session.user.id, sanitizedBody);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }
    
    // Audit log (only log which fields were changed, not values for privacy)
    const changedFields = Object.keys(sanitizedBody);
    await auditLog({
      action: 'user_preferences_updated',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'preferences',
      status: 'success',
      details: { changedFields }, // Don't log actual preference values
    });
    
    const updatedPreferences = getUserPreferences(session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    await auditLog({
      action: 'user_preferences_error',
      ip,
      userAgent,
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

