/**
 * Model Search API Route
 * Search for appliance models by brand, model number, or keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchModels, getAllBrands } from '@/lib/db/models';
import { ApplianceType } from '@/lib/types/model';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const startTime = Date.now();
  
  try {
    // Apply rate limiting - stricter for search to prevent scraping
    const rateLimitResult = await checkRateLimit(identifier, {
      ...rateLimitPresets.standard,
      maxRequests: 15, // 15 requests per minute
    });
    
    if (!rateLimitResult.success) {
      logger.warn('Model search rate limit exceeded', {
        identifier: identifier.substring(0, 8) + '***',
      });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const rawBrand = searchParams.get('brand') || undefined;
    const applianceType = searchParams.get('type') as ApplianceType | undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 results
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Sanitize and validate inputs
    const query = sanitizeInput(rawQuery).substring(0, 100); // Max 100 chars
    const brand = rawBrand ? sanitizeInput(rawBrand).substring(0, 50) : undefined;

    // If no query, return all brands
    if (!query && !brand && !applianceType) {
      const brands = await getAllBrands();
      return NextResponse.json({
        brands,
        models: [],
        total: 0,
        suggestions: [],
      });
    }

    const results = await searchModels({
      query,
      brand,
      applianceType,
      limit,
      offset,
    });

    const duration = Date.now() - startTime;

    // Log search for analytics and abuse detection
    logger.info('Model search completed', {
      query: query.substring(0, 20), // Log partial query for privacy
      resultsCount: results.total,
      duration,
      identifier: identifier.substring(0, 8) + '***',
    });

    return NextResponse.json({
      models: results.models,
      total: results.total,
      query,
      suggestions: [], // TODO: Implement did-you-mean suggestions
    });
  } catch (error) {
    logger.error('Model search error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Search failed',
      identifier: identifier.substring(0, 8) + '***',
    });
    
    return NextResponse.json(
      { error: 'Failed to search models' },
      { status: 500 }
    );
  }
}
