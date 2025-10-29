/**
 * ID.me OAuth Callback Endpoint
 * 
 * Handles the OAuth callback from ID.me after user verification
 * 
 * Security:
 * - CSRF validation via state parameter
 * - Rate limiting
 * - Input sanitization
 * - Secure token exchange
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyUser, getVerificationType, calculateExpirationDate } from '@/lib/idme-oauth';
import { createVerification, logVerificationAttempt } from '@/lib/db/idme';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Request size limit check
    if (url.search.length > 2000) {
      return NextResponse.redirect(
        new URL('/cart?error=invalid_callback', request.url)
      );
    }

    const { searchParams } = url;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Rate limiting: 20 requests per minute
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await rateLimitFn(ip, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.redirect(
        new URL('/cart?error=rate_limit', request.url)
      );
    }

    // Check for OAuth errors
    if (error) {
      console.error('[ID.me Callback] OAuth error:', error, errorDescription);
      
      // Sanitize error message - only allow specific known error codes
      const allowedErrors = ['access_denied', 'server_error', 'temporarily_unavailable'];
      const sanitizedError = allowedErrors.includes(error) ? error : 'unknown_error';
      
      logVerificationAttempt({
        action: 'callback_error',
        success: false,
        errorMessage: `${sanitizedError}: ${errorDescription?.substring(0, 100)}`, // Limit length
        ipAddress: ip,
      });

      return NextResponse.redirect(
        new URL(`/cart?error=verification_failed`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/cart?error=invalid_callback', request.url)
      );
    }

    // Validate state (CSRF protection)
    const savedState = request.cookies.get('idme_state')?.value;
    if (!savedState || savedState !== state) {
      logVerificationAttempt({
        action: 'csrf_validation_failed',
        success: false,
        errorMessage: 'State mismatch',
        ipAddress: ip,
      });

      return NextResponse.redirect(
        new URL('/cart?error=invalid_state', request.url)
      );
    }

    // Get user ID from cookie if exists
    const savedUserId = request.cookies.get('idme_user_id')?.value;

    // Get current session
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    // Determine which user ID to use (session takes precedence)
    const userId = session?.user?.id || savedUserId;

    if (!userId) {
      // User must be logged in to link verification
      return NextResponse.redirect(
        new URL('/sign-in?redirect=/api/idme/auth&message=Please sign in to verify your status', request.url)
      );
    }

    // Exchange code for user information
    const userInfo = await verifyUser(code);

    if (!userInfo.verified) {
      logVerificationAttempt({
        userId,
        action: 'verification_rejected',
        success: false,
        errorMessage: 'User not verified by ID.me',
        ipAddress: ip,
      });

      return NextResponse.redirect(
        new URL('/cart?error=not_verified', request.url)
      );
    }

    // Determine verification type from groups
    const verificationType = getVerificationType(userInfo.group || []);
    
    if (!verificationType) {
      logVerificationAttempt({
        userId,
        action: 'no_valid_group',
        success: false,
        errorMessage: 'No valid verification group found',
        ipAddress: ip,
        metadata: { groups: userInfo.group },
      });

      return NextResponse.redirect(
        new URL('/cart?error=ineligible', request.url)
      );
    }

    // Sanitize user input
    const sanitizedFirstName = userInfo.fname ? sanitizeText(userInfo.fname) : undefined;
    const sanitizedLastName = userInfo.lname ? sanitizeText(userInfo.lname) : undefined;
    const sanitizedEmail = sanitizeText(userInfo.email);

    // Create verification record
    const verification = createVerification({
      userId,
      verificationType: verificationType as any,
      idmeUserId: userInfo.sub,
      email: sanitizedEmail,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      expiresAt: calculateExpirationDate(12), // 1 year expiration
      metadata: {
        groups: userInfo.group,
        verifiedAt: new Date().toISOString(),
      },
    });

    // Log successful verification
    logVerificationAttempt({
      userId,
      verificationType: verificationType as any,
      action: 'verification_success',
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        verificationId: verification.id,
        verificationType,
      },
    });

    // Redirect to cart with success message
    const redirectUrl = new URL('/cart', request.url);
    redirectUrl.searchParams.set('idme_verified', 'true');
    
    // Validate and sanitize verification type before including in URL
    const allowedTypes = ['military', 'responder', 'employee', 'student', 'teacher', 'nurse'];
    if (allowedTypes.includes(verificationType)) {
      redirectUrl.searchParams.set('verification_type', verificationType);
    }

    const response = NextResponse.redirect(redirectUrl);

    // Clear state cookies
    response.cookies.delete('idme_state');
    response.cookies.delete('idme_user_id');

    return response;

  } catch (error) {
    console.error('[ID.me Callback] Error:', error);
    
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    logVerificationAttempt({
      action: 'callback_error',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: ip,
    });

    return NextResponse.redirect(
      new URL('/cart?error=verification_error', request.url)
    );
  }
}

