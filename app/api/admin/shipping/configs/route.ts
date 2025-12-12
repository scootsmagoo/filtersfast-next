/**
 * Admin Shipping Configuration API Routes
 * Manage shipping carrier configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { sanitize } from '@/lib/sanitize';
import {
  getAllShippingConfigs,
  upsertShippingConfig,
  deleteShippingConfig,
} from '@/lib/db/shipping-config';
import type { ShippingCarrier } from '@/lib/types/shipping';

/**
 * GET /api/admin/shipping/configs
 * Get all shipping configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = getAllShippingConfigs();

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Get shipping configs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping/configs
 * Create or update shipping configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body with size limit
    let body;
    try {
      const text = await request.text();
      if (text.length > 50000) {
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

    const { carrier } = body;

    // Validate carrier
    const validCarriers: ShippingCarrier[] = ['fedex', 'ups', 'usps', 'dhl', 'canada_post'];
    if (!carrier || !validCarriers.includes(carrier)) {
      return NextResponse.json(
        { error: 'Invalid carrier' },
        { status: 400 }
      );
    }

    // Sanitize origin address if provided
    if (body.origin_address) {
      body.origin_address = {
        name: sanitize(body.origin_address.name || ''),
        company: body.origin_address.company ? sanitize(body.origin_address.company) : undefined,
        address_line1: sanitize(body.origin_address.address_line1 || ''),
        address_line2: body.origin_address.address_line2 ? sanitize(body.origin_address.address_line2) : undefined,
        city: sanitize(body.origin_address.city || ''),
        state: sanitize(body.origin_address.state || ''),
        postal_code: sanitize(body.origin_address.postal_code || ''),
        country: sanitize(body.origin_address.country || 'US'),
        phone: body.origin_address.phone ? sanitize(body.origin_address.phone) : undefined,
      };
    }

    // Validate numeric fields
    if (body.markup_percentage !== undefined) {
      const markup = parseFloat(body.markup_percentage);
      if (isNaN(markup) || markup < 0 || markup > 100) {
        return NextResponse.json(
          { error: 'Invalid markup percentage' },
          { status: 400 }
        );
      }
      body.markup_percentage = markup;
    }

    if (body.free_shipping_threshold !== undefined) {
      const threshold = parseFloat(body.free_shipping_threshold);
      if (isNaN(threshold) || threshold < 0) {
        return NextResponse.json(
          { error: 'Invalid free shipping threshold' },
          { status: 400 }
        );
      }
      body.free_shipping_threshold = threshold;
    }

    // Create or update config
    const config = upsertShippingConfig(body);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Upsert shipping config error:', error);
    return NextResponse.json(
      { error: 'Failed to save shipping configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping/configs?carrier=ups
 * Delete shipping configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier') as ShippingCarrier;

    if (!carrier) {
      return NextResponse.json(
        { error: 'Carrier parameter is required' },
        { status: 400 }
      );
    }

    const success = deleteShippingConfig(carrier);

    if (!success) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete shipping config error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping configuration' },
      { status: 500 }
    );
  }
}

