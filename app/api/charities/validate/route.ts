/**
 * Charity Donation Validation API Route
 * POST /api/charities/validate - Validate a donation amount
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCharityById, validateDonationAmount, calculateRoundUpAmount } from '@/lib/db/charities-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.standard);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { charityId, amount, donationType, orderTotal } = body;
    
    // Validate required fields
    if (!charityId || (!amount && donationType !== 'roundup')) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get charity
    const charity = await getCharityById(charityId);
    if (!charity) {
      return NextResponse.json(
        { error: 'Charity not found' },
        { status: 404 }
      );
    }
    
    if (!charity.active) {
      return NextResponse.json(
        { error: 'Charity is not currently accepting donations' },
        { status: 400 }
      );
    }
    
    // Calculate amount for round-up donations
    let finalAmount = amount;
    if (donationType === 'roundup') {
      if (!orderTotal) {
        return NextResponse.json(
          { error: 'Order total required for round-up donations' },
          { status: 400 }
        );
      }
      finalAmount = calculateRoundUpAmount(orderTotal);
      
      // If round-up is less than minimum, reject it
      if (finalAmount < 0.01) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Round-up amount is too small',
            amount: 0
          }
        );
      }
    }
    
    // Validate amount
    const validation = validateDonationAmount(charity, finalAmount);
    
    return NextResponse.json({
      valid: validation.valid,
      error: validation.error,
      amount: finalAmount,
      charity: {
        id: charity.id,
        name: charity.name,
        description: charity.shortDescription,
      }
    });
  } catch (error) {
    console.error('Error validating donation:', error);
    return NextResponse.json(
      { error: 'Failed to validate donation' },
      { status: 500 }
    );
  }
}

