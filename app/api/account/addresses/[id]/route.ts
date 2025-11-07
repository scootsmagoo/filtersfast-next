/**
 * Account Address API (Single Address)
 * GET - Get address by ID
 * PUT - Update address
 * DELETE - Delete address
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAddressById, updateAddress, deleteAddress, setDefaultAddress } from '@/lib/db/addresses';
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
const addressUpdateSchema = z.object({
  label: z.string().min(1).max(50).trim().optional(),
  name: z.string().min(1).max(100).trim().optional(),
  address_line1: z.string().min(1).max(200).trim().optional(),
  address_line2: z.string().max(200).trim().nullable().optional(),
  city: z.string().min(1).max(100).trim().optional(),
  state: z.string().min(1).max(100).trim().optional(),
  postal_code: z.string()
    .min(1)
    .max(20)
    .trim()
    .regex(/^[A-Z0-9\s\-]+$/i, 'Postal code contains invalid characters')
    .optional(),
  country: z.string().min(1).max(100).trim().optional(),
  phone: z.string()
    .max(20)
    .trim()
    .regex(/^[\d\s\-\(\)\+\.]+$/, 'Phone contains invalid characters')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_default: z.number().int().min(0).max(1).optional(),
});

/**
 * GET /api/account/addresses/[id]
 * Get address by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1 || id > 2147483647) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const address = getAddressById(id, session.user.id);

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      address
    });
  } catch (error: any) {
    console.error('Error fetching address:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to fetch address'
      : 'Failed to fetch address';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/account/addresses/[id]
 * Update address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1 || id > 2147483647) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = addressUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const address = updateAddress(id, session.user.id, data as Partial<AddressFormData>);

    return NextResponse.json({
      success: true,
      address
    });
  } catch (error: any) {
    console.error('Error updating address:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to update address'
      : 'Failed to update address';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account/addresses/[id]
 * Delete address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1 || id > 2147483647) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    deleteAddress(id, session.user.id);

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to delete address'
      : 'Failed to delete address';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/account/addresses/[id]
 * Set address as default
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1 || id > 2147483647) {
      return NextResponse.json(
        { success: false, error: 'Invalid address ID' },
        { status: 400 }
      );
    }

    const address = setDefaultAddress(id, session.user.id);

    return NextResponse.json({
      success: true,
      address
    });
  } catch (error: any) {
    console.error('Error setting default address:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Failed to set default address'
      : 'Failed to set default address';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

