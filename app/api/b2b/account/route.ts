/**
 * B2B Account API
 * GET /api/b2b/account - Get current user's B2B account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getB2BAccountByUserId } from '@/lib/db/b2b';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get B2B account
    const account = getB2BAccountByUserId(session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: 'No B2B account found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive internal notes to customer
    const { internalNotes, ...publicAccount } = account;

    return NextResponse.json(publicAccount);
  } catch (error: any) {
    console.error('Get B2B account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account' },
      { status: 500 }
    );
  }
}

