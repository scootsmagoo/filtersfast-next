/**
 * Account Addresses API
 * GET - List user addresses
 * POST - Create new address
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAddresses, createAddress } from '@/lib/db/addresses';
import type { AddressFormData } from '@/lib/types/address';
import { headers } from 'next/headers';
import { z } from 'zod';

// Rate limiting
const RATE_LIMIT = 60; // 60 requests per minute
const RATE_WINDOW = 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Validation schema with format validation
const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label too long').trim(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  address_line1: z.string().min(1, 'Address line 1 is required').max(200, 'Address too long').trim(),
  address_line2: z.string().max(200, 'Address line 2 too long').trim().nullable().optional(),
  city: z.string().min(1, 'City is required').max(100, 'City too long').trim(),
  state: z.string().min(1, 'State is required').max(100, 'State too long').trim(),
  postal_code: z.string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code too long')
    .trim()
    .regex(/^[A-Z0-9\s\-]+$/i, 'Postal code contains invalid characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country too long').trim().default('US'),
  phone: z.string()
    .max(20, 'Phone too long')
    .trim()
    .regex(/^[\d\s\-\(\)\+\.]+$/, 'Phone contains invalid characters')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_default: z.number().int().min(0).max(1).optional(),
});

/**
 * GET /api/account/addresses
 * List all addresses for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = session.user.id;
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const addresses = getUserAddresses(session.user.id);
    
    // Limit number of addresses returned (prevent DoS)
    const MAX_ADDRESSES = 50;
    const limitedAddresses = addresses.slice(0, MAX_ADDRESSES);

    return NextResponse.json({
      success: true,
      addresses: limitedAddresses,
      total: limitedAddresses.length,
      hasMore: addresses.length > MAX_ADDRESSES
    });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to fetch addresses'
      : 'Failed to fetch addresses';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/addresses
 * Create new address
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = session.user.id;
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Check address limit (prevent DoS)
    const existingAddresses = getUserAddresses(session.user.id);
    const MAX_ADDRESSES = 50;
    if (existingAddresses.length >= MAX_ADDRESSES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_ADDRESSES} addresses allowed` },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = addressSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const address = createAddress(session.user.id, data as AddressFormData);

    return NextResponse.json({
      success: true,
      address
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to create address'
      : 'Failed to create address';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

