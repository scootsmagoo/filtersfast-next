/**
 * Shipment Tracking API Route
 * Track shipments across multiple carriers
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createUSPSClient } from '@/lib/shipping/usps';
import { createUPSClient } from '@/lib/shipping/ups';
import { createFedExClient } from '@/lib/shipping/fedex';
import type { ShippingCarrier, TrackingInfo } from '@/lib/types/shipping';

// Rate limit: 30 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * POST /api/shipping/track
 * Track a shipment by carrier and tracking number
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    try {
      await limiter.check(identifier, 30);
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 1000) {
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

    const { carrier, tracking_number } = body;

    // Validate request
    if (!carrier || !tracking_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate tracking number format (alphanumeric, max 50 chars)
    if (typeof tracking_number !== 'string' || 
        tracking_number.length > 50 || 
        !/^[A-Za-z0-9]+$/.test(tracking_number)) {
      return NextResponse.json(
        { error: 'Invalid tracking number format' },
        { status: 400 }
      );
    }

    // Validate carrier
    const validCarriers: ShippingCarrier[] = ['fedex', 'ups', 'usps', 'dhl'];
    if (!validCarriers.includes(carrier)) {
      return NextResponse.json(
        { error: 'Invalid carrier' },
        { status: 400 }
      );
    }

    // Track shipment
    const trackingInfo = await trackShipment(carrier, tracking_number);

    return NextResponse.json(trackingInfo);
  } catch (error) {
    console.error('Tracking API error:', error);
    
    return NextResponse.json(
      { error: 'Unable to retrieve tracking information' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping/track?carrier=ups&tracking_number=1Z999AA10123456784
 * Track a shipment via GET request
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    try {
      await limiter.check(identifier, 30);
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier') as ShippingCarrier;
    const tracking_number = searchParams.get('tracking_number');

    // Validate request
    if (!carrier || !tracking_number) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate tracking number format (alphanumeric, max 50 chars)
    if (tracking_number.length > 50 || !/^[A-Za-z0-9]+$/.test(tracking_number)) {
      return NextResponse.json(
        { error: 'Invalid tracking number format' },
        { status: 400 }
      );
    }

    // Validate carrier
    const validCarriers: ShippingCarrier[] = ['fedex', 'ups', 'usps', 'dhl'];
    if (!validCarriers.includes(carrier)) {
      return NextResponse.json(
        { error: 'Invalid carrier' },
        { status: 400 }
      );
    }

    // Track shipment
    const trackingInfo = await trackShipment(carrier, tracking_number);

    return NextResponse.json(trackingInfo);
  } catch (error) {
    console.error('Tracking API error:', error);
    
    return NextResponse.json(
      { error: 'Unable to retrieve tracking information' },
      { status: 500 }
    );
  }
}

/**
 * Track shipment with specific carrier
 */
async function trackShipment(
  carrier: ShippingCarrier,
  tracking_number: string
): Promise<TrackingInfo> {
  const isProduction = process.env.NODE_ENV === 'production';

  switch (carrier) {
    case 'usps': {
      const client = createUSPSClient(isProduction);
      return await client.trackShipment({ carrier, tracking_number });
    }

    case 'ups': {
      const client = createUPSClient(isProduction);
      return await client.trackShipment({ carrier, tracking_number });
    }

    case 'fedex': {
      const client = createFedExClient(isProduction);
      return await client.trackShipment({ carrier, tracking_number });
    }

    case 'dhl':
      throw new Error('DHL tracking not yet implemented');

    default:
      throw new Error(`Unsupported carrier: ${carrier}`);
  }
}

