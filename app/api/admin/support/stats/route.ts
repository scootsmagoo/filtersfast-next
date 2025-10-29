import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupportAnalytics, getCategoryAnalytics } from '@/lib/db/support';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is authenticated and is admin
    // TODO: Add proper admin role check when implemented
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const analytics = getSupportAnalytics();
    const categoryAnalytics = getCategoryAnalytics();

    return NextResponse.json({
      success: true,
      analytics,
      categoryAnalytics,
    });
  } catch (error: any) {
    console.error('Error fetching support stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
      },
      { status: 500 }
    );
  }
}

