/**
 * Admin API: Product Options Management
 * GET, POST /api/admin/products/[id]/options
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import {
  getProductOptionGroups,
  assignOptionGroupToProduct,
  removeOptionGroupFromProduct,
  getProductOptionInventory,
  setProductOptionInventory,
  setProductOptionImage,
  removeProductOptionImage,
} from '@/lib/db/product-options';
import type { ProductOptionGroupAssignment } from '@/lib/types/product';

// GET /api/admin/products/[id]/options - Get all options for a product
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
    const optionGroups = getProductOptionGroups(id);
    const inventory = getProductOptionInventory(id);

    return NextResponse.json({
      success: true,
      optionGroups,
      inventory,
    });
  } catch (error: any) {
    console.error('Error fetching product options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product options' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/[id]/options - Assign option group to product
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
    
    // Validate product ID format (should be like "prod-xxx")
    if (!id || typeof id !== 'string' || !id.startsWith('prod-')) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();

    if (body.action === 'assign-group') {
      // Validate idOptionGroup
      if (!body.idOptionGroup || typeof body.idOptionGroup !== 'string' || !body.idOptionGroup.startsWith('og-')) {
        return NextResponse.json(
          { error: 'Valid option group ID is required' },
          { status: 400 }
        );
      }
      
      // Validate excludedOptions array
      const excludedOptions = Array.isArray(body.excludedOptions) 
        ? body.excludedOptions.filter((optId: any) => typeof optId === 'string' && optId.startsWith('opt-'))
        : [];
      
      // Assign option group to product
      const assignment: ProductOptionGroupAssignment = {
        idOptionGroup: body.idOptionGroup,
        excludedOptions,
      };
      const productOptionGroup = assignOptionGroupToProduct(id, assignment);
      return NextResponse.json({ success: true, productOptionGroup });
    } else if (body.action === 'remove-group') {
      // Validate idOptionGroup
      if (!body.idOptionGroup || typeof body.idOptionGroup !== 'string' || !body.idOptionGroup.startsWith('og-')) {
        return NextResponse.json(
          { error: 'Valid option group ID is required' },
          { status: 400 }
        );
      }
      
      // Remove option group from product
      const success = removeOptionGroupFromProduct(id, body.idOptionGroup);
      if (!success) {
        return NextResponse.json(
          { error: 'Option group not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    } else if (body.action === 'update-inventory') {
      // Validate idOption
      if (!body.idOption || typeof body.idOption !== 'string' || !body.idOption.startsWith('opt-')) {
        return NextResponse.json(
          { error: 'Valid option ID is required' },
          { status: 400 }
        );
      }
      
      // Validate and sanitize inventory data
      const inventoryData = {
        stock: typeof body.stock === 'number' && !isNaN(body.stock) && isFinite(body.stock) && body.stock >= 0
          ? Math.min(999999, body.stock)
          : 0,
        actualInventory: typeof body.actualInventory === 'number' && !isNaN(body.actualInventory) && isFinite(body.actualInventory) && body.actualInventory >= 0
          ? Math.min(999999, body.actualInventory)
          : undefined,
        ignoreStock: typeof body.ignoreStock === 'boolean' ? body.ignoreStock : false,
        unavailable: typeof body.unavailable === 'boolean' ? body.unavailable : false,
        blocked: typeof body.blocked === 'boolean' ? body.blocked : false,
        reasonCode: typeof body.reasonCode === 'string' ? body.reasonCode.substring(0, 50) : undefined,
        dropShip: typeof body.dropShip === 'boolean' ? body.dropShip : false,
        specialOrder: typeof body.specialOrder === 'boolean' ? body.specialOrder : false,
        updateCPStock: typeof body.updateCPStock === 'boolean' ? body.updateCPStock : false,
      };
      
      // Update option inventory
      const inventory = setProductOptionInventory(id, body.idOption, inventoryData);
      return NextResponse.json({ success: true, inventory });
    } else if (body.action === 'set-image') {
      // Validate idOption
      if (!body.idOption || typeof body.idOption !== 'string' || !body.idOption.startsWith('opt-')) {
        return NextResponse.json(
          { error: 'Valid option ID is required' },
          { status: 400 }
        );
      }
      
      // Validate and sanitize imageUrl
      if (!body.imageUrl || typeof body.imageUrl !== 'string') {
        return NextResponse.json(
          { error: 'Valid image URL is required' },
          { status: 400 }
        );
      }
      
      // URL validation - basic check for http/https and length
      const imageUrl = body.imageUrl.trim();
      if (imageUrl.length > 2048) {
        return NextResponse.json(
          { error: 'Image URL must be 2048 characters or less' },
          { status: 400 }
        );
      }
      
      // Validate URL format (basic check)
      try {
        const url = new URL(imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Image URL must use http or https protocol' },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        );
      }
      
      // Set option image
      const image = setProductOptionImage(id, body.idOption, imageUrl);
      return NextResponse.json({ success: true, image });
    } else if (body.action === 'remove-image') {
      // Validate idOption
      if (!body.idOption || typeof body.idOption !== 'string' || !body.idOption.startsWith('opt-')) {
        return NextResponse.json(
          { error: 'Valid option ID is required' },
          { status: 400 }
        );
      }
      
      // Remove option image
      const success = removeProductOptionImage(id, body.idOption);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error managing product options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage product options' },
      { status: 500 }
    );
  }
}

