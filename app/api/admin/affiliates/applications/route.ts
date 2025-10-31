/**
 * Admin Affiliate Applications API Routes
 * GET /api/admin/affiliates/applications - Get pending applications
 * POST /api/admin/affiliates/applications - Approve or reject application
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getPendingApplications,
  approveAffiliateApplication,
  rejectAffiliateApplication
} from '@/lib/db/affiliates';
import Database from 'better-sqlite3';

export async function GET(request: NextRequest) {
  try {
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

    // SECURITY: Check admin access
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const applications = getPendingApplications();
    
    // Add user info to applications
    let authDb: Database.Database | null = null;
    try {
      authDb = new Database('auth.db');
      
      const applicationsWithUserData = applications.map(app => {
        const user = authDb!.prepare('SELECT name, email FROM user WHERE id = ?')
          .get(app.user_id) as { name: string | null; email: string } | undefined;
        return {
          ...app,
          user_name: user?.name || 'Unknown',
          user_email: user?.email || 'Unknown'
        };
      });

      return NextResponse.json(applicationsWithUserData);
    } finally {
      // Ensure DB is always closed
      if (authDb) {
        authDb.close();
      }
    }
  } catch (error: any) {
    console.error('[Admin Applications API] Error:', error);
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // SECURITY: Check admin access
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { application_id, action, rejection_reason, custom_commission_rate } = body;

    if (!application_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id and action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // SECURITY: Validate custom commission rate
    if (custom_commission_rate !== undefined) {
      const rate = parseFloat(custom_commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'Invalid commission rate. Must be between 0 and 100.' },
          { status: 400 }
        );
      }
    }

    if (action === 'approve') {
      const affiliate = approveAffiliateApplication(
        application_id,
        session.user.id,
        custom_commission_rate
      );
      
      return NextResponse.json({
        message: 'Application approved successfully',
        affiliate
      });
    } else {
      if (!rejection_reason || rejection_reason.trim().length < 10) {
        return NextResponse.json(
          { error: 'Rejection reason must be at least 10 characters' },
          { status: 400 }
        );
      }

      rejectAffiliateApplication(application_id, session.user.id, rejection_reason.trim());
      
      return NextResponse.json({
        message: 'Application rejected successfully'
      });
    }
  } catch (error: any) {
    console.error('[Admin Applications API] Error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not pending')) {
      return NextResponse.json(
        { error: 'Application not found or already processed' },
        { status: 400 }
      );
    }
    
    // Don't expose internal error details in production
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

