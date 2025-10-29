/**
 * ID.me OAuth Authorization Endpoint
 * 
 * Initiates the OAuth flow by redirecting to ID.me
 * 
 * Security:
 * - CSRF protection via state parameter
 * - Rate limiting to prevent abuse
 * - Session validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuthorizationUrl, generateState, isIdMeConfigured } from '@/lib/idme-oauth';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';
import { logVerificationAttempt } from '@/lib/db/idme';

export async function GET(request: NextRequest) {
  try {
    // Request size limit check (query params should be minimal)
    const url = new URL(request.url);
    if (url.search.length > 500) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Check if ID.me is configured
    if (!isIdMeConfigured()) {
      return NextResponse.json(
        { error: 'ID.me verification is not available at this time' },
        { status: 503 }
      );
    }

    // Rate limiting: 10 requests per minute
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await rateLimitFn(ip, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current session (optional - can verify as guest)
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    // Generate CSRF state token
    const state = generateState();
    
    // Store state in session/cookie for validation in callback
    const response = NextResponse.redirect(
      getAuthorizationUrl(state, ['military', 'responder', 'employee'])
    );
    
    // Set secure cookie with state
    response.cookies.set('idme_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // If user is logged in, store user ID for callback
    if (session?.user) {
      response.cookies.set('idme_user_id', session.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      });
    }

    // Log the authorization attempt
    logVerificationAttempt({
      userId: session?.user?.id,
      action: 'auth_initiated',
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return response;
  } catch (error) {
    console.error('[ID.me Auth] Error:', error);
    
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    logVerificationAttempt({
      action: 'auth_initiated',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: ip,
    });

    return NextResponse.json(
      { error: 'Failed to initiate verification' },
      { status: 500 }
    );
  }
}

