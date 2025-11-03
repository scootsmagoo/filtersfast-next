/**
 * Customer Merge Preview API Route
 * 
 * POST /api/admin/customers/merge/preview - Preview merge before executing
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getMergePreview } from '@/lib/db/customers';

/**
 * POST /api/admin/customers/merge/preview
 * Get a preview of what will be merged
 */
export async function POST(request: NextRequest) {
  try {
    // Get headers
    const headersList = await headers();
    
    // Authenticate admin user
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mergeType, mergeIDs } = body;
    
    // Validate input
    if (!mergeType || !mergeIDs || !Array.isArray(mergeIDs)) {
      return NextResponse.json(
        { error: 'Missing required fields: mergeType, mergeIDs' },
        { status: 400 }
      );
    }
    
    if (mergeType !== 'customer' && mergeType !== 'order') {
      return NextResponse.json(
        { error: 'Invalid mergeType. Must be "customer" or "order"' },
        { status: 400 }
      );
    }
    
    const preview = getMergePreview({
      mergeType,
      mergeIDs: mergeIDs.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id)),
    });
    
    return NextResponse.json({ preview });
  } catch (error) {
    console.error('Error in POST /api/admin/customers/merge/preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate merge preview' },
      { status: 500 }
    );
  }
}

