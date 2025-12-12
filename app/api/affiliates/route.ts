/**
 * Affiliate API Routes
 * GET /api/affiliates - Get affiliate account for logged-in user
 * POST /api/affiliates - Apply to become an affiliate
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getAffiliateByUserId,
  submitAffiliateApplication,
  getAffiliateSettings
} from '@/lib/db/affiliates';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { sanitizeInput, sanitizeUrl } from '@/lib/sanitize';
import { AffiliateRegistrationData } from '@/lib/types/affiliate';

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

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get affiliate account
    const affiliate = getAffiliateByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(affiliate, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.generous.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error: any) {
    console.error('[Affiliates API] Error:', error);
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to fetch affiliate account' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for applications)
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if affiliate program is enabled
    const settings = getAffiliateSettings();
    if (!settings.program_enabled) {
      return NextResponse.json(
        { error: 'Affiliate program is currently not accepting new applications' },
        { status: 403 }
      );
    }

    // Parse request body
    const rawData: AffiliateRegistrationData = await request.json();

    // SECURITY: Validate and sanitize all inputs
    if (!rawData.website || !rawData.promotional_methods || rawData.promotional_methods.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: website and promotional methods' },
        { status: 400 }
      );
    }

    if (!rawData.promotion_plan || rawData.promotion_plan.length < 50) {
      return NextResponse.json(
        { error: 'Promotion plan must be at least 50 characters' },
        { status: 400 }
      );
    }

    if (!rawData.agree_to_terms) {
      return NextResponse.json(
        { error: 'You must agree to the affiliate terms and conditions' },
        { status: 400 }
      );
    }

    // Validate website URL
    const sanitizedWebsite = sanitizeUrl(rawData.website);
    if (!sanitizedWebsite) {
      return NextResponse.json(
        { error: 'Invalid website URL. Must be http or https.' },
        { status: 400 }
      );
    }

    // Validate promotional methods
    const validMethods = ['blog', 'social_media', 'email', 'paid_ads', 'youtube', 'podcast', 'influencer', 'other'];
    const invalidMethods = rawData.promotional_methods.filter(m => !validMethods.includes(m));
    if (invalidMethods.length > 0) {
      return NextResponse.json(
        { error: 'Invalid promotional methods selected' },
        { status: 400 }
      );
    }

    // Sanitize social media links if provided
    const sanitizedSocialLinks = rawData.social_media_links
      ?.map(link => sanitizeUrl(link))
      .filter(link => link !== '');

    // Build sanitized data object
    const data: AffiliateRegistrationData = {
      company_name: rawData.company_name ? sanitizeInput(rawData.company_name) : undefined,
      website: sanitizedWebsite,
      promotional_methods: rawData.promotional_methods,
      audience_size: rawData.audience_size,
      promotion_plan: sanitizeInput(rawData.promotion_plan),
      social_media_links: sanitizedSocialLinks,
      monthly_traffic: rawData.monthly_traffic ? sanitizeInput(rawData.monthly_traffic) : undefined,
      paypal_email: rawData.paypal_email ? sanitizeInput(rawData.paypal_email) : undefined,
      preferred_payout_method: rawData.preferred_payout_method,
      agree_to_terms: rawData.agree_to_terms
    };

    // Submit application
    const application = submitAffiliateApplication(session.user.id, data);

    return NextResponse.json(
      { 
        message: 'Application submitted successfully',
        application
      },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      }
    );
  } catch (error: any) {
    console.error('[Affiliates API] Error creating application:', error);
    
    if (error.message.includes('already have')) {
      return NextResponse.json(
        { error: 'You already have a pending application or are already an affiliate' },
        { status: 400 }
      );
    }
    
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again later.' },
      { status: 500 }
    );
  }
}

