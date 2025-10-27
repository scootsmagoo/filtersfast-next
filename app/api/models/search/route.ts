/**
 * Model Search API Route
 * 
 * GET /api/models/search?q=RF28R7351SR&type=refrigerator&brand=samsung
 * Search for appliance models to find compatible filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/security';
import type { ModelLookupResult, ApplianceType } from '@/lib/types/models';

// Rate limiter for search endpoint (30 requests per minute)
const searchRateLimiter = new RateLimiter(30, 60 * 1000);

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!searchRateLimiter.isAllowed(clientId)) {
      const retryAfter = searchRateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { 
          error: 'Too many search requests. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter)
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') as ApplianceType | null;
    const brand = searchParams.get('brand');

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Clean and sanitize query
    const cleanQuery = query.trim().toUpperCase().substring(0, 50);

    // TODO: Replace with actual database query
    // Example SQL query structure:
    /*
      SELECT 
        m.idModel,
        m.modelNumber,
        m.brand,
        m.applianceType,
        m.description,
        m.imageUrl,
        p.idProduct,
        p.description as productName,
        p.sku,
        p.price,
        p.brand as productBrand,
        p.smallImageUrl,
        p.rating,
        p.reviewCount,
        p.stock,
        mp.isPrimary
      FROM tFridgeModelLookup m
      LEFT JOIN modelProducts mp ON m.idModel = mp.idModel
      LEFT JOIN products p ON mp.idProduct = p.idProduct
      WHERE m.modelNumber LIKE @query
        OR m.brand LIKE @query
        OR m.description LIKE @query
      ORDER BY 
        CASE 
          WHEN m.modelNumber = @query THEN 1
          WHEN m.modelNumber LIKE @query + '%' THEN 2
          ELSE 3
        END,
        mp.isPrimary DESC
      LIMIT 10
    */

    const results = await searchModels(cleanQuery, type, brand);

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      results,
      count: results.length,
    });

  } catch (error) {
    console.error('Error in model search API:', error);
    return NextResponse.json(
      { error: 'Failed to search models' },
      { status: 500 }
    );
  }
}

/**
 * Search for appliance models
 * TODO: Replace with actual database query
 */
async function searchModels(
  query: string,
  type?: ApplianceType | null,
  brand?: string | null
): Promise<ModelLookupResult[]> {
  // Mock data for development
  // In production, this would query your database
  
  const mockResults: ModelLookupResult[] = [
    {
      model: {
        id: '1',
        modelNumber: 'RF28R7351SR',
        brand: 'Samsung',
        type: 'refrigerator',
        description: 'Samsung 28 cu. ft. 4-Door French Door Refrigerator',
        imageUrl: '/images/appliances/samsung-rf28r7351sr.jpg',
      },
      compatibleProducts: [
        {
          id: 101,
          name: 'Samsung DA29-00020B Refrigerator Water Filter',
          sku: 'DA29-00020B',
          brand: 'Samsung',
          price: 49.99,
          image: '/products/samsung-da29-00020b.jpg',
          rating: 4.7,
          reviewCount: 1245,
          inStock: true,
          isPrimary: true,
        },
        {
          id: 102,
          name: 'Samsung HAF-CIN Refrigerator Water Filter',
          sku: 'HAF-CIN',
          brand: 'Samsung',
          price: 44.99,
          image: '/products/samsung-haf-cin.jpg',
          rating: 4.6,
          reviewCount: 892,
          inStock: true,
          isPrimary: false,
        },
      ],
      matchConfidence: 'exact',
    },
    {
      model: {
        id: '2',
        modelNumber: 'RF28R7201SR',
        brand: 'Samsung',
        type: 'refrigerator',
        description: 'Samsung 28 cu. ft. French Door Refrigerator',
        imageUrl: '/images/appliances/samsung-rf28r7201sr.jpg',
      },
      compatibleProducts: [
        {
          id: 101,
          name: 'Samsung DA29-00020B Refrigerator Water Filter',
          sku: 'DA29-00020B',
          brand: 'Samsung',
          price: 49.99,
          image: '/products/samsung-da29-00020b.jpg',
          rating: 4.7,
          reviewCount: 1245,
          inStock: true,
          isPrimary: true,
        },
      ],
      matchConfidence: 'partial',
    },
  ];

  // Filter by type if specified
  const filtered = type 
    ? mockResults.filter(r => r.model.type === type)
    : mockResults;

  // Filter by brand if specified
  const brandFiltered = brand
    ? filtered.filter(r => r.model.brand.toLowerCase() === brand.toLowerCase())
    : filtered;

  return brandFiltered;
}

