/**
 * Admin Category Products API
 * GET - Get products in category
 * POST - Add products to category
 * DELETE - Remove product from category
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getCategoryProducts, 
  addProductsToCategory, 
  addProductsToCategoryBySku,
  removeProductFromCategory 
} from '@/lib/db/categories';
import { headers } from 'next/headers';

// Rate limiting
const RATE_LIMIT = 100;
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

/**
 * GET /api/admin/categories/[id]/products
 * Get products in category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Rate limiting
    const userId = session.user.id;
    if (!checkRateLimit(`admin-category-products-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const products = getCategoryProducts(id);

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Error getting category products:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to get category products' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories/[id]/products
 * Add products to category
 * Body: { type: 'sku' | 'idProduct', ids: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Rate limiting
    const userId = session.user.id;
    if (!checkRateLimit(`admin-category-products-add-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, ids } = body;

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'sku' && type !== 'idProduct') {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "sku" or "idProduct"' },
        { status: 400 }
      );
    }

    // Parse and sanitize IDs (can be pipe-separated string or array)
    const idList = Array.isArray(ids) 
      ? ids.filter((id: any) => typeof id === 'string' && id.trim().length > 0 && id.length <= 100)
      : (typeof ids === 'string' ? ids.split('|') : [])
          .filter((id: string) => id.trim().length > 0 && id.length <= 100);

    // Limit batch size to prevent DoS
    if (idList.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Too many items. Maximum 1000 items per request.' },
        { status: 400 }
      );
    }

    if (type === 'sku') {
      // Validate SKU format (alphanumeric, hyphens, underscores)
      const validSkus = idList.filter((sku: string) => /^[a-zA-Z0-9_-]+$/.test(sku.trim()));
      if (validSkus.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid SKUs provided' },
          { status: 400 }
        );
      }
      addProductsToCategoryBySku(id, validSkus);
    } else if (type === 'idProduct') {
      const productIds = idList
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id) && id > 0 && id <= Number.MAX_SAFE_INTEGER);
      
      if (productIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid product IDs provided' },
          { status: 400 }
        );
      }
      addProductsToCategory(id, productIds);
    }

    return NextResponse.json({
      success: true,
      message: 'Products added to category'
    });

  } catch (error) {
    console.error('Error adding products to category:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to add products to category' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]/products
 * Remove product from category
 * Query: productId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Rate limiting
    const userId = session.user.id;
    if (!checkRateLimit(`admin-category-products-remove-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const productIdNum = parseInt(productId);
    if (isNaN(productIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    removeProductFromCategory(id, productIdNum);

    return NextResponse.json({
      success: true,
      message: 'Product removed from category'
    });

  } catch (error) {
    console.error('Error removing product from category:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to remove product from category' 
      },
      { status: 500 }
    );
  }
}

