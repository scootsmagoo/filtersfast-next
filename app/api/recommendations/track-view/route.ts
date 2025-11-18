import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { trackProductView } from '@/lib/db/product-recommendations';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

const trackViewSchema = z.object({
  productId: z.string().min(1).max(100), // Limit length to prevent DoS
  viewDuration: z.number().int().min(0).max(3600).optional(), // Max 1 hour
  referrerUrl: z.string().max(2048).url().optional().or(z.literal('')), // Limit URL length
  sourceType: z.string().max(50).optional(), // Limit length
  recommendationType: z.string().max(50).optional(), // Limit length
});

/**
 * POST /api/recommendations/track-view
 * Track a product view for recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      `track-view-${identifier}`,
      rateLimitPresets.generous
    );
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }
    
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    const userId = session?.user?.id || null;
    
    // Get or create session ID with better security
    let sessionId = request.cookies.get('sessionId')?.value;
    if (!sessionId || !/^[a-zA-Z0-9_-]{20,}$/.test(sessionId)) {
      // Generate cryptographically secure session ID
      const { randomBytes } = await import('crypto');
      sessionId = `anon_${Date.now()}_${randomBytes(16).toString('hex')}`;
    }
    
    const body = await request.json();
    const data = trackViewSchema.parse(body);
    
    // Sanitize referrer URL to prevent XSS
    let sanitizedReferrer: string | undefined = data.referrerUrl;
    if (sanitizedReferrer && sanitizedReferrer !== '') {
      try {
        const url = new URL(sanitizedReferrer);
        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
          sanitizedReferrer = undefined;
        } else {
          sanitizedReferrer = url.toString();
        }
      } catch {
        sanitizedReferrer = undefined; // Invalid URL
      }
    } else {
      sanitizedReferrer = undefined;
    }
    
    // Track the view
    const viewId = trackProductView({
      idProduct: data.productId,
      userId,
      sessionId,
      viewDuration: data.viewDuration || null,
      referrerUrl: sanitizedReferrer || null,
      sourceType: data.sourceType || null,
      recommendationType: data.recommendationType || null,
    });
    
    const response = NextResponse.json({
      success: true,
      viewId,
    });
    
    // Set rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitPresets.generous.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    // Set session cookie if it doesn't exist
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

