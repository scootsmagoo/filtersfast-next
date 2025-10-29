/**
 * Reminder Details API Route
 * GET /api/reminders/[id] - Get reminder by ID
 * PUT /api/reminders/[id] - Update reminder
 * DELETE /api/reminders/[id] - Delete reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReminderById, updateReminder, deleteReminder } from '@/lib/db/reminders-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id: reminderId } = await params;
    const reminder = await getReminderById(reminderId);
    
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
    
    return NextResponse.json(reminder);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching reminder:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const { id: reminderId } = await params;
    const reminder = await getReminderById(reminderId);
    
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
    
    const body = await request.json();
    
    // Validate custom frequency
    if (body.frequency === 'custom' && (!body.customMonths || body.customMonths < 1 || body.customMonths > 24)) {
      return NextResponse.json(
        { error: 'Custom frequency must be between 1 and 24 months' },
        { status: 400 }
      );
    }
    
    // Sanitize notes if present
    if (body.notes) {
      body.notes = sanitizeText(body.notes);
    }
    
    const updated = await updateReminder(reminderId, body);
    
    // Log success
    await auditLog({
      action: 'reminder_updated',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'reminder',
      status: 'success',
      details: body,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    await auditLog({
      action: 'reminder_update_error',
      ip,
      userAgent,
      resource: 'reminder',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating reminder:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    const { id: reminderId } = await params;
    const reminder = await getReminderById(reminderId);
    
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
    
    await deleteReminder(reminderId);
    
    // Log success
    await auditLog({
      action: 'reminder_deleted',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'reminder',
      status: 'success',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    await auditLog({
      action: 'reminder_delete_error',
      ip,
      userAgent,
      resource: 'reminder',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting reminder:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}

