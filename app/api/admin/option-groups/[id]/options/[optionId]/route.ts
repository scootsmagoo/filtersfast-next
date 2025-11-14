/**
 * Admin API: Option Group Options (single)
 * DELETE /api/admin/option-groups/[groupId]/options/[optionId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import {
  getOptionsByGroupId,
  getAvailableOptionsForGroup,
  removeOptionFromGroup,
} from '@/lib/db/product-options';

async function buildOptionsPayload(idOptionGroup: string) {
  const options = getOptionsByGroupId(idOptionGroup);
  const availableOptions = getAvailableOptionsForGroup(idOptionGroup);
  return { options, availableOptions };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const permissionCheck = await checkPermission(request, 'ProductOptions', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }

    const { id, optionId } = await params;

    if (!optionId || !optionId.startsWith('opt-')) {
      return NextResponse.json(
        { error: 'Valid option ID is required' },
        { status: 400 }
      );
    }

    const removed = removeOptionFromGroup(id, optionId);
    if (!removed) {
      return NextResponse.json(
        { error: 'Option not found in this group' },
        { status: 404 }
      );
    }

    const payload = await buildOptionsPayload(id);
    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    console.error('Error removing option from group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove option from group' },
      { status: 500 }
    );
  }
}

