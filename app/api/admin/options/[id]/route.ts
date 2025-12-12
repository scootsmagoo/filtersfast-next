/**
 * Admin API: Option Management (Single)
 * GET, PUT, DELETE /api/admin/options/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-admin';
import {
  getOptionById,
  updateOption,
  deleteOption,
} from '@/lib/db/product-options';
import type { OptionFormData } from '@/lib/types/product';

// GET /api/admin/options/[id] - Get option by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const option = getOptionById(id);

    if (!option) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, option });
  } catch (error: any) {
    console.error('Error fetching option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/options/[id] - Update option
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Validate ID format (should be like "opt-xxx")
    if (!id || typeof id !== 'string' || !id.startsWith('opt-')) {
      return NextResponse.json(
        { error: 'Invalid option ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const data: Partial<OptionFormData> = {};

    // Input validation and sanitization
    if (body.optionDescrip !== undefined) {
      if (typeof body.optionDescrip !== 'string') {
        return NextResponse.json(
          { error: 'Option description must be a string' },
          { status: 400 }
        );
      }
      const trimmed = body.optionDescrip.trim().substring(0, 255);
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: 'Option description cannot be empty' },
          { status: 400 }
        );
      }
      data.optionDescrip = trimmed;
    }
    if (body.priceToAdd !== undefined) {
      if (typeof body.priceToAdd !== 'number' || isNaN(body.priceToAdd) || !isFinite(body.priceToAdd)) {
        return NextResponse.json(
          { error: 'Price to add must be a valid number' },
          { status: 400 }
        );
      }
      data.priceToAdd = Math.max(-999999.99, Math.min(999999.99, body.priceToAdd));
    }
    if (body.percToAdd !== undefined) {
      if (typeof body.percToAdd !== 'number' || isNaN(body.percToAdd) || !isFinite(body.percToAdd)) {
        return NextResponse.json(
          { error: 'Percentage to add must be a valid number' },
          { status: 400 }
        );
      }
      data.percToAdd = Math.max(-100, Math.min(1000, body.percToAdd));
    }
    if (body.sortOrder !== undefined) {
      if (typeof body.sortOrder !== 'number' || body.sortOrder < 0 || body.sortOrder > 9999) {
        return NextResponse.json(
          { error: 'Sort order must be between 0 and 9999' },
          { status: 400 }
        );
      }
      data.sortOrder = body.sortOrder;
    }

    const option = updateOption(id, data);
    return NextResponse.json({ success: true, option });
  } catch (error: any) {
    console.error('Error updating option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update option' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/options/[id] - Delete option
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = deleteOption(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete option' },
      { status: 500 }
    );
  }
}

