/**
 * Public API: Products
 * GET /api/products
 * List products for public viewing
 */

import { NextRequest, NextResponse } from 'next/server';
import { listProducts } from '@/lib/db/products';
import type { ProductFilters } from '@/lib/types/product';

// GET /api/products - List products (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: ProductFilters = {
      status: 'active', // Only show active products
      type: searchParams.get('type') as any || undefined,
      brand: searchParams.get('brand') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      mervRating: searchParams.get('mervRating') as any || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'updated',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = listProducts(filters);
    
    return NextResponse.json({
      success: true,
      products: result.products,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

