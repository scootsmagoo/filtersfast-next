/**
 * Payment Gateway Transactions API
 * 
 * View and search payment gateway transactions
 * Admin-only access with comprehensive logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { rateLimit } from '@/lib/rate-limit-admin';
import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || './auth.db');

// OWASP A07: Rate limiting for admin endpoints
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 100,
});

/**
 * GET /api/admin/payment-gateways/transactions
 * Get payment gateway transactions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // OWASP A07: Rate limiting
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous';
      try {
        await limiter.check(identifier, 30);
      } catch {
        // WCAG 3.3.1: Clear error with suggestion
        return NextResponse.json(
          { 
            error: 'Too many requests',
            error_code: 'RATE_LIMIT_EXCEEDED',
            suggestion: 'Please wait one minute before trying again.'
          },
          { status: 429 }
        );
      }
    }

    // OWASP A01: Check admin authentication
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(m => m.headers())
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check admin access (gracefully handle if admin tables not initialized)
    try {
      if (!hasAdminAccess(session.user)) {
        return NextResponse.json(
          { 
            error: 'Admin access required',
            error_code: 'ADMIN_REQUIRED',
            suggestion: 'Please run: npm run init:admin-roles to set up admin users.'
          },
          { status: 403 }
        );
      }
    } catch (adminError) {
      // Admin tables might not exist yet
      console.warn('Admin check failed - tables may not be initialized:', adminError);
      return NextResponse.json(
        { 
          error: 'Admin system not initialized',
          error_code: 'ADMIN_NOT_INITIALIZED',
          suggestion: 'Please run: npm run init:admin-roles'
        },
        { status: 503 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const gateway = searchParams.get('gateway');
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const customerEmail = searchParams.get('customer_email');

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (gateway) {
      conditions.push('gateway_type = ?');
      params.push(gateway);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (orderId) {
      conditions.push('order_id = ?');
      params.push(parseInt(orderId));
    }

    if (transactionId) {
      conditions.push('(transaction_id LIKE ? OR gateway_transaction_id LIKE ?)');
      params.push(`%${transactionId}%`, `%${transactionId}%`);
    }

    if (customerEmail) {
      conditions.push('customer_email LIKE ?');
      params.push(`%${customerEmail}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM payment_gateway_transactions 
      ${whereClause}
    `);
    const { total } = countStmt.get(...params) as { total: number };

    // Get transactions
    const offset = (page - 1) * limit;
    const stmt = db.prepare(`
      SELECT 
        id,
        order_id,
        gateway_type,
        transaction_type,
        transaction_id,
        gateway_transaction_id,
        amount,
        currency,
        status,
        authorization_code,
        customer_email,
        customer_id,
        payment_method_type,
        card_last4,
        card_brand,
        avs_result,
        cvv_result,
        risk_score,
        error_code,
        error_message,
        ip_address,
        created_at
      FROM payment_gateway_transactions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const transactions = stmt.all(...params, limit, offset);

    // OWASP A05: Security headers
    const response = NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: offset + limit < total,
      },
    });
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return response;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // WCAG 3.3.1: Clear error with suggestion
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction logs',
        error_code: 'TRANSACTION_FETCH_ERROR',
        suggestion: 'Please try adjusting your search filters or refresh the page.'
      },
      { status: 500 }
    );
  }
}

