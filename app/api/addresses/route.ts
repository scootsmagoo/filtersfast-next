/**
 * Addresses API - List & Create
 * 
 * GET  /api/addresses - List all saved addresses
 * POST /api/addresses - Create a new address
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { getUserAddresses, createAddress } from '@/lib/db/addresses';
import { sanitizeText } from '@/lib/sanitize';
import type { AddressFormData } from '@/lib/types/address';

/**
 * GET /api/addresses - List all saved addresses
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting - more lenient in development
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const maxRequests = isDevelopment ? 60 : 20; // 60 req/min in dev, 20 in prod
    const rateLimitResult = await rateLimit(ip, maxRequests, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get addresses from database
    const addresses = getUserAddresses(session.user.id);

    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses - Create a new address
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 5, 60); // 5 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    
    // OWASP A03:2021 - Sanitize and validate all inputs
    const addressData: AddressFormData = {
      label: sanitizeText(body.label || 'Home').substring(0, 50),
      name: sanitizeText(body.name || '').substring(0, 100),
      address_line1: sanitizeText(body.address_line1 || '').substring(0, 200),
      address_line2: body.address_line2 ? sanitizeText(body.address_line2).substring(0, 200) : undefined,
      city: sanitizeText(body.city || '').substring(0, 100),
      state: sanitizeText(body.state || '').substring(0, 50),
      postal_code: sanitizeText(body.postal_code || '').substring(0, 20),
      country: sanitizeText(body.country || 'US').substring(0, 2).toUpperCase(),
      phone: body.phone ? sanitizeText(body.phone).substring(0, 20) : undefined,
      is_default: body.is_default ? 1 : 0,
    };

    // OWASP A03:2021 - Validate required fields and formats
    if (!addressData.name || !addressData.address_line1 || !addressData.city || 
        !addressData.state || !addressData.postal_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate country code format (2-letter ISO code)
    if (addressData.country.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      );
    }

    // Validate postal code format (basic check)
    if (!/^[A-Z0-9\s-]{3,20}$/i.test(addressData.postal_code)) {
      return NextResponse.json(
        { error: 'Invalid postal code format' },
        { status: 400 }
      );
    }

    // Create address
    const address = createAddress(session.user.id, addressData);

    return NextResponse.json(
      {
        success: true,
        address,
        message: 'Address saved successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Unable to save address. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

