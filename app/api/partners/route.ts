/**
 * Partners API Routes
 * GET /api/partners - Get all active partners
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActivePartners, getPartnersByType, getFeaturedPartners } from '@/lib/db/partners';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.generous);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const featured = searchParams.get('featured') === 'true';
    
    let partners;
    
    if (featured) {
      partners = getFeaturedPartners();
    } else if (type) {
      partners = getPartnersByType(type);
    } else {
      partners = getActivePartners();
    }
    
    return NextResponse.json(partners, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[Partners API] Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

