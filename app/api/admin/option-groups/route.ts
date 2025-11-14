/**
 * Admin API: Option Groups Management
 * GET, POST /api/admin/option-groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import {
  getAllOptionGroups,
  createOptionGroup,
  getOptionGroupById,
  updateOptionGroup,
  deleteOptionGroup,
} from '@/lib/db/product-options';
import type { OptionGroupFormData } from '@/lib/types/product';

// GET /api/admin/option-groups - List all option groups
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await checkPermission(request, 'ProductOptions', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const optionGroups = getAllOptionGroups();
    return NextResponse.json({ success: true, optionGroups });
  } catch (error: any) {
    console.error('Error fetching option groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option groups' },
      { status: 500 }
    );
  }
}

// POST /api/admin/option-groups - Create new option group
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await checkPermission(request, 'ProductOptions', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Input validation and sanitization
    const optionGroupDesc = typeof body.optionGroupDesc === 'string' 
      ? body.optionGroupDesc.trim().substring(0, 255) 
      : '';
    const optionReq = body.optionReq === 'N' ? 'N' : 'Y'; // Only allow Y or N
    const optionType = body.optionType === 'T' ? 'T' : 'S'; // Only allow S or T
    const sizingLink = typeof body.sizingLink === 'number' && body.sizingLink >= 0 && body.sizingLink <= 1 
      ? body.sizingLink 
      : 0;
    const sortOrder = typeof body.sortOrder === 'number' && body.sortOrder >= 0 && body.sortOrder <= 9999 
      ? body.sortOrder 
      : 0;
    
    const data: OptionGroupFormData = {
      optionGroupDesc,
      optionReq,
      optionType,
      sizingLink,
      sortOrder,
    };

    // Validation
    if (!data.optionGroupDesc || data.optionGroupDesc.length === 0) {
      return NextResponse.json(
        { error: 'Option group description is required' },
        { status: 400 }
      );
    }
    
    if (data.optionGroupDesc.length > 255) {
      return NextResponse.json(
        { error: 'Option group description must be 255 characters or less' },
        { status: 400 }
      );
    }

    const optionGroup = createOptionGroup(data);
    return NextResponse.json({ success: true, optionGroup }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating option group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create option group' },
      { status: 500 }
    );
  }
}

