/**
 * Charity Details API Route
 * GET /api/charities/[id] - Get charity by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCharityById } from '@/lib/db/charities-mock';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const charity = await getCharityById(params.id);
    
    if (!charity) {
      return NextResponse.json(
        { error: 'Charity not found' },
        { 
          status: 404,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }
    
    return NextResponse.json(charity, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error) {
    // Secure error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching charity:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch charity' },
      { status: 500 }
    );
  }
}

