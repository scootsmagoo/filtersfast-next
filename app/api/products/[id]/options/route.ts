/**
 * Public API: Product Options
 * GET /api/products/[id]/options
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProductOptionsWithInventory,
  getProductOptionGroups,
} from '@/lib/db/product-options';

// GET /api/products/[id]/options - Get options for a product (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate product ID format (should be like "prod-xxx")
    if (!id || typeof id !== 'string' || (!id.startsWith('prod-') && isNaN(parseInt(id)))) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Verify product exists and is active (public API should only show active products)
    // Note: This is a public endpoint, so we don't require auth, but we should verify product status
    const { getProductById } = await import('@/lib/db/products');
    const product = getProductById(id);
    
    if (!product || product.status !== 'active') {
      // Don't reveal if product exists or not, just return empty options
      return NextResponse.json({
        success: true,
        optionGroups: [],
        optionsWithInventory: {},
      });
    }
    
    const optionGroups = getProductOptionGroups(id);
    const optionsWithInventory = getProductOptionsWithInventory(id);

    return NextResponse.json({
      success: true,
      optionGroups,
      optionsWithInventory,
    });
  } catch (error: any) {
    console.error('Error fetching product options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product options' },
      { status: 500 }
    );
  }
}

