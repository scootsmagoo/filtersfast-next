/**
 * SMS Subscription API - Subscribe to SMS notifications
 * POST /api/sms/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { sanitize } from '@/lib/sanitize';
import { auth } from '@/lib/auth';
import { createSMSSubscription, getSMSSubscriptionByPhone, updateSMSSubscriptionStatus } from '@/lib/db/sms';
import { createAttentiveClient, AttentiveClient, TCPACompliance } from '@/lib/attentive';
import type { SubscribeToSMSRequest } from '@/lib/types/sms';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 5 minutes
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 5, 300); // 300 seconds = 5 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user (optional)
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    // Parse request body with size limit (A04: Insecure Design)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB max
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body: SubscribeToSMSRequest = await request.json();

    // Validate required fields
    if (!body.phone_number || !body.tcpa_consent) {
      return NextResponse.json(
        { error: 'Phone number and TCPA consent are required' },
        { status: 400 }
      );
    }

    // A08: Data Integrity - Validate input lengths
    if (body.phone_number.length > 20) {
      return NextResponse.json(
        { error: 'Phone number too long' },
        { status: 400 }
      );
    }

    if (body.subscription_source && body.subscription_source.length > 50) {
      return NextResponse.json(
        { error: 'Invalid subscription source' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!AttentiveClient.validatePhone(body.phone_number)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use a valid US/international phone number.' },
        { status: 400 }
      );
    }

    // Validate TCPA consent
    const consentValidation = TCPACompliance.validateConsent(body.tcpa_consent, body.phone_number);
    if (!consentValidation.valid) {
      return NextResponse.json(
        { error: consentValidation.error },
        { status: 400 }
      );
    }

    // Check if phone number already subscribed
    let subscription = getSMSSubscriptionByPhone(body.phone_number);

    if (subscription) {
      // If they were unsubscribed, resubscribe them
      if (!subscription.is_subscribed) {
        updateSMSSubscriptionStatus(subscription.id, true);
        subscription = getSMSSubscriptionByPhone(body.phone_number);
      }

      return NextResponse.json({
        success: true,
        message: 'Already subscribed to SMS notifications',
        subscription: {
          id: subscription!.id,
          phone_number: subscription!.phone_number,
          is_subscribed: subscription!.is_subscribed,
          transactional_opt_in: subscription!.transactional_opt_in,
          marketing_opt_in: subscription!.marketing_opt_in,
        },
      });
    }

    // Get metadata
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Create subscription in database
    subscription = createSMSSubscription(userId, body, metadata);

    if (!subscription) {
      console.error('createSMSSubscription returned null');
      return NextResponse.json(
        { error: 'Failed to create subscription - check server logs for details' },
        { status: 500 }
      );
    }

    // Subscribe to Attentive (if configured)
    const attentiveClient = createAttentiveClient();
    if (attentiveClient) {
      try {
        const attentiveResponse = await attentiveClient.subscribe({
          phone: body.phone_number,
          email: session?.user?.email || body.phone_number + '@sms.filtersfast.com',
          externalUserId: userId?.toString(),
          signUpSource: body.subscription_source || 'checkout',
          customAttributes: {
            subscription_id: subscription.id.toString(),
            tcpa_consent: body.tcpa_consent,
          },
        });

        console.log('Attentive subscription created:', attentiveResponse);
      } catch (error) {
        console.error('Failed to subscribe to Attentive (non-fatal):', error);
        // Don't fail the request if Attentive fails
      }
    }

    // A09: Logging - Audit log for subscription (mask phone for privacy)
    const maskedPhone = subscription.phone_number.slice(0, 3) + '***' + subscription.phone_number.slice(-2);
    console.log(`[AUDIT] SMS subscription created: ID=${subscription.id}, Phone=${maskedPhone}, User=${userId || 'guest'}, Source=${body.subscription_source}, IP=${metadata.ip}`);

    // A05: Security Misconfiguration - Don't expose phone number in response (mask for privacy)
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to SMS notifications',
      subscription: {
        id: subscription.id,
        phone_number_masked: maskedPhone, // Masked for privacy
        is_subscribed: subscription.is_subscribed,
        transactional_opt_in: subscription.transactional_opt_in,
        marketing_opt_in: subscription.marketing_opt_in,
      },
    });
  } catch (error) {
    console.error('Error in SMS subscribe:', error);
    
    // Return specific error message in development
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' 
          ? `Database error: ${errorMessage}` 
          : 'Internal server error. Please try again or contact support.' 
      },
      { status: 500 }
    );
  }
}

