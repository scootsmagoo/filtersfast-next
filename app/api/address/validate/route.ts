/**
 * Address Validation API Route
 * Validates addresses using SmartyStreets
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAddress, convertToSuggestions } from '@/lib/address-validation';
import { AddressInput } from '@/lib/types/address';
import { sanitizeInput } from '@/lib/security';
import { auditLog } from '@/lib/audit-log';
import { auth } from '@/lib/auth';
import { checkRateLimit, rateLimitPresets } from '@/lib/rate-limit';

/**
 * POST /api/address/validate
 * Validate and get suggestions for an address
 * 
 * Security: Rate limited to prevent abuse
 * WCAG: Returns accessible error messages
 */
export async function POST(request: NextRequest) {
  // Declare user at function scope for error handling
  let user: any = null;

  try {
    // OWASP: Rate limiting to prevent abuse
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await checkRateLimit(identifier, rateLimitPresets.generous);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many validation requests. Please try again in a moment.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    user = session?.user;

    // OWASP: Validate request body exists and is JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // OWASP: Validate payload size (prevent large payloads)
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 5000) {
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      );
    }

    // Validate required fields
    if (!body.street || !body.city || !body.state || !body.zipCode) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    // OWASP: Sanitize and validate all inputs
    const addressInput: AddressInput = {
      street: sanitizeInput(body.street).trim(),
      street2: body.street2 ? sanitizeInput(body.street2).trim() : undefined,
      city: sanitizeInput(body.city).trim(),
      state: sanitizeInput(body.state).trim().toUpperCase(),
      zipCode: sanitizeInput(body.zipCode).trim(),
    };

    // OWASP: Validate input lengths to prevent buffer overflow
    if (addressInput.street.length > 100) {
      return NextResponse.json(
        { error: 'Street address is too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (addressInput.city.length > 50) {
      return NextResponse.json(
        { error: 'City name is too long (max 50 characters)' },
        { status: 400 }
      );
    }

    // Validate address format
    if (addressInput.state.length !== 2 || !/^[A-Z]{2}$/.test(addressInput.state)) {
      return NextResponse.json(
        { error: 'State must be 2-letter abbreviation (e.g., CA, NY, TX)' },
        { status: 400 }
      );
    }

    if (!/^\d{5}(-\d{4})?$/.test(addressInput.zipCode)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format (must be 12345 or 12345-6789)' },
        { status: 400 }
      );
    }

    // Call validation service
    const validationResult = await validateAddress(addressInput);

    if (!validationResult.success) {
      // OWASP: Log detailed error internally, return generic message
      await auditLog({
        action: 'address_validation_failed',
        userId: user?.id,
        resource: 'address',
        status: 'failure',
        error: validationResult.error,
        details: {
          errorCode: validationResult.errorCode,
        },
      });

      return NextResponse.json(
        {
          error: 'Unable to validate address. Please try again or continue with address as entered.',
          errorCode: validationResult.errorCode,
        },
        { status: 500 }
      );
    }

    // Convert to user-friendly suggestions
    const suggestions = convertToSuggestions(validationResult.candidates);

    // Log validation attempt (for analytics/debugging)
    if (user) {
      await auditLog({
        action: 'address_validated',
        userId: user.id,
        resource: 'address',
        resourceId: 'validation',
        status: 'success',
        details: {
          inputAddress: `${addressInput.street}, ${addressInput.city}, ${addressInput.state} ${addressInput.zipCode}`,
          isValid: validationResult.isValid,
          candidateCount: validationResult.candidates.length,
        },
      });
    }

    // Return validation results
    return NextResponse.json({
      isValid: validationResult.isValid,
      hasMultipleCandidates: validationResult.hasMultipleCandidates,
      suggestions,
      inputAddress: addressInput,
    });
  } catch (error: any) {
    // OWASP: Log error details internally without exposing to client
    console.error('Address validation unexpected error:', error);
    
    await auditLog({
      action: 'address_validation_error',
      userId: user?.id,
      resource: 'address',
      status: 'failure',
      error: error.message,
    });

    // OWASP: Return generic error message
    return NextResponse.json(
      { error: 'An error occurred while validating the address. Please try again.' },
      { status: 500 }
    );
  }
}

