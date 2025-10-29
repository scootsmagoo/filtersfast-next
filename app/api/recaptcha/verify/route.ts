/**
 * reCAPTCHA Verification API Route
 * Server-side verification of reCAPTCHA tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaToken, RecaptchaAction } from '@/lib/recaptcha';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const identifier = getClientIdentifier(request);
  
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(identifier, {
      ...rateLimitPresets.generous,
      maxRequests: 20, // 20 requests per minute for reCAPTCHA verification
    });

    if (!rateLimitResult.success) {
      // Log rate limit exceeded (potential abuse)
      logger.warn('reCAPTCHA verification rate limit exceeded', {
        identifier: identifier.substring(0, 8) + '***', // Partially masked
        remaining: rateLimitResult.remaining,
      });
      
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { token, action } = body;

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    // Validate action is a valid RecaptchaAction
    if (!Object.values(RecaptchaAction).includes(action as RecaptchaAction)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get remote IP for verification
    const remoteIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    // Verify the token
    const result = await verifyRecaptchaToken(
      token,
      action as RecaptchaAction,
      remoteIp
    );

    const duration = Date.now() - startTime;

    // Return the result
    if (result.success) {
      // Log successful verification (for monitoring)
      logger.info('reCAPTCHA verification successful', {
        action,
        score: result.score,
        duration,
        identifier: identifier.substring(0, 8) + '***',
      });

      return NextResponse.json({
        success: true,
        score: result.score,
        message: result.message,
      });
    } else {
      // Log failed verification (potential bot or attack)
      logger.warn('reCAPTCHA verification failed', {
        action,
        score: result.score,
        message: result.message,
        errors: result.errors,
        duration,
        identifier: identifier.substring(0, 8) + '***',
      });

      // Don't expose internal details in production
      const clientMessage = process.env.NODE_ENV === 'production'
        ? 'Verification failed. Please try again.'
        : result.message;

      return NextResponse.json(
        {
          success: false,
          score: result.score,
          message: clientMessage,
          errors: process.env.NODE_ENV === 'production' ? undefined : result.errors,
        },
        { status: 403 }
      );
    }
  } catch (error) {
    // Log error securely (without exposing stack traces in production)
    logger.error('reCAPTCHA verification error', {
      error: process.env.NODE_ENV === 'development' ? error : 'Internal error',
      identifier: identifier.substring(0, 8) + '***',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during verification',
      },
      { status: 500 }
    );
  }
}

