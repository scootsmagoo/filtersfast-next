import { NextRequest, NextResponse } from 'next/server';
import { SIZE_FILTER_PRODUCTS, getProductsBySize, getUniqueDimensions, COMMON_SIZES } from '@/lib/db/size-filters';
import { SizeFilterProduct } from '@/lib/types/size-filter';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';

// GET /api/filters/size - Get filters by size with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute (generous for read-only)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 30, 60);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // Get dimension parameters
    const heightParam = searchParams.get('height');
    const widthParam = searchParams.get('width');
    const depthParam = searchParams.get('depth');
    const mervRatingParam = searchParams.get('mervRating');
    const categoryParam = searchParams.get('category');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const brandParam = searchParams.get('brand');
    
    // Special endpoint to get available dimensions
    if (searchParams.get('getDimensions') === 'true') {
      const dimensions = getUniqueDimensions();
      return NextResponse.json({
        success: true,
        dimensions,
        commonSizes: COMMON_SIZES.sort((a, b) => b.popularity - a.popularity),
      });
    }
    
    // Validate and sanitize dimensions (OWASP A03: Injection Prevention)
    // Min: 1 inch, Max: 48 inches (reasonable physical limits)
    const height = sanitizeNumber(heightParam, 1, 48);
    const width = sanitizeNumber(widthParam, 1, 48);
    const depth = sanitizeNumber(depthParam, 0.5, 6);
    
    // Get base products by size
    let products: SizeFilterProduct[] = getProductsBySize(height, width, depth);
    
    // Apply additional filters with validation
    if (mervRatingParam) {
      const mervRating = sanitizeNumber(mervRatingParam, 1, 20); // MERV 1-20 range
      if (mervRating) {
        products = products.filter(p => p.mervRating === mervRating);
      }
    }
    
    if (categoryParam) {
      // Sanitize category input (whitelist approach)
      const validCategories = ['air', 'water', 'refrigerator', 'pool', 'humidifier'];
      const sanitizedCategory = sanitizeText(categoryParam).toLowerCase();
      if (validCategories.includes(sanitizedCategory)) {
        products = products.filter(p => p.category === sanitizedCategory);
      }
    }
    
    if (minPriceParam) {
      const minPrice = sanitizeNumber(minPriceParam, 0, 999999);
      if (minPrice !== null) {
        products = products.filter(p => p.price >= minPrice);
      }
    }
    
    if (maxPriceParam) {
      const maxPrice = sanitizeNumber(maxPriceParam, 0, 999999);
      if (maxPrice !== null) {
        products = products.filter(p => p.price <= maxPrice);
      }
    }
    
    if (brandParam) {
      // Sanitize brand input to prevent XSS
      const sanitizedBrand = sanitizeText(brandParam).slice(0, 100);
      if (sanitizedBrand) {
        products = products.filter(p => p.brand.toLowerCase().includes(sanitizedBrand.toLowerCase()));
      }
    }
    
    // Sort by rating (default)
    products.sort((a, b) => b.rating - a.rating);
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      filters: {
        height,
        width,
        depth,
        mervRating: mervRatingParam ? sanitizeNumber(mervRatingParam, 1, 20) : null,
        category: categoryParam ? sanitizeText(categoryParam) : null,
      },
    });
    
  } catch (error) {
    // OWASP A05: Security Misconfiguration - Don't expose stack traces in production
    console.error('Error fetching filters by size:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch filters',
        // Only expose details in development
        ...(isDevelopment && { details: error instanceof Error ? error.message : 'Unknown error' })
      },
      { status: 500 }
    );
  }
}

