/**
 * Pause Reminder API Route
 * POST /api/reminders/[id]/pause - Pause a reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReminderById, pauseReminder } from '@/lib/db/reminders-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const reminder = await getReminderById(id);
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (reminder.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const updated = await pauseReminder(id);
    
    // Log success
    await auditLog({
      action: 'reminder_paused',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'reminder',
      status: 'success',
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    await auditLog({
      action: 'reminder_pause_error',
      ip,
      userAgent,
      resource: 'reminder',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error pausing reminder:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to pause reminder' },
      { status: 500 }
    );
  }
}

