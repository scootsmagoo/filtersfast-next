/**
 * Reminders API Route
 * GET /api/reminders - Get customer's reminders
 * POST /api/reminders - Create a new reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCustomerReminders, createReminder } from '@/lib/db/reminders-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sanitizeText } from '@/lib/sanitize';

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
    
    const reminders = await getCustomerReminders(session.user.id);
    
    return NextResponse.json(reminders);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching reminders:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.strict);
    if (!rateLimit.success) {
      await auditLog({
        action: 'reminder_rate_limited',
        ip,
        userAgent,
        status: 'failure',
        error: 'Rate limit exceeded',
      });
      
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
    const { productId, productName, productSku, productImage, filterType, frequency, customMonths, notificationMethod, notes } = body;
    
    // Validate required fields
    if (!productId || !productName || !filterType || !frequency || !notificationMethod) {
      await auditLog({
        action: 'reminder_validation_failed',
        userId: session.user.id,
        ip,
        userAgent,
        status: 'failure',
        error: 'Missing required fields',
      });
      
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate custom frequency
    if (frequency === 'custom' && (!customMonths || customMonths < 1 || customMonths > 24)) {
      return NextResponse.json(
        { error: 'Custom frequency must be between 1 and 24 months' },
        { status: 400 }
      );
    }
    
    // Sanitize text inputs to prevent XSS
    const sanitizedNotes = notes ? sanitizeText(notes) : undefined;
    
    // Create reminder
    const reminder = await createReminder(
      session.user.id,
      session.user.email,
      session.user.name || 'Customer',
      productId,
      sanitizeText(productName),
      sanitizeText(productSku || ''),
      productImage || '',
      sanitizeText(filterType),
      {
        frequency,
        customMonths,
        notificationMethod,
        notes: sanitizedNotes,
      }
    );
    
    // Log success
    await auditLog({
      action: 'reminder_created',
      userId: session.user.id,
      ip,
      userAgent,
      resource: 'reminder',
      resourceId: reminder.id,
      status: 'success',
      details: {
        productId,
        frequency,
        filterType,
      },
    });
    
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    await auditLog({
      action: 'reminder_error',
      ip,
      userAgent,
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating reminder:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

