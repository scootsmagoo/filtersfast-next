/**
 * Donations API Route
 * POST /api/donations - Create a donation
 * GET /api/donations - Get donations (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDonation, validateDonationAmount, getCharityById } from '@/lib/db/charities-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(ip, rateLimitPresets.strict);
    
    if (!rateLimit.success) {
      await auditLog({
        action: 'donation_rate_limited',
        ip,
        userAgent,
        status: 'failure',
        error: 'Rate limit exceeded',
      });
      
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { orderId, charityId, amount, donationType, customerId, customerEmail, customerName } = body;
    
    // Validate required fields
    if (!orderId || !charityId || !amount || !donationType) {
      await auditLog({
        action: 'donation_validation_failed',
        ip,
        userAgent,
        status: 'failure',
        error: 'Missing required fields',
        details: { orderId, charityId, amount, donationType },
      });
      
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Require customer email for tracking and tax receipts
    if (!customerEmail) {
      await auditLog({
        action: 'donation_validation_failed',
        ip,
        userAgent,
        status: 'failure',
        error: 'Customer email required',
        details: { orderId, charityId },
      });
      
      return NextResponse.json(
        { error: 'Customer email is required for donation tracking' },
        { status: 400 }
      );
    }
    
    // Get and validate charity
    const charity = await getCharityById(charityId);
    if (!charity) {
      await auditLog({
        action: 'donation_charity_not_found',
        ip,
        userAgent,
        status: 'failure',
        error: 'Charity not found',
        details: { charityId },
      });
      
      return NextResponse.json(
        { error: 'Charity not found' },
        { status: 404 }
      );
    }
    
    if (!charity.active) {
      await auditLog({
        action: 'donation_charity_inactive',
        ip,
        userAgent,
        status: 'failure',
        error: 'Charity not accepting donations',
        details: { charityId, charityName: charity.name },
      });
      
      return NextResponse.json(
        { error: 'Charity is not currently accepting donations' },
        { status: 400 }
      );
    }
    
    // Validate amount
    const validation = validateDonationAmount(charity, amount);
    if (!validation.valid) {
      await auditLog({
        action: 'donation_amount_invalid',
        ip,
        userAgent,
        status: 'failure',
        error: validation.error,
        details: { charityId, amount },
      });
      
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Create donation
    const donation = await createDonation({
      orderId,
      charityId,
      charityName: charity.name,
      amount,
      donationType,
      customerId,
      customerEmail,
      customerName,
    });
    
    // Log successful donation
    await auditLog({
      action: 'donation_created',
      userId: customerId,
      ip,
      userAgent,
      resource: 'donation',
      resourceId: donation.id,
      status: 'success',
      details: {
        charityId,
        charityName: charity.name,
        amount,
        donationType,
        orderId,
      },
    });
    
    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    // Log error
    await auditLog({
      action: 'donation_error',
      ip,
      userAgent,
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Secure error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating donation:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    );
  }
}

