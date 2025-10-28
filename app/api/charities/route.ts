/**
 * Charities API Route
 * GET /api/charities - Get all active charities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveCharities, getFeaturedCharity } from '@/lib/db/charities-mock';
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
    const featured = searchParams.get('featured') === 'true';
    
    if (featured) {
      const charity = await getFeaturedCharity();
      return NextResponse.json(charity, {
        headers: {
          'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      });
    }
    
    const charities = await getActiveCharities();
    return NextResponse.json(charities, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error) {
    // Secure error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching charities:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch charities' },
      { status: 500 }
    );
  }
}

