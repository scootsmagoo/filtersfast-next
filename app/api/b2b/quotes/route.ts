/**
 * B2B Quotes API
 * GET /api/b2b/quotes - Get all quotes for user
 * POST /api/b2b/quotes - Create new quote request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { 
  getB2BAccountByUserId, 
  getQuotesByB2BAccountId, 
  createQuoteRequest 
} from '@/lib/db/b2b';
import { auditLog } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get B2B account
    const account = getB2BAccountByUserId(session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: 'No B2B account found' },
        { status: 404 }
      );
    }

    // Get quotes
    const quotes = getQuotesByB2BAccountId(account.id);

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error('Get quotes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // OWASP A07: Rate limiting (10 quote requests per hour)
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many quote requests. Please try again later.' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get B2B account
    const account = getB2BAccountByUserId(session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: 'No B2B account found. Please apply for a B2B account first.' },
        { status: 404 }
      );
    }

    if (account.status !== 'approved') {
      return NextResponse.json(
        { error: 'B2B account must be approved to request quotes' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { items, customerMessage } = body;

    // OWASP A03: Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Limit number of items (prevent DoS)
    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items per quote' },
        { status: 400 }
      );
    }

    // Validate and sanitize items
    const sanitizedItems = items.map((item: any) => {
      if (!item.description || item.description.length > 500) {
        throw new Error('Invalid item description');
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 10000) {
        throw new Error('Invalid quantity');
      }
      
      return {
        productId: item.productId,
        sku: item.sku ? sanitizeInput(item.sku) : undefined,
        description: sanitizeInput(item.description || item.name),
        quantity: parseInt(item.quantity),
        requestedPrice: item.requestedPrice,
        notes: item.notes ? sanitizeInput(item.notes.substring(0, 500)) : undefined,
      };
    });

    // Sanitize customer message
    const sanitizedMessage = customerMessage ? sanitizeInput(customerMessage.substring(0, 2000)) : undefined;

    // Create quote request
    const quote = createQuoteRequest({
      b2bAccountId: account.id,
      userId: session.user.id,
      companyName: account.companyName,
      status: 'submitted',
      items: sanitizedItems,
      customerMessage: sanitizedMessage,
      submittedAt: Date.now(),
    });

    // Log audit trail
    await auditLog({
      action: 'quote_request_created',
      userId: session.user.id,
      resource: 'quote_request',
      resourceId: quote.id,
      status: 'success',
      details: {
        quoteNumber: quote.quoteNumber,
        itemCount: sanitizedItems.length,
      },
    });

    // TODO: Send notification email to sales team

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Create quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quote' },
      { status: 500 }
    );
  }
}

