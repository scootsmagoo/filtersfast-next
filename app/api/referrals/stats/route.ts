/**
 * Referral Statistics API
 * GET - Get user's referral statistics (auto-creates code if needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserReferralStats, getReferralCodeByUserId, createReferralCode } from '@/lib/db/referrals';

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

    console.log('[Referrals Stats] Fetching stats for user:', session.user.id);

    // Ensure user has a referral code (create if doesn't exist)
    let referralCode = getReferralCodeByUserId(session.user.id);
    if (!referralCode) {
      console.log('[Referrals Stats] No code found, creating new code for user:', session.user.id);
      try {
        referralCode = createReferralCode({ user_id: session.user.id });
        console.log('[Referrals Stats] Created referral code:', referralCode.code);
      } catch (createError: any) {
        console.error('[Referrals Stats] Error creating code:', createError);
        throw new Error(`Failed to create referral code: ${createError.message}`);
      }
    } else {
      console.log('[Referrals Stats] Found existing code:', referralCode.code);
    }

    // Get user's referral statistics
    console.log('[Referrals Stats] Fetching stats...');
    const stats = getUserReferralStats(session.user.id);
    console.log('[Referrals Stats] Stats retrieved successfully');

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Referrals Stats] Error:', error);
    console.error('[Referrals Stats] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics', details: error.message },
      { status: 500 }
    );
  }
}

