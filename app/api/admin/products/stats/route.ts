/**
 * Admin Product Statistics API
 * GET - Get product statistics and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getProductStats, getBrands, getAllCategories } from '@/lib/db/products';
import { headers } from 'next/headers';

/**
 * GET /api/admin/products/stats
 * Get comprehensive product statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get stats
    const stats = getProductStats();
    const brands = getBrands();
    const categories = getAllCategories();

    return NextResponse.json({
      success: true,
      stats,
      brands,
      categories
    });

  } catch (error) {
    console.error('Error getting product stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get product stats' 
      },
      { status: 500 }
    );
  }
}



