/**
 * SMS Preferences API
 * GET/PUT /api/sms/preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSMSSubscriptionByUserId, getSMSPreferences, updateSMSPreferences } from '@/lib/db/sms';
import type { UpdateSMSPreferencesRequest } from '@/lib/types/sms';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const subscription = getSMSSubscriptionByUserId(userId);

    if (!subscription) {
      return NextResponse.json({ error: 'No SMS subscription found' }, { status: 404 });
    }

    const preferences = getSMSPreferences(subscription.id);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error getting SMS preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const subscription = getSMSSubscriptionByUserId(userId);

    if (!subscription) {
      return NextResponse.json({ error: 'No SMS subscription found' }, { status: 404 });
    }

    // A04: Request size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    const body: UpdateSMSPreferencesRequest = await request.json();

    // A08: Data Integrity - Validate numeric inputs
    if (body.max_messages_per_week !== undefined) {
      if (typeof body.max_messages_per_week !== 'number' || 
          body.max_messages_per_week < 0 || 
          body.max_messages_per_week > 1000) {
        return NextResponse.json(
          { error: 'Invalid max_messages_per_week value (must be 0-1000)' },
          { status: 400 }
        );
      }
    }

    // A08: Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (body.quiet_hours_start && !timeRegex.test(body.quiet_hours_start)) {
      return NextResponse.json(
        { error: 'Invalid quiet_hours_start format (use HH:MM)' },
        { status: 400 }
      );
    }
    if (body.quiet_hours_end && !timeRegex.test(body.quiet_hours_end)) {
      return NextResponse.json(
        { error: 'Invalid quiet_hours_end format (use HH:MM)' },
        { status: 400 }
      );
    }

    // A08: Validate timezone
    if (body.timezone && body.timezone.length > 50) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }

    const success = updateSMSPreferences(subscription.id, body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    // A09: Audit logging
    console.log(`[AUDIT] SMS preferences updated: User=${userId}, Subscription=${subscription.id}, IP=${request.headers.get('x-forwarded-for') || 'unknown'}`);

    const updatedPreferences = getSMSPreferences(subscription.id);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating SMS preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

