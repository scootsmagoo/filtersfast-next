/**
 * API Route: Refresh Redirect Cache
 * This route loads active redirects into memory cache for Edge Runtime
 */

import { NextResponse } from 'next/server';
import { getActiveRedirects } from '@/lib/db/redirects';
import { setRedirectCache } from '@/lib/redirects-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeRedirects = getActiveRedirects();
    setRedirectCache(activeRedirects);
    
    return NextResponse.json({
      success: true,
      message: `Redirect cache refreshed with ${activeRedirects.length} active redirects`,
      count: activeRedirects.length
    });
  } catch (error) {
    console.error('Failed to refresh redirect cache:', error);
    return NextResponse.json(
      { error: 'Failed to refresh redirect cache' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}






