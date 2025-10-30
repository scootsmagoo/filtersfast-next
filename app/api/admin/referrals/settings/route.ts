/**
 * Admin Referral Settings API
 * GET - Get referral settings
 * PUT - Update referral settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getReferralSettings, 
  updateReferralSettings 
} from '@/lib/db/referrals';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!hasAdminAccess(session?.user)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const settings = getReferralSettings();

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching referral settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!hasAdminAccess(session?.user)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const settings = updateReferralSettings(body);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating referral settings:', error);
    return NextResponse.json(
      { error: 'Failed to update referral settings', details: error.message },
      { status: 500 }
    );
  }
}

