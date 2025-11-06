/**
 * API Route: Track Redirect Hit
 * Increments hit count for a redirect (called from middleware)
 */

import { NextRequest, NextResponse } from 'next/server';
import { incrementRedirectHitCount } from '@/lib/db/redirects';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: 'Invalid redirect ID' },
        { status: 400 }
      );
    }
    
    incrementRedirectHitCount(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track redirect hit:', error);
    // Return 200 anyway to not block the redirect
    return NextResponse.json({ success: false });
  }
}



