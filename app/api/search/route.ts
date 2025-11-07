import { NextRequest, NextResponse } from 'next/server';
import { SearchableProduct, SearchResult, SearchResponse, SearchFilters } from '@/lib/types';
import { listProducts } from '@/lib/db/products';
import { 
  normalizeQuery, 
  calculateScore, 
  getMatchType, 
  getMatchedFields, 
  applyFilters,
  generateSuggestions 
} from '@/lib/search-utils';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';
import { logSearch } from '@/lib/db/search-analytics';

// Helper to convert database Product to SearchableProduct
function productToSearchable(product: any): SearchableProduct {
  const categoryMap: Record<string, SearchableProduct['category']> = {
    'air-filter': 'air',
    'water-filter': 'water',
    'refrigerator-filter': 'refrigerator',
    'humidifier-filter': 'humidifier',
    'pool-filter': 'pool',
  };
  
  // Get the original product ID - should be a string like "prod-xxx" from database
  const originalId = product.id;
  
  // Calculate numeric ID for backward compatibility
  const numericId = typeof originalId === 'string' 
    ? parseInt(originalId.replace(/\D/g, '')) || 0
    : (typeof originalId === 'number' ? originalId : 0);
  
  // ALWAYS preserve the original ID as productId for database products
  // This is critical for proper linking to product detail pages
  // If originalId is a string (database product), use it as productId
  // If it's a number (legacy/mock), convert to string
  const productIdValue: string | undefined = typeof originalId === 'string' && originalId.trim().length > 0
    ? originalId 
    : (typeof originalId === 'number' ? String(originalId) : undefined);
  
  // Build the searchable product - ALWAYS include productId when we have originalId
  const searchable: any = {
    id: numericId, // Keep numeric for backward compatibility with mock data
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    price: product.price,
    originalPrice: product.compareAtPrice || undefined,
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    image: product.primaryImage || '/images/product-placeholder.jpg',
    inStock: product.inventoryQuantity > 0 || !product.trackInventory,
    badges: [
      ...(product.isBestSeller ? ['bestseller'] : []),
      ...(product.isFeatured ? ['featured'] : []),
      ...(product.isNew ? ['new'] : []),
      ...(product.madeInUSA ? ['made-in-usa'] : []),
    ],
    category: categoryMap[product.type] || 'other',
    description: product.description || '',
    searchKeywords: [
      product.name.toLowerCase(),
      product.brand.toLowerCase(),
      product.sku.toLowerCase(),
      ...(product.description || '').toLowerCase().split(/\s+/),
      ...(product.tags || []),
    ],
    partNumbers: [product.sku, ...(product.tags || [])],
    compatibility: product.compatibleModels || [],
    specifications: product.specifications || {},
  };
  
  // CRITICAL: Explicitly set productId AFTER building the object to ensure it's included
  // This is the most important field for proper product linking
  if (productIdValue) {
    searchable.productId = productIdValue;
  }
  
  // Verify productId is set (for database products starting with "prod-")
  if (typeof originalId === 'string' && originalId.startsWith('prod-') && !searchable.productId) {
    console.error('[productToSearchable] ERROR: productId not set for database product!', {
      originalId,
      productIdValue,
      searchableKeys: Object.keys(searchable)
    });
    // Force set it as a fallback
    searchable.productId = originalId;
  }
  
  return searchable as SearchableProduct;
}

