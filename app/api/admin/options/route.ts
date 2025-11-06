/**
 * Admin API: Options Management
 * GET, POST /api/admin/options
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-admin';
import {
  getAllOptions,
  createOption,
  getOptionsByGroupId,
} from '@/lib/db/product-options';
import type { OptionFormData } from '@/lib/types/product';

// GET /api/admin/options - List all options (with optional group filter)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idOptionGroup = searchParams.get('groupId');

    // Validate groupId parameter if provided
    if (idOptionGroup && (typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-'))) {
      return NextResponse.json(
        { error: 'Invalid option group ID format' },
        { status: 400 }
      );
    }

    let options;
    if (idOptionGroup) {
      options = getOptionsByGroupId(idOptionGroup);
    } else {
      options = getAllOptions();
    }

    return NextResponse.json({ success: true, options });
  } catch (error: any) {
    console.error('Error fetching options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch options' },
      { status: 500 }
    );
  }
}

// POST /api/admin/options - Create new option
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Input validation and sanitization
    const optionDescrip = typeof body.optionDescrip === 'string' 
      ? body.optionDescrip.trim().substring(0, 255) 
      : '';
    const priceToAdd = typeof body.priceToAdd === 'number' && !isNaN(body.priceToAdd) && isFinite(body.priceToAdd)
      ? Math.max(-999999.99, Math.min(999999.99, body.priceToAdd)) // Clamp to reasonable range
      : 0;
    const percToAdd = typeof body.percToAdd === 'number' && !isNaN(body.percToAdd) && isFinite(body.percToAdd)
      ? Math.max(-100, Math.min(1000, body.percToAdd)) // Clamp to -100% to 1000%
      : 0;
    const sortOrder = typeof body.sortOrder === 'number' && body.sortOrder >= 0 && body.sortOrder <= 9999 
      ? body.sortOrder 
      : 0;
    
    const data: OptionFormData = {
      optionDescrip,
      priceToAdd,
      percToAdd,
      sortOrder,
    };

    // Validation
    if (!data.optionDescrip || data.optionDescrip.length === 0) {
      return NextResponse.json(
        { error: 'Option description is required' },
        { status: 400 }
      );
    }
    
    if (data.optionDescrip.length > 255) {
      return NextResponse.json(
        { error: 'Option description must be 255 characters or less' },
        { status: 400 }
      );
    }

    // Validate idOptionGroup
    const idOptionGroup = body.idOptionGroup;
    if (!idOptionGroup || typeof idOptionGroup !== 'string' || !idOptionGroup.startsWith('og-')) {
      return NextResponse.json(
        { error: 'Valid option group ID is required' },
        { status: 400 }
      );
    }
    
    const option = createOption(data, idOptionGroup);
    
    return NextResponse.json({ success: true, option }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create option' },
      { status: 500 }
    );
  }
}

