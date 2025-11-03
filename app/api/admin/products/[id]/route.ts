/**
 * Admin Product Detail API
 * GET - Get product by ID
 * PATCH - Update product
 * DELETE - Delete product (archive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getProductById, 
  updateProduct, 
  deleteProduct,
  getProductHistory 
} from '@/lib/db/products';
import type { ProductFormData } from '@/lib/types/product';
import { headers } from 'next/headers';
import { z } from 'zod';

/**
 * GET /api/admin/products/[id]
 * Get product details with optional history
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

    // Get product
    const product = getProductById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get history if requested
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const history = includeHistory ? getProductHistory(id) : null;

    return NextResponse.json({
      success: true,
      product,
      history
    });

  } catch (error) {
    console.error('Error getting product:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to get product' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update product
 */
export async function PATCH(
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

    // Check if product exists
    const existing = getProductById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse request body with size limit (1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1048576) {
      return NextResponse.json(
        { success: false, error: 'Request too large' },
        { status: 413 }
      );
    }
    
    const body = await request.json();

    // Validate fields (partial update allowed) with length constraints
    const schema = z.object({
      name: z.string().min(1).max(500).optional(),
      sku: z.string().min(1).max(100).optional(),
      brand: z.string().min(1).max(100).optional(),
      type: z.enum(['air-filter', 'water-filter', 'refrigerator-filter', 'humidifier-filter', 'pool-filter', 'custom', 'accessory', 'other']).optional(),
      status: z.enum(['active', 'draft', 'archived', 'out-of-stock']).optional(),
      price: z.number().min(0).max(999999.99).finite().optional(),
      description: z.string().max(10000).optional(),
      shortDescription: z.string().max(500).optional(),
      compareAtPrice: z.number().min(0).max(999999.99).finite().nullable().optional(),
      costPrice: z.number().min(0).max(999999.99).finite().nullable().optional(),
      trackInventory: z.boolean().optional(),
      inventoryQuantity: z.number().int().min(0).max(999999).optional(),
      lowStockThreshold: z.number().int().min(0).max(10000).optional(),
      allowBackorder: z.boolean().optional(),
      height: z.number().min(0).max(999).finite().nullable().optional(),
      width: z.number().min(0).max(999).finite().nullable().optional(),
      depth: z.number().min(0).max(999).finite().nullable().optional(),
      weight: z.number().min(0).max(9999).finite().optional(),
      mervRating: z.enum(['1-4', '5-7', '8', '9-12', '13', '14-16', '17-20']).nullable().optional(),
      features: z.string().max(10000).optional(),
      specifications: z.string().max(10000).optional(),
      compatibleModels: z.string().max(5000).optional(),
      primaryImage: z.string().max(500).optional(),
      additionalImages: z.string().max(5000).optional(),
      categoryIds: z.array(z.string().max(50)).max(20).optional(),
      tags: z.array(z.string().max(50)).max(50).optional(),
      metaTitle: z.string().max(200).optional(),
      metaDescription: z.string().max(500).optional(),
      metaKeywords: z.string().max(500).optional(),
      isFeatured: z.boolean().optional(),
      isNew: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      madeInUSA: z.boolean().optional(),
      freeShipping: z.boolean().optional(),
      subscriptionEligible: z.boolean().optional(),
      subscriptionDiscount: z.number().min(0).max(100).optional()
    }).partial();

    const validatedData = schema.parse(body);

    // Update product
    const product = updateProduct(
      id,
      validatedData as Partial<ProductFormData>,
      session.user.id,
      session.user.name || session.user.email
    );

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete product (soft delete - archives it)
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

    // Check if product exists
    const existing = getProductById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete (archive) product
    const success = deleteProduct(
      id,
      session.user.id,
      session.user.name || session.user.email
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}