// Mock enhanced product data (fallback if database is empty)
const mockSearchableProducts: SearchableProduct[] = [
  // Refrigerator Filters
  {
    id: 1,
    name: 'GE MWF Refrigerator Water Filter',
    brand: 'GE',
    sku: 'MWF',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewCount: 1247,
    image: '/products/ge-mwf.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
    category: 'refrigerator',
    description: 'Genuine GE MWF refrigerator water filter replacement. Reduces chlorine taste and odor, lead, and other contaminants.',
    searchKeywords: ['ge', 'mwf', 'refrigerator', 'water', 'filter', 'genuine', 'replacement'],
    partNumbers: ['MWF', 'GEMWF', 'GE-MWF'],
    compatibility: ['GE Refrigerators', 'Hotpoint', 'Profile'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Cysts'
    }
  },
  {
    id: 2,
    name: 'Whirlpool EDR1RXD1 Water Filter',
    brand: 'Whirlpool',
    sku: 'EDR1RXD1',
    price: 44.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/products/whirlpool-edr1rxd1.jpg',
    inStock: true,
    badges: ['genuine'],
    category: 'refrigerator',
    description: 'OEM Whirlpool EDR1RXD1 water filter. Fits most Whirlpool, KitchenAid, and Maytag refrigerators.',
    searchKeywords: ['whirlpool', 'edr1rxd1', 'refrigerator', 'water', 'filter', 'kitchenaid', 'maytag'],
    partNumbers: ['EDR1RXD1', '4396508', '4396710'],
    compatibility: ['Whirlpool', 'KitchenAid', 'Maytag'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Mercury'
    }
  },
  {
    id: 3,
    name: 'LG LT700P Refrigerator Water Filter',
    brand: 'LG',
    sku: 'LT700P',
    price: 42.99,
    originalPrice: 54.99,
    rating: 4.9,
    reviewCount: 2103,
    image: '/products/lg-lt700p.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
    category: 'refrigerator',
    description: 'LG LT700P genuine water filter. NSF certified to reduce chlorine taste and odor.',
    searchKeywords: ['lg', 'lt700p', 'refrigerator', 'water', 'filter', 'nsf', 'certified'],
    partNumbers: ['LT700P', 'ADQ73613401'],
    compatibility: ['LG Refrigerators'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Cysts'
    }
  },
  // Water Filters
  {
    id: 201,
    name: 'Under Sink Water Filter Replacement',
    brand: 'Filters Fast',
    sku: 'FFUL-001',
    price: 24.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/water-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'water',
    description: 'Universal under sink water filter replacement cartridge. Fits most standard under sink systems.',
    searchKeywords: ['under', 'sink', 'water', 'filter', 'replacement', 'universal', 'cartridge'],
    partNumbers: ['FFUL-001', 'FF-UL-001'],
    compatibility: ['Universal'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.75 GPM',
      'Contaminants': 'Chlorine, Sediment, Taste'
    }
  },
  {
    id: 202,
    name: 'Whole House Water Filter Cartridge',
    brand: '3M Aqua-Pure',
    sku: '3MAP-217',
    price: 49.99,
    rating: 4.8,
    reviewCount: 645,
    image: '/images/water-filter-2.jpg',
    inStock: true,
    category: 'water',
    description: '3M Aqua-Pure whole house water filter cartridge. High capacity sediment and chlorine reduction.',
    searchKeywords: ['whole', 'house', 'water', 'filter', '3m', 'aqua', 'pure', 'sediment', 'chlorine'],
    partNumbers: ['3MAP-217', 'AP217'],
    compatibility: ['3M Aqua-Pure Systems'],
    specifications: {
      'Filter Life': '12 months',
      'Flow Rate': '10 GPM',
      'Contaminants': 'Sediment, Chlorine, Taste'
    }
  },
  // Air Filters
  {
    id: 301,
    name: '16x20x1 Air Filter - 3 Pack',
    brand: 'FiltersFast',
    sku: 'FF-AF-1620-1-3PK',
    price: 29.99,
    rating: 4.6,
    reviewCount: 1234,
    image: '/images/air-filter-1.jpg',
    inStock: true,
    badges: ['value'],
    category: 'air',
    description: 'High-efficiency 16x20x1 air filter 3-pack. MERV 8 rating for excellent particle capture.',
    searchKeywords: ['16x20x1', 'air', 'filter', 'merv', '8', 'hvac', 'furnace', 'ac'],
    partNumbers: ['FF-AF-1620-1-3PK', '1620-1-3PK'],
    compatibility: ['16x20x1 HVAC Systems'],
    specifications: {
      'Size': '16x20x1',
      'MERV Rating': '8',
      'Pack Quantity': '3',
      'Filter Life': '3 months'
    }
  },
  {
    id: 302,
    name: '20x25x1 Air Filter - 6 Pack',
    brand: 'Honeywell',
    sku: 'HWF-2025-1-6PK',
    price: 45.99,
    rating: 4.8,
    reviewCount: 856,
    image: '/images/air-filter-2.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'air',
    description: 'Honeywell 20x25x1 air filter 6-pack. MERV 11 rating for superior air quality.',
    searchKeywords: ['20x25x1', 'air', 'filter', 'honeywell', 'merv', '11', 'hvac', 'furnace'],
    partNumbers: ['HWF-2025-1-6PK', 'FC100A1037'],
    compatibility: ['20x25x1 HVAC Systems'],
    specifications: {
      'Size': '20x25x1',
      'MERV Rating': '11',
      'Pack Quantity': '6',
      'Filter Life': '3 months'
    }
  },
  {
    id: 501,
    name: 'Aprilaire 35 Humidifier Filter',
    brand: 'Aprilaire',
    sku: 'APR-35',
    price: 16.99,
    rating: 4.8,
    reviewCount: 1234,
    image: '/images/humidifier-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'humidifier',
    description: 'Aprilaire 35 replacement humidifier filter pad.',
    searchKeywords: ['aprilaire', '35', 'humidifier', 'filter', 'pad', 'replacement'],
    partNumbers: ['APR-35', '35'],
    compatibility: ['Aprilaire 350', 'Aprilaire 360'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '10" x 13" x 1.75"',
      'Material': 'Evaporative Pad'
    }
  },
  {
    id: 502,
    name: 'Honeywell HC-14 Replacement Filter',
    brand: 'Honeywell',
    sku: 'HON-HC14',
    price: 14.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/humidifier-filter-2.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Honeywell HC-14 replacement humidifier filter.',
    searchKeywords: ['honeywell', 'hc-14', 'hc14', 'humidifier', 'filter', 'replacement'],
    partNumbers: ['HON-HC14', 'HC-14', 'HC14'],
    compatibility: ['Honeywell HCM Series'],
    specifications: {
      'Filter Life': '1-3 months',
      'Type': 'Wicking Filter',
      'Material': 'Paper'
    }
  },
  {
    id: 503,
    name: 'Essick Air HDC-12 Humidifier Wick',
    brand: 'Essick Air',
    sku: 'ESS-HDC12',
    price: 11.99,
    rating: 4.6,
    reviewCount: 567,
    image: '/images/humidifier-filter-3.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Essick Air HDC-12 humidifier wick filter.',
    searchKeywords: ['essick', 'air', 'hdc-12', 'hdc12', 'humidifier', 'wick', 'filter'],
    partNumbers: ['ESS-HDC12', 'HDC-12', 'HDC12'],
    compatibility: ['Essick Air Humidifiers'],
    specifications: {
      'Filter Life': '1-2 months',
      'Type': 'Wicking Filter',
      'Material': 'Paper'
    }
  },
  {
    id: 401,
    name: 'Pool Filter Cartridge - Hayward C-225',
    brand: 'Filters Fast',
    sku: 'FF-HC225',
    price: 39.99,
    rating: 4.7,
    reviewCount: 567,
    image: '/images/pool-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'pool',
    description: 'Replacement cartridge for Hayward C-225 pool filters.',
    searchKeywords: ['pool', 'filter', 'cartridge', 'hayward', 'c-225', 'replacement'],
    partNumbers: ['FF-HC225', 'C-225'],
    compatibility: ['Hayward C-225'],
    specifications: {
      'Filter Life': '1 season',
      'Dimensions': '4.5" x 8.25"',
      'Material': 'Polyester'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - prevent abuse
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.generous);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitPresets.generous.maxRequests),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Sanitize and validate input parameters
    // Strip HTML tags and limit length (React will escape on render, but we sanitize for safety)
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.replace(/<[^>]*>/g, '').trim().slice(0, 200); // Limit to 200 chars, strip HTML
    const category = (searchParams.get('category') || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);
    const brand = (searchParams.get('brand') || '').replace(/<[^>]*>/g, '').trim().slice(0, 100);
    
    // Validate and sanitize numeric inputs
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const minPrice = minPriceParam ? sanitizeNumber(minPriceParam, 0, 100000) : undefined;
    const maxPrice = maxPriceParam ? sanitizeNumber(maxPriceParam, 0, 100000) : undefined;
    
    // Validate price range
    if (minPrice !== null && maxPrice !== null && minPrice !== undefined && maxPrice !== undefined) {
      if (minPrice > maxPrice) {
        return NextResponse.json(
          { error: 'Invalid price range. Minimum price cannot be greater than maximum price.' },
          { status: 400 }
        );
      }
    }
    
    const inStock = searchParams.get('inStock') === 'true';
    const minRatingParam = searchParams.get('minRating');
    const minRating = minRatingParam ? sanitizeNumber(minRatingParam, 0, 5) : undefined;
    
    // Validate pagination parameters
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = pageParam ? Math.max(1, Math.min(1000, Math.floor(sanitizeNumber(pageParam, 1, 1000) || 1))) : 1;
    const limit = limitParam ? Math.max(1, Math.min(100, Math.floor(sanitizeNumber(limitParam, 1, 100) || 20))) : 20;

    // If no query, return empty results
    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        page,
        limit,
        query,
        suggestions: [],
        filters: {
          categories: {},
          brands: {},
          priceRange: { min: 0, max: 0 }
        }
      });
    }

    // Map category filter to product type
    const categoryToType: Record<string, string> = {
      'air': 'air-filter',
      'water': 'water-filter',
      'refrigerator': 'refrigerator-filter',
      'humidifier': 'humidifier-filter',
      'pool': 'pool-filter',
    };

    // Fetch products from database
    const productFilters = {
      status: 'active' as const, // Only search active products
      type: category ? (categoryToType[category] as any) : undefined,
      brand: brand || undefined,
      search: query,
      minPrice,
      maxPrice,
      inStock: inStock || undefined,
      limit: 1000, // Get more products for better search results
      offset: 0,
    };

    const dbResult = listProducts(productFilters);
    
    // Convert database products to searchable format, ensuring productId is preserved
    // Note: React automatically escapes rendered content, so we don't need to HTML-encode product data
    const dbProducts = dbResult.products.map(product => {
      const searchable = productToSearchable(product);
      
      // Warn if productId should be set but isn't (only in development)
      if (process.env.NODE_ENV === 'development' && !searchable.productId && product.id && typeof product.id === 'string' && product.id.startsWith('prod-')) {
        console.error('[Search API] ERROR: productId not set for database product!', {
          productId: product.id,
          searchableKeys: Object.keys(searchable),
          searchableId: searchable.id
        });
      }
      return searchable;
    });

    // Use database products, fallback to mock if empty
    const searchableProducts = dbProducts.length > 0 ? dbProducts : mockSearchableProducts;

    const normalizedQuery = normalizeQuery(query);

    // Perform search
    const searchResults: SearchResult[] = [];
    
    for (const product of searchableProducts) {
      const matchedFields = getMatchedFields(product, query);
      
      if (matchedFields.length > 0) {
        const score = calculateScore(product, query, matchedFields);
        const matchType = getMatchType(product, query, matchedFields);
        
        searchResults.push({
          product,
          score,
          matchType,
          matchedFields
        });
      }
    }

    // Sort by score (highest first)
    searchResults.sort((a, b) => b.score - a.score);

    // Apply additional filters (category filter already applied at DB level, but check again for consistency)
    const filters: SearchFilters = {
      category: category || undefined,
      brand: brand || undefined,
      minPrice,
      maxPrice,
      inStock: inStock || undefined,
      minRating
    };

    const filteredResults = applyFilters(searchResults, filters);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    // Generate suggestions
    const suggestions = generateSuggestions(searchableProducts, query, 5);

    // Generate filter options
    const filterOptions = {
      categories: searchableProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      brands: searchableProducts.reduce((acc, product) => {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priceRange: searchableProducts.length > 0 ? {
        min: Math.min(...searchableProducts.map(p => p.price)),
        max: Math.max(...searchableProducts.map(p => p.price))
      } : { min: 0, max: 0 }
    };

    const response: SearchResponse = {
      results: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      query,
      suggestions,
      filters: filterOptions
    };

    // Log search for analytics (async, don't block response)
    try {
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const referrer = request.headers.get('referer') || null;
      const sessionId = request.cookies.get('sessionId')?.value || 
                       request.headers.get('x-session-id') || 
                       null;

      // Determine search type based on query patterns
      let searchType: 'product' | 'size' | 'sku' | 'model' | 'custom' | undefined;
      const normalizedQuery = query.toLowerCase().trim();
      if (/^\d+x\d+x\d+/.test(normalizedQuery) || /^\d+\s*x\s*\d+\s*x\s*\d+/.test(normalizedQuery)) {
        searchType = 'size';
      } else if (/^[a-z0-9-]+$/i.test(normalizedQuery) && normalizedQuery.length <= 20) {
        searchType = 'sku';
      } else if (/^[a-z]+\s*\d+$/i.test(normalizedQuery)) {
        searchType = 'model';
      } else {
        searchType = 'product';
      }

      // Determine outcome
      const outcome = filteredResults.length > 0 ? 'results_found' : 'no_results';

      // Extract filters
      const filtersApplied: Record<string, any> = {};
      if (category) filtersApplied.category = category;
      if (brand) filtersApplied.brand = brand;
      if (minPrice !== undefined) filtersApplied.minPrice = minPrice;
      if (maxPrice !== undefined) filtersApplied.maxPrice = maxPrice;
      if (inStock) filtersApplied.inStock = true;
      if (minRating !== undefined) filtersApplied.minRating = minRating;

      // Get product IDs from results
      const resultProductIds = paginatedResults
        .map(r => r.product.productId || String(r.product.id))
        .filter(Boolean)
        .slice(0, 100); // OWASP: Limit to prevent DoS

      // OWASP: Sanitize search term before logging (query is already sanitized above)
      // Log the search (function will further sanitize inputs)
      logSearch({
        searchTerm: query, // Already sanitized above
        searchTermNormalized: normalizedQuery,
        sessionId: sessionId || undefined,
        ipAddress: ipAddress.slice(0, 45), // OWASP: Limit IP address length
        userAgent: userAgent.slice(0, 500), // OWASP: Limit user agent length
        outcome,
        resultCount: filteredResults.length,
        searchType,
        filtersApplied: Object.keys(filtersApplied).length > 0 ? filtersApplied : undefined,
        resultProductIds: resultProductIds.length > 0 ? resultProductIds : undefined,
        mobile: /mobile|android|iphone|ipad/i.test(userAgent),
        referrer: referrer ? referrer.slice(0, 500) : undefined // OWASP: Limit referrer length
      });
    } catch (error) {
      // Log search errors but don't fail the request
      console.error('Error logging search:', error);
    }

    // Return response with security headers
    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': String(rateLimitPresets.generous.maxRequests),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
        'X-Content-Type-Options': 'nosniff',
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
