/**
 * B2B Account Application API
 * POST /api/b2b/apply - Submit B2B account application
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createB2BAccount, getB2BAccountByUserId } from '@/lib/db/b2b';
import { B2BApplicationForm } from '@/lib/types/b2b';
import { logAudit } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // OWASP A07: Rate limiting to prevent abuse
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many applications. Please try again later.' },
      { status: 429 }
    );
  }
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to apply' },
        { status: 401 }
      );
    }

    // Check if user already has a B2B account
    const existingAccount = getB2BAccountByUserId(session.user.id);
    if (existingAccount) {
      return NextResponse.json(
        { error: 'You already have a B2B account application on file' },
        { status: 400 }
      );
    }

    // Parse request body
    const formData = await request.json() as B2BApplicationForm;

    // OWASP A03: Input validation and sanitization
    if (!formData.companyName || !formData.contactName || !formData.contactPhone || !formData.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate field lengths (prevent DoS)
    if (formData.companyName.length > 200 ||
        formData.contactName.length > 100 ||
        formData.contactPhone.length > 20 ||
        formData.contactEmail.length > 254 ||
        (formData.reasonForApplying && formData.reasonForApplying.length > 2000)) {
      return NextResponse.json(
        { error: 'One or more fields exceed maximum length' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Sanitize text inputs to prevent XSS
    const sanitizedCompanyName = sanitizeInput(formData.companyName);
    const sanitizedContactName = sanitizeInput(formData.contactName);
    const sanitizedReasonForApplying = formData.reasonForApplying ? sanitizeInput(formData.reasonForApplying) : undefined;

    if (!formData.billingAddress || !formData.billingAddress.street || !formData.billingAddress.city) {
      return NextResponse.json(
        { error: 'Billing address is required' },
        { status: 400 }
      );
    }

    if (!formData.agreeToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 }
      );
    }

    // Create B2B account application with sanitized data
    const account = createB2BAccount({
      userId: session.user.id,
      companyName: sanitizedCompanyName,
      businessType: formData.businessType,
      taxId: formData.taxId,
      businessLicense: formData.businessLicense,
      yearsInBusiness: formData.yearsInBusiness,
      annualRevenue: formData.annualRevenue,
      numberOfEmployees: formData.numberOfEmployees,
      website: formData.website,
      contactName: sanitizedContactName,
      contactTitle: formData.contactTitle,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      billingAddress: formData.billingAddress,
      shippingAddress: formData.shippingDifferent ? formData.shippingAddress : undefined,
      status: 'pending',
      pricingTier: 'standard',
      discountPercentage: 0,
      paymentTerms: 'prepay',
      creditUsed: 0,
      references: formData.references,
      applicationNotes: sanitizedReasonForApplying,
    });

    // Log audit trail
    logAudit({
      userId: session.user.id,
      action: 'b2b_application_submitted',
      category: 'b2b',
      severity: 'info',
      details: {
        accountId: account.id,
        companyName: formData.companyName,
        businessType: formData.businessType,
      },
    });

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to applicant

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      accountId: account.id,
    });
  } catch (error: any) {
    // OWASP A09: Security logging
    console.error('B2B application error:', error);
    
    // OWASP A05: Don't expose internal error details
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}

