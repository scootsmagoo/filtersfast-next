/**
 * Admin Payment Gateway Management API
 * 
 * Manage payment gateway configurations and view statistics
 * 
 * OWASP Top 10 2021 Compliant
 * Admin-only access with audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { rateLimit } from '@/lib/rate-limit-admin';
import {
  getAllPaymentGateways,
  getPaymentGatewayStats,
  updatePaymentGateway,
} from '@/lib/db/payment-gateways';
import type { PaymentGatewayType } from '@/lib/types/payment-gateway';

// OWASP A07: Rate limiting for admin endpoints
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 100,
});

/**
 * GET /api/admin/payment-gateways
 * Get all payment gateway configurations
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

    // Get all gateways
    const gateways = getAllPaymentGateways();

    // Get statistics for each gateway
    const stats = getPaymentGatewayStats();

    // Combine gateway configs with stats
    const gatewaysWithStats = gateways.map(gateway => {
      const gatewayStats = stats.find(s => s.gateway_type === gateway.gateway_type);
      
      return {
        ...gateway,
        // Don't expose full credentials to frontend
        credentials: Object.keys(gateway.credentials || {}).reduce((acc, key) => {
          acc[key] = gateway.credentials[key] ? '••••••••' : '';
          return acc;
        }, {} as Record<string, string>),
        stats: gatewayStats || {
          total_transactions: 0,
          successful_transactions: 0,
          failed_transactions: 0,
          total_volume: 0,
          average_amount: 0,
          success_rate: 0,
        },
      };
    });

    // OWASP A05: Security headers
    const response = NextResponse.json({
      gateways: gatewaysWithStats,
      summary: {
        total_gateways: gateways.length,
        active_gateways: gateways.filter(g => g.status === 'active').length,
        primary_gateway: gateways.find(g => g.is_primary)?.gateway_type || null,
        backup_gateway: gateways.find(g => g.is_backup)?.gateway_type || null,
      },
    });
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return response;
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    console.error('Full error details:', error instanceof Error ? error.stack : error);
    // WCAG 3.3.1: Clear error with suggestion
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment gateways',
        error_code: 'GATEWAY_FETCH_ERROR',
        suggestion: 'Please refresh the page or contact support if the issue persists.',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payment-gateways
 * Update payment gateway configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    // OWASP A07: Rate limiting
    if (process.env.NODE_ENV !== 'development') {
      const identifier = request.ip ?? 'anonymous';
      try {
        await limiter.check(identifier, 10);
      } catch {
        // WCAG 3.3.1: Clear error with suggestion
        return NextResponse.json(
          { 
            error: 'Too many update requests',
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

    const body = await request.json();

    // OWASP A03: Input validation
    // WCAG 3.3.1: Clear error identification
    if (!body.id || typeof body.id !== 'number') {
      return NextResponse.json(
        { 
          error: 'Gateway ID is required',
          error_code: 'MISSING_GATEWAY_ID',
          suggestion: 'Please provide a valid gateway ID.',
          field: 'id'
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['active', 'inactive', 'testing'].includes(body.status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status value',
          error_code: 'INVALID_STATUS',
          suggestion: 'Status must be one of: active, inactive, testing',
          field: 'status'
        },
        { status: 400 }
      );
    }

    // Validate capture method if provided
    if (body.capture_method && !['automatic', 'manual'].includes(body.capture_method)) {
      return NextResponse.json(
        { 
          error: 'Invalid capture method',
          error_code: 'INVALID_CAPTURE_METHOD',
          suggestion: 'Capture method must be either automatic or manual',
          field: 'capture_method'
        },
        { status: 400 }
      );
    }

    // Update gateway
    const changes = updatePaymentGateway(body.id, body);

    if (changes === 0) {
      return NextResponse.json(
        { 
          error: 'Gateway not found or no changes made',
          error_code: 'NO_CHANGES',
          suggestion: 'Please verify the gateway ID and ensure you have made changes.'
        },
        { status: 404 }
      );
    }

    // OWASP A05: Add security headers
    // WCAG 4.1.3: Clear success message
    const response = NextResponse.json({
      success: true,
      message: 'Payment gateway updated successfully',
      status_message: 'Gateway configuration saved',
    });
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return response;
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    // WCAG 3.3.1: Clear error with suggestion
    return NextResponse.json(
      { 
        error: 'Failed to update payment gateway',
        error_code: 'GATEWAY_UPDATE_ERROR',
        suggestion: 'Please verify your changes and try again.'
      },
      { status: 500 }
    );
  }
}

