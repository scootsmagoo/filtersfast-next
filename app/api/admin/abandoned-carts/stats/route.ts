/**
 * Admin: Get Abandoned Cart Statistics
 * GET /api/admin/abandoned-carts/stats
 * 
 * Returns analytics and metrics for abandoned cart recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCartStats } from '@/lib/db/abandoned-carts';
import { auth } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  let session: any = null;
  
  try {
    // Check authentication and admin role
    session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      // Audit log - unauthorized access attempt
      console.warn('[SECURITY] Unauthorized abandoned cart stats access attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        user_id: session?.user?.id || 'none',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get statistics
    const stats = getAbandonedCartStats();

    // Audit log - admin accessed stats
    console.log('[AUDIT] Admin accessed abandoned cart stats', {
      admin_id: session.user.id,
      admin_email: session.user.email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      stats: {
        total_abandoned: stats.total_abandoned,
        total_recovered: stats.total_recovered,
        recovery_rate: stats.recovery_rate,
        total_value_abandoned: stats.total_value_abandoned,
        total_value_recovered: stats.total_value_recovered,
        emails_sent: stats.emails_sent,
        recent_abandons: stats.recent_abandons,
        // Calculate additional metrics
        avg_cart_value: stats.total_abandoned > 0 
          ? Math.round((stats.total_value_abandoned / stats.total_abandoned) * 100) / 100 
          : 0,
        avg_recovered_value: stats.total_recovered > 0
          ? Math.round((stats.total_value_recovered / stats.total_recovered) * 100) / 100
          : 0,
      },
    }, { status: 200 });

  } catch (error: any) {
    // Security: Don't expose internal details
    console.error('[ERROR] Failed to fetch abandoned cart stats:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      admin_id: session?.user?.id,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'Unable to fetch statistics' },
      { status: 500 }
    );
  }
}

