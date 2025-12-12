/**
 * Admin Verification API
 * Simple endpoint to check if user has admin access
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';

/**
 * GET /api/admin/verify
 * Verify if current user is an admin
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated', isAdmin: false },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const adminAccess = hasAdminAccess(session.user);
    
    if (!adminAccess) {
      return NextResponse.json(
        { error: 'Not authorized', isAdmin: false },
        { status: 403 }
      );
    }

    // User is admin
    return NextResponse.json({
      isAdmin: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isAdmin: false },
      { status: 500 }
    );
  }
}

