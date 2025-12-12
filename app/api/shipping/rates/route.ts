/**
 * Shipping Rates API Route
 * Fetches real-time shipping rates from multiple carriers
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getActiveCarriers } from '@/lib/db/shipping-config';
import { createUSPSClient } from '@/lib/shipping/usps';
import { createUPSClient } from '@/lib/shipping/ups';
import { createFedExClient } from '@/lib/shipping/fedex';
import type {
  ShippingRateRequest,
  ShippingRate,
  ShippingRateError,
  ShippingRateResponse,
  ShippingCarrier,
} from '@/lib/types/shipping';

// Rate limit: 20 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * POST /api/shipping/rates
 * Get shipping rates from all active carriers
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (disabled in development)
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous';
      try {
        await limiter.check(identifier, 20);
      } catch {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 10000) {
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate request structure
    if (!body.origin || !body.destination || !body.packages || body.packages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate package count
    if (body.packages.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 packages per request' },
        { status: 400 }
      );
    }

    // Validate package data
    for (const pkg of body.packages) {
      if (typeof pkg.weight !== 'number' || pkg.weight <= 0 || pkg.weight > 150) {
        return NextResponse.json(
          { error: 'Invalid package weight' },
          { status: 400 }
        );
      }
      if (pkg.length && (typeof pkg.length !== 'number' || pkg.length <= 0 || pkg.length > 108)) {
        return NextResponse.json(
          { error: 'Invalid package dimensions' },
          { status: 400 }
        );
      }
    }

    // Validate postal codes
    const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
    if (body.destination.country === 'US' && !zipRegex.test(body.destination.postal_code)) {
      return NextResponse.json(
        { error: 'Invalid postal code format' },
        { status: 400 }
      );
    }

    const shippingRequest: ShippingRateRequest = {
      origin: body.origin,
      destination: body.destination,
      packages: body.packages,
      carriers: body.carriers, // Optional filter
      service_types: body.service_types, // Optional filter
    };

    // Get active carriers from database
    const activeCarriers = getActiveCarriers();
    
    if (activeCarriers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No shipping carriers are configured. Please run: npm run init:shipping',
          rates: [],
          errors: [{
            carrier: 'system' as ShippingCarrier,
            error: 'Shipping not initialized. Run "npm run init:shipping" to set up carriers.'
          }]
        },
        { status: 200 } // Return 200 with empty rates instead of 503
      );
    }

    // Filter carriers if requested
    const carriersToQuery = shippingRequest.carriers
      ? activeCarriers.filter(c => shippingRequest.carriers!.includes(c.carrier))
      : activeCarriers;

    // Fetch rates from all carriers in parallel
    const ratePromises = carriersToQuery.map(async (config) => {
      try {
        const rates = await fetchCarrierRates(config.carrier, shippingRequest, config);
        
        // Apply markup if configured
        if (config.markup_percentage || config.markup_fixed) {
          return rates.map(rate => ({
            ...rate,
            rate: applyMarkup(rate.rate, config.markup_percentage, config.markup_fixed),
          }));
        }
        
        return rates;
      } catch (error) {
        console.error(`Error fetching ${config.carrier} rates:`, error);
        return {
          carrier: config.carrier,
          error: 'Unable to fetch rates from carrier',
        };
      }
    });

    const results = await Promise.all(ratePromises);

    // Separate successful rates from errors
    const rates: ShippingRate[] = [];
    const errors: ShippingRateError[] = [];

    for (const result of results) {
      if (Array.isArray(result)) {
        rates.push(...result);
      } else {
        errors.push(result as ShippingRateError);
      }
    }

    // Sort rates by price (lowest first)
    rates.sort((a, b) => a.rate - b.rate);

    const response: ShippingRateResponse = {
      rates,
      errors,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Shipping rates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

/**
 * Fetch rates from a specific carrier
 */
async function fetchCarrierRates(
  carrier: ShippingCarrier,
  request: ShippingRateRequest,
  config: { carrier: ShippingCarrier; [key: string]: any }
): Promise<ShippingRate[]> {
  // Determine if domestic or international
  const isDomestic = request.origin.country === request.destination.country;

  switch (carrier) {
    case 'usps': {
      const client = createUSPSClient(process.env.NODE_ENV === 'production');
      
      if (isDomestic && request.destination.country === 'US') {
        return await client.getDomesticRates(request);
      } else {
        return await client.getInternationalRates(request);
      }
    }

    case 'ups': {
      const client = createUPSClient(process.env.NODE_ENV === 'production');
      return await client.getRates(request);
    }

    case 'fedex': {
      const client = createFedExClient(process.env.NODE_ENV === 'production');
      return await client.getRates(request);
    }

    default:
      throw new Error(`Unsupported carrier: ${carrier}`);
  }
}

/**
 * Apply markup to rate
 */
function applyMarkup(
  rate: number,
  markupPercentage?: number,
  markupFixed?: number
): number {
  let newRate = rate;

  if (markupPercentage) {
    newRate += (newRate * markupPercentage) / 100;
  }

  if (markupFixed) {
    newRate += markupFixed;
  }

  return Math.round(newRate * 100) / 100; // Round to 2 decimal places
}

