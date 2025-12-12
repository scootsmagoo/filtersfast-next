/**
 * Admin Products API
 * GET - List products with filters
 * POST - Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { listProducts, createProduct, getProductStats } from '@/lib/db/products';
import type { ProductFormData } from '@/lib/types/product';
import { headers } from 'next/headers';
import { z } from 'zod';

// Rate limiting - 100 requests per minute for admins
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000; // 1 minute
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
 * GET /api/admin/products
 * List products with filters and pagination
 */
export async function GET(request: NextRequest) {
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
    if (!checkRateLimit(`admin-products-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Input validation and sanitization
    const rawSearch = searchParams.get('search');
    const rawBrand = searchParams.get('brand');
    const rawMinPrice = searchParams.get('minPrice');
    const rawMaxPrice = searchParams.get('maxPrice');
    
    // Validate search length (max 200 chars)
    const search = rawSearch && rawSearch.length <= 200 ? rawSearch : undefined;
    
    // Validate brand (max 100 chars, alphanumeric + spaces/hyphens)
    const brand = rawBrand && rawBrand.length <= 100 && /^[a-zA-Z0-9\s\-&]+$/.test(rawBrand) 
      ? rawBrand : undefined;
    
    // Validate prices (0-999999.99, reject NaN/Infinity)
    const minPrice = rawMinPrice ? parseFloat(rawMinPrice) : undefined;
    const maxPrice = rawMaxPrice ? parseFloat(rawMaxPrice) : undefined;
    
    if (minPrice !== undefined && (isNaN(minPrice) || !isFinite(minPrice) || minPrice < 0 || minPrice > 999999.99)) {
      return NextResponse.json(
        { success: false, error: 'Invalid minimum price' },
        { status: 400 }
      );
    }
    
    if (maxPrice !== undefined && (isNaN(maxPrice) || !isFinite(maxPrice) || maxPrice < 0 || maxPrice > 999999.99)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maximum price' },
        { status: 400 }
      );
    }
    
    const filters = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      brand,
      categoryId: searchParams.get('categoryId') || undefined,
      search,
      minPrice,
      maxPrice,
      inStock: searchParams.get('inStock') === 'true',
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : searchParams.get('isFeatured') === 'false' ? false : undefined,
      mervRating: searchParams.get('mervRating') as any,
      sortBy: (searchParams.get('sortBy') as any) || 'updated',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Validate pagination (clamp values)
    filters.limit = Math.max(1, Math.min(100, filters.limit));
    filters.offset = Math.max(0, filters.offset);

    // Get products
    const result = listProducts(filters);

    // Get stats if requested
    const includeStats = searchParams.get('includeStats') === 'true';
    const stats = includeStats ? getProductStats() : null;

    return NextResponse.json({
      success: true,
      ...result,
      stats
    });

  } catch (error) {
    console.error('Error listing products:', error);
    
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to list products' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create new product
 */
export async function POST(request: NextRequest) {
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
    if (!checkRateLimit(`admin-products-create-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
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

    const sanitizeBlockedReason = (value: string | null | undefined) => {
      if (!value) return null;
      const upper = value.trim().toUpperCase().slice(0, 100);
      const cleaned = upper.replace(/[^A-Z0-9\s_-]/g, '').replace(/\s+/g, ' ').trim();
      return cleaned.length ? cleaned : null;
    };

    // Validate required fields with length constraints
    const schema = z.object({
      name: z.string().min(1, 'Product name is required').max(500, 'Name too long'),
      sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
      brand: z.string().min(1, 'Brand is required').max(100, 'Brand too long'),
      type: z.enum(['air-filter', 'water-filter', 'refrigerator-filter', 'humidifier-filter', 'pool-filter', 'gift-card', 'custom', 'accessory', 'other']),
      status: z.enum(['active', 'draft', 'archived', 'out-of-stock']).default('draft'),
      price: z.number().min(0, 'Price must be non-negative').max(999999.99, 'Price too high').finite('Price must be a valid number'),
      description: z.string().max(10000, 'Description too long').optional().default(''),
      shortDescription: z.string().max(500, 'Short description too long').optional().default(''),
      compareAtPrice: z.number().min(0).max(999999.99).finite().nullable().optional(),
      costPrice: z.number().min(0).max(999999.99).finite().nullable().optional(),
      trackInventory: z.boolean().default(true),
      inventoryQuantity: z.number().int().min(0).max(999999).default(0),
      lowStockThreshold: z.number().int().min(0).max(10000).default(10),
      allowBackorder: z.boolean().default(false),
      maxCartQty: z.number().int().min(0).max(999).nullable().optional(),
      height: z.number().min(0).max(999).finite().nullable().optional(),
      width: z.number().min(0).max(999).finite().nullable().optional(),
      depth: z.number().min(0).max(999).finite().nullable().optional(),
      weight: z.number().min(0).max(9999).finite().default(0),
      mervRating: z.enum(['1-4', '5-7', '8', '9-12', '13', '14-16', '17-20']).nullable().optional(),
      features: z.string().max(10000, 'Features too long').default(''),
      specifications: z.string().max(10000, 'Specifications too long').default(''),
      compatibleModels: z.string().max(5000, 'Compatible models too long').default(''),
      primaryImage: z.string().max(500, 'Image URL too long').default(''),
      additionalImages: z.string().max(5000, 'Additional images too long').default(''),
      categoryIds: z.array(z.string().max(50)).max(20, 'Too many categories').default([]),
      tags: z.array(z.string().max(50)).max(50, 'Too many tags').default([]),
      metaTitle: z.string().max(200, 'Meta title too long').default(''),
      metaDescription: z.string().max(500, 'Meta description too long').default(''),
      metaKeywords: z.string().max(500, 'Meta keywords too long').default(''),
      isFeatured: z.boolean().default(false),
      isNew: z.boolean().default(false),
      isBestSeller: z.boolean().default(false),
      madeInUSA: z.boolean().default(false),
      freeShipping: z.boolean().default(false),
      subscriptionEligible: z.boolean().default(true),
      subscriptionDiscount: z.number().min(0).max(100).default(5),
      giftWithPurchaseProductId: z.string().max(100).nullable().optional(),
      giftWithPurchaseQuantity: z.number().int().min(1).max(1000).default(1),
      giftWithPurchaseAutoAdd: z.boolean().default(true),
      retExclude: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
      blockedReason: z.string().max(100).nullable().default(null)
    });

    const validatedData = schema.parse(body);

    const normalizedData = {
      ...validatedData,
      maxCartQty: validatedData.maxCartQty && validatedData.maxCartQty > 0
        ? validatedData.maxCartQty
        : null,
      giftWithPurchaseProductId: validatedData.giftWithPurchaseProductId && validatedData.giftWithPurchaseProductId.trim().length > 0
        ? validatedData.giftWithPurchaseProductId.trim()
        : null,
      giftWithPurchaseQuantity: validatedData.giftWithPurchaseProductId
        ? validatedData.giftWithPurchaseQuantity
        : 1,
      giftWithPurchaseAutoAdd: validatedData.giftWithPurchaseProductId
        ? validatedData.giftWithPurchaseAutoAdd
        : false,
      blockedReason: sanitizeBlockedReason(validatedData.blockedReason)
    } as ProductFormData;

    if (normalizedData.type === 'gift-card') {
      const mutableData = normalizedData as ProductFormData & Record<string, unknown>;
      mutableData.giftWithPurchaseProductId = null;
      mutableData.giftWithPurchaseQuantity = 1;
      mutableData.giftWithPurchaseAutoAdd = false;
      mutableData.maxCartQty = null;
      mutableData.retExclude = 0;
      mutableData.blockedReason = null;
    }

    // Create product
    const product = createProduct(
      normalizedData,
      session.user.id,
      session.user.name || session.user.email
    );

    return NextResponse.json({
      success: true,
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
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

    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

