/**
 * Custom Filter Pricing API
 * 
 * POST /api/custom-filters/calculate
 * Calculate pricing for custom air filter dimensions
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/security';
import type {
  CustomFilterConfiguration,
  CustomFilterPricing,
  FilterDepth,
  MervRating,
} from '@/lib/types/custom-filters';
import {
  DIMENSION_LIMITS,
  DOUBLE_SIZE_WIDTH_THRESHOLD,
  STANDARD_PRODUCT_IDS,
  FILTER_DEPTHS,
} from '@/lib/types/custom-filters';

// Rate limiter
const rateLimiter = new RateLimiter(60, 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimiter.isAllowed(clientId)) {
      const retryAfter = rateLimiter.getRemainingTime(clientId);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Parse request body
    const config: CustomFilterConfiguration = await request.json();

    // Validate dimensions
    const { height, width, depth } = config.dimensions;
    const { mervRating, quantity } = config;

    if (!validateDimensions(height, width, depth)) {
      return NextResponse.json(
        { error: 'Invalid dimensions. Please check the allowed ranges.' },
        { status: 400 }
      );
    }

    if (!mervRating || !['M08', 'M11', 'M13'].includes(mervRating)) {
      return NextResponse.json(
        { error: 'Invalid MERV rating' },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = await calculateCustomFilterPrice(config);

    return NextResponse.json({
      success: true,
      pricing,
      configuration: config,
    });

  } catch (error) {
    console.error('Error calculating custom filter price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}

/**
 * Validate filter dimensions
 */
function validateDimensions(
  height: number,
  width: number,
  depth: FilterDepth
): boolean {
  if (height < DIMENSION_LIMITS.height.min || height > DIMENSION_LIMITS.height.max) {
    return false;
  }
  if (width < DIMENSION_LIMITS.width.min || width > DIMENSION_LIMITS.width.max) {
    return false;
  }
  if (!DIMENSION_LIMITS.depth.includes(depth)) {
    return false;
  }
  return true;
}

/**
 * Calculate custom filter pricing
 * Based on the ASP logic from _INCcustomFilters_.asp
 */
async function calculateCustomFilterPrice(
  config: CustomFilterConfiguration
): Promise<CustomFilterPricing> {
  const { height, width, depth } = config.dimensions;
  const { mervRating } = config;

  // Get actual depth value
  const depthInfo = FILTER_DEPTHS.find(d => d.value === depth);
  const actualDepth = depthInfo?.actualDepth || depth;

  // Determine if double size
  const isDoubleSize = width >= DOUBLE_SIZE_WIDTH_THRESHOLD;

  // Calculate square inches
  const squareInches = height * width;

  // Get base product ID
  const baseProductId = STANDARD_PRODUCT_IDS[mervRating][depth];

  // Generate nominal size (formatted as HHxWWxD)
  const nominalSize = `${height.toString().padStart(2, '0')}x${width.toString().padStart(2, '0')}x${depth}`;

  // TODO: Replace with actual database pricing query
  // This should query custom_cost table with:
  // - Square inches
  // - MERV rating
  // - Depth
  // - Is double size flag
  const pricingData = await getCustomPricingFromDatabase(
    squareInches,
    mervRating,
    depth,
    isDoubleSize
  );

  // Generate SKU
  const sku = `CUSTOM-${mervRating}-${nominalSize}`;

  // Generate description
  const mervName = mervRating === 'M08' ? 'MERV 8' : mervRating === 'M11' ? 'MERV 11' : 'MERV 13';
  const description = `Custom Air Filter ${height}"x${width}"x${depth}" ${mervName}${isDoubleSize ? ' (Double Size)' : ''}`;

  return {
    baseProductId,
    sku,
    description,
    unitPrice: pricingData.unitPrice,
    casePrice: pricingData.casePrice,
    caseQuantity: pricingData.caseQuantity,
    isDoubleSize,
    actualDepth,
    nominalSize,
    minPrice: pricingData.minPrice,
    cost: pricingData.cost,
  };
}

/**
 * Get custom pricing from database
 * TODO: Replace with actual database query
 */
async function getCustomPricingFromDatabase(
  squareInches: number,
  mervRating: MervRating,
  depth: FilterDepth,
  isDoubleSize: boolean
): Promise<{
  unitPrice: number;
  casePrice?: number;
  caseQuantity?: number;
  minPrice: number;
  cost: number;
}> {
  // Mock pricing logic (replace with database query)
  // Base price calculation: square inches × MERV multiplier × depth multiplier
  
  const mervMultiplier = {
    M08: 0.12,
    M11: 0.15,
    M13: 0.18,
  };

  const depthMultiplier = {
    1: 1.0,
    2: 1.3,
    4: 1.6,
  };

  let basePrice = squareInches * mervMultiplier[mervRating] * depthMultiplier[depth];
  
  // Add premium for double size
  if (isDoubleSize) {
    basePrice *= 1.25;
  }

  // Minimum price
  const minPrice = 15.00;
  const unitPrice = Math.max(basePrice, minPrice);

  // Case pricing (typically 10-20% discount for bulk)
  const caseQuantity = depth === 1 ? 12 : depth === 2 ? 6 : 4;
  const casePrice = unitPrice * caseQuantity * 0.85; // 15% bulk discount

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    casePrice: Math.round(casePrice * 100) / 100,
    caseQuantity,
    minPrice,
    cost: Math.round(unitPrice * 0.6 * 100) / 100, // Estimated cost
  };
}

/**
 * GET endpoint - not supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to calculate pricing.' },
    { status: 405 }
  );
}

