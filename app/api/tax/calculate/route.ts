/**
 * Tax Calculation API Endpoint
 * Calculate sales tax using TaxJar for checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { calculateTaxRate, normalizeStateCode, normalizeZipCode } from '@/lib/taxjar';
import { createSalesTaxLog } from '@/lib/db/taxjar';
import { sanitize } from '@/lib/sanitize';

// Rate limiting to prevent abuse
const RATE_LIMIT = 50; // requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get headers for rate limiting
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';

    // Rate limiting
    if (!checkRateLimit(`tax-calc-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    const {
      address,
      city,
      state,
      zipCode,
      zip4,
      country = 'US',
      subtotal,
      shipping,
      line_items,
      order_id,
    } = body;

    // Validate required fields
    if (!address || !city || !state || !zipCode || subtotal === undefined || shipping === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs to prevent injection
    const sanitizedAddress = sanitize(String(address).substring(0, 100));
    const sanitizedCity = sanitize(String(city).substring(0, 50));
    const sanitizedState = sanitize(String(state).substring(0, 50));
    const sanitizedZip = sanitize(String(zipCode).substring(0, 20));
    const sanitizedZip4 = zip4 ? sanitize(String(zip4).substring(0, 4)) : undefined;

    // Validate numeric inputs
    if (typeof subtotal !== 'number' || subtotal < 0 || subtotal > 1000000) {
      return NextResponse.json(
        { error: 'Invalid subtotal amount' },
        { status: 400 }
      );
    }

    if (typeof shipping !== 'number' || shipping < 0 || shipping > 10000) {
      return NextResponse.json(
        { error: 'Invalid shipping amount' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedState = normalizeStateCode(sanitizedState);
    const normalizedZip = normalizeZipCode(sanitizedZip, sanitizedZip4);
    const normalizedCountry = country === 'USA' ? 'US' : country;

    // Prepare request for TaxJar
    const taxRequest = {
      to_country: normalizedCountry,
      to_zip: normalizedZip,
      to_state: normalizedState,
      to_city: sanitizedCity,
      to_street: sanitizedAddress,
      amount: subtotal,
      shipping: shipping,
      line_items: line_items || [],
    };

    // Calculate tax
    const taxResult = await calculateTaxRate(taxRequest);

    // Log the calculation
    createSalesTaxLog({
      order_id: order_id || undefined,
      sales_tax_request: JSON.stringify(taxRequest),
      sales_tax_response: JSON.stringify(taxResult),
      status_code: 200,
      success: true,
    });

    return NextResponse.json({
      success: true,
      tax: {
        rate: taxResult.rate,
        amount: taxResult.amount_to_collect,
        taxable_amount: taxResult.taxable_amount,
        has_nexus: taxResult.has_nexus,
        shipping_taxable: taxResult.shipping_taxable,
      },
    });
  } catch (error: any) {
    console.error('Tax Calculation Error:', error);

    // Log the error (don't expose details to client)
    try {
      const errorBody = await request.clone().json();
      createSalesTaxLog({
        sales_tax_request: JSON.stringify(errorBody),
        sales_tax_response: JSON.stringify({ error: 'System error' }),
        status_code: 500,
        success: false,
        error_message: error.message,
      });
    } catch (logError) {
      console.error('Failed to log tax calculation error:', logError);
    }

    return NextResponse.json(
      {
        error: 'Tax calculation temporarily unavailable',
        // Return zero tax to avoid blocking checkout
        tax: {
          rate: 0,
          amount: 0,
          taxable_amount: 0,
          has_nexus: false,
          shipping_taxable: false,
        },
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick rate lookup by zip code
export async function GET(request: NextRequest) {
  try {
    // Get headers for rate limiting
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';

    // Rate limiting
    if (!checkRateLimit(`tax-lookup-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const zipCode = searchParams.get('zip');
    const state = searchParams.get('state');
    const city = searchParams.get('city');

    if (!zipCode || !state || !city) {
      return NextResponse.json(
        { error: 'Missing required parameters: zip, state, city' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedZip = sanitize(zipCode.substring(0, 20));
    const sanitizedState = sanitize(state.substring(0, 50));
    const sanitizedCity = sanitize(city.substring(0, 50));

    // Simple rate lookup with minimal data
    const taxRequest = {
      to_country: 'US',
      to_zip: sanitizedZip,
      to_state: normalizeStateCode(sanitizedState),
      to_city: sanitizedCity,
      amount: 100, // Base amount for rate calculation
      shipping: 0,
    };

    const taxResult = await calculateTaxRate(taxRequest);

    return NextResponse.json({
      success: true,
      rate: taxResult.rate,
      has_nexus: taxResult.has_nexus,
    });
  } catch (error: any) {
    console.error('Tax Rate Lookup Error:', error);

    return NextResponse.json(
      {
        error: 'Tax rate lookup temporarily unavailable',
        rate: 0,
        has_nexus: false,
      },
      { status: 500 }
    );
  }
}

