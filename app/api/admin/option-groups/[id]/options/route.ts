/**
 * Admin API: Option Group Options
 * GET, POST /api/admin/option-groups/[id]/options
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import {
  getOptionGroupById,
  getOptionsByGroupId,
  getAvailableOptionsForGroup,
  addOptionToGroup,
} from '@/lib/db/product-options';

async function buildOptionsPayload(idOptionGroup: string) {
  const options = getOptionsByGroupId(idOptionGroup);
  const availableOptions = getAvailableOptionsForGroup(idOptionGroup);
  return { options, availableOptions };
}

// GET /api/admin/option-groups/[id]/options - List options linked to a group plus available options
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await checkPermission(request, 'ProductOptions', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const { id } = await params;
    const optionGroup = getOptionGroupById(id, true);

    if (!optionGroup) {
      return NextResponse.json(
        { error: 'Option group not found' },
        { status: 404 }
      );
    }

    const payload = await buildOptionsPayload(id);

    return NextResponse.json({
      success: true,
      optionGroup,
      ...payload,
    });
  } catch (error: any) {
    console.error('Error fetching option group options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option group options' },
      { status: 500 }
    );
  }
}

// POST /api/admin/option-groups/[id]/options - Add option to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await checkPermission(request, 'ProductOptions', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const idOption = typeof body.idOption === 'string' ? body.idOption : '';
    if (!idOption.startsWith('opt-')) {
      return NextResponse.json(
        { error: 'Valid option ID is required' },
        { status: 400 }
      );
    }

    const excludeAll = body.excludeAll === true;

    try {
      addOptionToGroup(id, idOption, { excludeAll });
    } catch (dbError: any) {
      return NextResponse.json(
        { error: dbError?.message || 'Unable to add option to group' },
        { status: 400 }
      );
    }

    const payload = await buildOptionsPayload(id);
    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    console.error('Error adding option to group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add option to group' },
      { status: 500 }
    );
  }
}

