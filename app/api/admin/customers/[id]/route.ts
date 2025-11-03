/**
 * Individual Customer API Routes
 * 
 * GET /api/admin/customers/[id] - Get customer details
 * PUT /api/admin/customers/[id] - Update customer
 * DELETE /api/admin/customers/[id] - Delete customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { sanitize } from '@/lib/sanitize';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '@/lib/db/customers';
import type { CustomerUpdateData } from '@/lib/types/customer';

// OWASP A04: Rate limiting
const RATE_LIMIT_GET = 100; // requests per minute
const RATE_LIMIT_UPDATE = 50; // requests per minute
const RATE_LIMIT_DELETE = 20; // requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * GET /api/admin/customers/[id]
 * Get customer details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get headers
    const headersList = await headers();
    
    // OWASP A04: Rate limiting
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`admin-customer-get-${ip}`, RATE_LIMIT_GET)) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    // OWASP A08: Validate customer ID
    const idCust = parseInt(params.id);
    if (isNaN(idCust) || idCust < 1) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }
    
    const customer = getCustomerById(idCust);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // OWASP A02: Remove sensitive data from response
    const { password, ...customerWithoutPassword } = customer as any;
    
    return NextResponse.json({ customer: customerWithoutPassword });
  } catch (error) {
    // OWASP A09: Log for monitoring without exposing details
    console.error('[Admin Customers API] Error fetching customer:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/customers/[id]
 * Update customer information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get headers
    const headersList = await headers();
    
    // OWASP A04: Rate limiting for updates
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`admin-customer-update-${ip}`, RATE_LIMIT_UPDATE)) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    // OWASP A08: Validate customer ID
    const idCust = parseInt(params.id);
    if (isNaN(idCust) || idCust < 1) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }
    
    // Verify customer exists
    const existingCustomer = getCustomerById(idCust);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    const updateData: CustomerUpdateData = await request.json();
    
    // OWASP A03: Sanitize all text inputs to prevent XSS
    const sanitizedData: CustomerUpdateData = {};
    
    if (updateData.email !== undefined) {
      const email = updateData.email.trim();
      // OWASP A08: Validate email format
      if (!email || !email.includes('@') || email.length > 100) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
      sanitizedData.email = sanitize(email);
    }
    
    if (updateData.name !== undefined) {
      const name = updateData.name.trim();
      // OWASP A08: Validate name
      if (!name || name.length > 70) {
        return NextResponse.json(
          { error: 'Invalid first name' },
          { status: 400 }
        );
      }
      sanitizedData.name = sanitize(name);
    }
    
    if (updateData.lastName !== undefined) {
      const lastName = updateData.lastName.trim();
      // OWASP A08: Validate last name
      if (!lastName || lastName.length > 70) {
        return NextResponse.json(
          { error: 'Invalid last name' },
          { status: 400 }
        );
      }
      sanitizedData.lastName = sanitize(lastName);
    }
    
    // Sanitize other text fields
    if (updateData.phone !== undefined) sanitizedData.phone = sanitize(updateData.phone || '');
    if (updateData.customerCompany !== undefined) sanitizedData.customerCompany = sanitize(updateData.customerCompany || '');
    if (updateData.address !== undefined) sanitizedData.address = sanitize(updateData.address || '');
    if (updateData.city !== undefined) sanitizedData.city = sanitize(updateData.city || '');
    if (updateData.zip !== undefined) sanitizedData.zip = sanitize(updateData.zip || '');
    if (updateData.generalComments !== undefined) sanitizedData.generalComments = sanitize(updateData.generalComments || '');
    
    // Copy non-text fields without sanitization
    if (updateData.status !== undefined) sanitizedData.status = updateData.status;
    if (updateData.taxExempt !== undefined) sanitizedData.taxExempt = updateData.taxExempt;
    if (updateData.affiliate !== undefined) sanitizedData.affiliate = updateData.affiliate;
    if (updateData.futureMail !== undefined) sanitizedData.futureMail = updateData.futureMail;
    if (updateData.newsletter !== undefined) sanitizedData.newsletter = updateData.newsletter;
    if (updateData.paymentType !== undefined) sanitizedData.paymentType = updateData.paymentType;
    if (updateData.commPerc !== undefined) sanitizedData.commPerc = updateData.commPerc;
    if (updateData.remindin !== undefined) sanitizedData.remindin = updateData.remindin;
    if (updateData.taxExemptExpiration !== undefined) sanitizedData.taxExemptExpiration = updateData.taxExemptExpiration;
    
    // OWASP A09: Get admin name for audit logging
    const adminName = sanitize(session.user.email || session.user.name || 'Admin');
    
    const success = updateCustomer(idCust, sanitizedData, adminName);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }
    
    // Fetch updated customer
    const updatedCustomer = getCustomerById(idCust);
    
    // OWASP A02: Remove password from response
    if (updatedCustomer) {
      const { password, ...customerWithoutPassword } = updatedCustomer as any;
      return NextResponse.json({
        success: true,
        customer: customerWithoutPassword,
        message: 'Customer updated successfully',
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch updated customer' },
      { status: 500 }
    );
  } catch (error) {
    // OWASP A09: Log for monitoring
    console.error('[Admin Customers API] Error updating customer:', error instanceof Error ? error.message : 'Unknown');
    
    // Check for specific error messages
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Email already exists for another customer' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/customers/[id]
 * Delete a customer (only if no orders)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get headers
    const headersList = await headers();
    
    // OWASP A04: Rate limiting for deletions
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`admin-customer-delete-${ip}`, RATE_LIMIT_DELETE)) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    // OWASP A08: Validate customer ID
    const idCust = parseInt(params.id);
    if (isNaN(idCust) || idCust < 1) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }
    
    const result = deleteCustomer(idCust);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete customer' },
        { status: 400 }
      );
    }
    
    // OWASP A09: Log deletion for audit trail
    console.log(`[Admin Customers API] Customer ${idCust} deleted by ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    // OWASP A09: Log for monitoring
    console.error('[Admin Customers API] Error deleting customer:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

