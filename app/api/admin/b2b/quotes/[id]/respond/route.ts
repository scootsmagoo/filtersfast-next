/**
 * Admin B2B Quote Response API
 * POST /api/admin/b2b/quotes/[id]/respond - Respond to quote request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/auth-admin';
import { getQuoteRequestById, updateQuoteRequest } from '@/lib/db/b2b';
import { logAudit } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // OWASP A07: Rate limiting
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Get session and verify admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !isAdmin(session.user.email)) {
      console.warn('Unauthorized quote response attempt:', session?.user?.email);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const quote = getQuoteRequestById(params.id);

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Only submitted quotes can be responded to' },
        { status: 400 }
      );
    }

    // Parse response data
    const responseData = await request.json();
    const { quotedItems, validUntil, paymentTerms, deliveryTerms, adminResponse } = responseData;

    // OWASP A03: Validate input
    if (!quotedItems || !Array.isArray(quotedItems) || quotedItems.length === 0) {
      return NextResponse.json(
        { error: 'Quoted items are required' },
        { status: 400 }
      );
    }

    // Validate quoted items
    quotedItems.forEach((item: any, index: number) => {
      if (!item.description || !item.quantity || !item.unitPrice || !item.totalPrice) {
        throw new Error(`Invalid quoted item at index ${index}`);
      }
      if (item.quantity < 1 || item.quantity > 10000) {
        throw new Error(`Invalid quantity for item ${index}`);
      }
      if (item.unitPrice < 0 || item.totalPrice < 0) {
        throw new Error(`Invalid pricing for item ${index}`);
      }
    });

    // Sanitize text fields
    const sanitizedAdminResponse = adminResponse ? sanitizeInput(adminResponse.substring(0, 2000)) : undefined;
    const sanitizedDeliveryTerms = deliveryTerms ? sanitizeInput(deliveryTerms.substring(0, 500)) : undefined;

    // Calculate totals
    const subtotal = quotedItems.reduce((sum: number, item: any) => 
      sum + (item.totalPrice || 0), 0
    );

    // Update quote with sanitized data
    const success = updateQuoteRequest(params.id, {
      status: 'quoted',
      quotedItems,
      subtotal,
      total: subtotal, // Can add tax/shipping later
      validUntil,
      paymentTerms,
      deliveryTerms: sanitizedDeliveryTerms,
      adminResponse: sanitizedAdminResponse,
      quotedAt: Date.now(),
      assignedTo: session.user.id,
      assignedToName: session.user.name || session.user.email,
    });

    if (!success) {
      throw new Error('Failed to update quote');
    }

    // Log audit trail
    logAudit({
      userId: session.user.id,
      action: 'quote_responded',
      category: 'b2b',
      severity: 'info',
      details: {
        quoteId: params.id,
        quoteNumber: quote.quoteNumber,
        subtotal,
      },
    });

    // TODO: Send quote email to customer

    const updatedQuote = getQuoteRequestById(params.id);

    return NextResponse.json({
      success: true,
      message: 'Quote sent to customer',
      quote: updatedQuote,
    });
  } catch (error: any) {
    console.error('Respond to quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to quote' },
      { status: 500 }
    );
  }
}

