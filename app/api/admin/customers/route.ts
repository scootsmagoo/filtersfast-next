/**
 * Admin Customer Management API Routes
 * 
 * GET /api/admin/customers - List/search customers
 * POST /api/admin/customers - Create new customer (if needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { sanitize } from '@/lib/sanitize';
import {
  searchCustomers,
  getCustomerStats,
} from '@/lib/db/customers';
import type { CustomerSearchParams } from '@/lib/types/customer';

// OWASP A04: Rate limiting to prevent abuse
const RATE_LIMIT = 100; // requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * GET /api/admin/customers
 * List and search customers with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get headers
    const headersList = await headers();
    
    // OWASP A04: Rate limiting
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`admin-customers-${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // OWASP A07: Authenticate admin user
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // OWASP A08: Validate sortField against allowed fields to prevent SQL injection via ORDER BY
    const allowedSortFields = ['idCust', 'name', 'lastName', 'email', 'dateCreated', 'status'];
    const sortField = searchParams.get('sortField') || 'idCust';
    if (!allowedSortFields.includes(sortField)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }
    
    // OWASP A08: Validate and limit pageSize to prevent DoS
    let pageSize = parseInt(searchParams.get('pageSize') || '50');
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      pageSize = 50; // Default to safe value
    }
    
    // OWASP A08: Validate page number
    let page = parseInt(searchParams.get('page') || '1');
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    
    // OWASP A08: Validate showField
    const allowedSearchFields = ['idcust', 'email', 'name', 'phone', 'customerCompany', 'address'];
    const showField = searchParams.get('showField');
    if (showField && !allowedSearchFields.includes(showField)) {
      return NextResponse.json(
        { error: 'Invalid search field' },
        { status: 400 }
      );
    }
    
    // OWASP A03: Sanitize search phrase to prevent XSS
    const rawPhrase = searchParams.get('showPhrase') || undefined;
    const showPhrase = rawPhrase ? sanitize(rawPhrase) : undefined;
    
    // Build search parameters from query string
    const params: CustomerSearchParams = {
      showField: showField as any || undefined,
      showCondition: searchParams.get('showCondition') as 'EQUALS' | 'LIKE' || 'EQUALS',
      showPhrase,
      showStatus: searchParams.get('showStatus') as any || '',
      stateSearch: searchParams.get('stateSearch') || undefined,
      countrySearch: searchParams.get('countrySearch') || undefined,
      page,
      pageSize,
      sortField,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };
    
    // Special case: if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = getCustomerStats();
      return NextResponse.json({ stats });
    }
    
    // Search customers
    const result = searchCustomers(params);
    
    // OWASP A02: Remove password field from response (crypto failure prevention)
    const sanitizedResult = {
      ...result,
      customers: result.customers.map(c => {
        const { password, ...customerWithoutPassword } = c as any;
        return customerWithoutPassword;
      }),
    };
    
    return NextResponse.json(sanitizedResult);
  } catch (error) {
    // OWASP A09: Log error for monitoring (but don't expose details to client)
    console.error('[Admin Customers API] Error:', error instanceof Error ? error.message : 'Unknown error');
    
    // OWASP A05: Don't leak stack traces or internal details in production
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to fetch customers',
          stack: error instanceof Error ? error.stack : undefined 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

