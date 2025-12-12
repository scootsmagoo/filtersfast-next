/**
 * Single Partner API Route
 * GET /api/partners/[slug] - Get partner by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPartnerBySlug, trackPartnerView } from '@/lib/db/partners';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
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
    
    // OWASP A03 Fix: Sanitize slug parameter to prevent injection
    const sanitizedSlug = params.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (!sanitizedSlug || sanitizedSlug !== params.slug) {
      return NextResponse.json(
        { error: 'Invalid partner slug format' },
        { status: 400 }
      );
    }
    
    const partner = getPartnerBySlug(sanitizedSlug);
    
    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }
    
    if (!partner.active) {
      return NextResponse.json(
        { error: 'Partner page is not active' },
        { status: 404 }
      );
    }
    
    // Track page view (async, don't wait)
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const userId = session?.user?.id;
      const headersList = await headers();
      const rawIp = headersList.get('x-forwarded-for')?.split(',')[0] || 
                    headersList.get('x-real-ip') ||
                    'unknown';
      
      // OWASP A09 Fix: Anonymize IP address (remove last octet for IPv4, last 80 bits for IPv6)
      const anonymizedIp = rawIp !== 'unknown' 
        ? rawIp.includes('.') 
          ? rawIp.split('.').slice(0, 3).join('.') + '.0' // IPv4
          : rawIp.split(':').slice(0, 4).join(':') + '::' // IPv6
        : 'unknown';
      
      const userAgent = headersList.get('user-agent') || 'unknown';
      
      // Track view without blocking response
      setImmediate(() => {
        try {
          trackPartnerView(partner.id, userId, anonymizedIp, userAgent);
        } catch (error) {
          console.error('[Partners API] Error tracking view:', error);
        }
      });
    } catch (error) {
      // Silently fail tracking
      console.error('[Partners API] Error getting session for tracking:', error);
    }
    
    return NextResponse.json(partner, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[Partners API] Error fetching partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner' },
      { status: 500 }
    );
  }
}

