/**
 * Admin Product SKU Compatibility API
 * GET - Get all compatible SKUs for a product
 * POST - Add a new compatible SKU
 * PUT - Bulk update compatible SKUs
 * DELETE - Delete a compatible SKU
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getProductCompatibility,
  getCompatibilityById,
  addCompatibility,
  updateCompatibility,
  deleteCompatibility,
  bulkUpdateCompatibility,
  mergeCompatibility,
  getCompatibilityStats
} from '@/lib/db/sku-compatibility';
import { headers } from 'next/headers';
import { z } from 'zod';

// Validation schemas
const compatibilitySchema = z.object({
  skuBrand: z.string().min(1).max(100),
  skuValue: z.string().min(1).max(100)
});

const bulkUpdateSchema = z.object({
  compatibilities: z.array(z.object({
    id: z.number().optional(),
    skuBrand: z.string().min(1).max(100),
    skuValue: z.string().min(1).max(100)
  })).max(500) // Limit bulk operations to prevent abuse
});

const mergeSchema = z.object({
  toProductId: z.number()
});

/**
 * GET /api/admin/products/[id]/compatibility
 * Get all compatible SKUs for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get compatibility records
    const compatibilities = getProductCompatibility(productId);
    const stats = getCompatibilityStats(productId);

    return NextResponse.json({
      success: true,
      compatibilities,
      stats
    });

  } catch (error) {
    console.error('Error getting compatibility:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to get compatibility' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[id]/compatibility
 * Add a new compatible SKU
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = compatibilitySchema.parse(body);

    // Add compatibility
    const newCompatibility = addCompatibility(productId, validated);

    return NextResponse.json({
      success: true,
      compatibility: newCompatibility
    });

  } catch (error) {
    console.error('Error adding compatibility:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to add compatibility' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]/compatibility
 * Bulk update compatible SKUs
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    // Validate product exists and user has access (additional security check)
    // Note: Product existence check could be added here if needed

    // Bulk update
    const result = bulkUpdateCompatibility(productId, validated.compatibilities);

    // Get updated list
    const compatibilities = getProductCompatibility(productId);
    const stats = getCompatibilityStats(productId);

    return NextResponse.json({
      success: true,
      result,
      compatibilities,
      stats
    });

  } catch (error) {
    console.error('Error bulk updating compatibility:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to update compatibility' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]/compatibility?compatibilityId=123
 * Delete a compatible SKU
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const compatibilityId = searchParams.get('compatibilityId');

    if (!compatibilityId) {
      return NextResponse.json(
        { success: false, error: 'compatibilityId is required' },
        { status: 400 }
      );
    }

    const idNum = parseInt(compatibilityId);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid compatibility ID' },
        { status: 400 }
      );
    }

    // Check if merge operation
    const mergeToId = searchParams.get('mergeToProductId');
    if (mergeToId) {
      const toProductId = parseInt(mergeToId);
      if (isNaN(toProductId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid merge target product ID' },
          { status: 400 }
        );
      }

      // Validate both product IDs are valid
      if (parseInt(id) === toProductId) {
        return NextResponse.json(
          { success: false, error: 'Cannot merge product to itself' },
          { status: 400 }
        );
      }

      try {
        const merged = mergeCompatibility(parseInt(id), toProductId);
        return NextResponse.json({
          success: true,
          merged,
          message: `Merged ${merged} compatibility records`
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Failed to merge compatibilities' },
          { status: 400 }
        );
      }
    }

    // Verify compatibility record belongs to the product before deletion
    const compatibility = getCompatibilityById(idNum);
    
    if (!compatibility) {
      return NextResponse.json(
        { success: false, error: 'Compatibility record not found' },
        { status: 404 }
      );
    }

    // Verify ownership: compatibility must belong to the product in the URL
    if (compatibility.idProduct !== parseInt(id)) {
      return NextResponse.json(
        { success: false, error: 'Compatibility record does not belong to this product' },
        { status: 403 }
      );
    }

    // Delete compatibility
    const deleted = deleteCompatibility(idNum);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete compatibility record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compatibility deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting compatibility:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to delete compatibility' 
      },
      { status: 500 }
    );
  }
}

