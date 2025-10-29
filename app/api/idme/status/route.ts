/**
 * ID.me Verification Status Endpoint
 * 
 * Check if current user has an active ID.me verification
 * 
 * Security:
 * - Session-based authentication
 * - Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkVerificationStatus } from '@/lib/db/idme';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Request size limit check
    const url = new URL(request.url);
    if (url.search.length > 100) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Rate limiting: 30 requests per minute
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await rateLimitFn(ip, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Get current session
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({
        isVerified: false,
        requiresLogin: true,
      });
    }

    // Check verification status
    const status = checkVerificationStatus(session.user.id);

    return NextResponse.json(status);

  } catch (error) {
    console.error('[ID.me Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

