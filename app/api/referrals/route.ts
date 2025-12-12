/**
 * Referral Codes API Routes
 * GET - Get user's referral code
 * POST - Create referral code for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { 
  createReferralCode, 
  getReferralCodeByUserId,
  getReferralCodeByCode
} from '@/lib/db/referrals';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create referral code
    let referralCode = getReferralCodeByUserId(session.user.id);
    
    if (!referralCode) {
      referralCode = createReferralCode({ user_id: session.user.id });
    }

    return NextResponse.json(referralCode);
  } catch (error: any) {
    console.error('Error fetching referral code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral code', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { custom_code } = body;

    // Create referral code
    const referralCode = createReferralCode({
      user_id: session.user.id,
      code: custom_code
    });

    return NextResponse.json(referralCode, { status: 201 });
  } catch (error: any) {
    console.error('Error creating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to create referral code', details: error.message },
      { status: 500 }
    );
  }
}

