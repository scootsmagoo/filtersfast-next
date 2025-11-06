/**
 * Admin API: Option Group Management (Single)
 * GET, PUT, DELETE /api/admin/option-groups/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-admin';
import {
  getOptionGroupById,
  updateOptionGroup,
  deleteOptionGroup,
} from '@/lib/db/product-options';
import type { OptionGroupFormData } from '@/lib/types/product';

// GET /api/admin/option-groups/[id] - Get option group by ID
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
    const optionGroup = getOptionGroupById(id);

    if (!optionGroup) {
      return NextResponse.json(
        { error: 'Option group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, optionGroup });
  } catch (error: any) {
    console.error('Error fetching option group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option group' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/option-groups/[id] - Update option group
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
    
    // Validate ID format (should be like "og-xxx")
    if (!id || typeof id !== 'string' || !id.startsWith('og-')) {
      return NextResponse.json(
        { error: 'Invalid option group ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const data: Partial<OptionGroupFormData> = {};

    // Input validation and sanitization
    if (body.optionGroupDesc !== undefined) {
      if (typeof body.optionGroupDesc !== 'string') {
        return NextResponse.json(
          { error: 'Option group description must be a string' },
          { status: 400 }
        );
      }
      const trimmed = body.optionGroupDesc.trim().substring(0, 255);
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: 'Option group description cannot be empty' },
          { status: 400 }
        );
      }
      data.optionGroupDesc = trimmed;
    }
    if (body.optionReq !== undefined) {
      data.optionReq = body.optionReq === 'N' ? 'N' : 'Y';
    }
    if (body.optionType !== undefined) {
      data.optionType = body.optionType === 'T' ? 'T' : 'S';
    }
    if (body.sizingLink !== undefined) {
      if (typeof body.sizingLink !== 'number' || body.sizingLink < 0 || body.sizingLink > 1) {
        return NextResponse.json(
          { error: 'Sizing link must be 0 or 1' },
          { status: 400 }
        );
      }
      data.sizingLink = body.sizingLink;
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

    const optionGroup = updateOptionGroup(id, data);
    return NextResponse.json({ success: true, optionGroup });
  } catch (error: any) {
    console.error('Error updating option group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update option group' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/option-groups/[id] - Delete option group
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
    const success = deleteOptionGroup(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Option group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting option group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete option group' },
      { status: 500 }
    );
  }
}

