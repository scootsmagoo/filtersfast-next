/**
 * Referral Settings API
 * GET - Get referral program settings (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReferralSettings } from '@/lib/db/referrals';

export async function GET(request: NextRequest) {
  try {
    const settings = getReferralSettings();

    // Return public settings only
    return NextResponse.json({
      enabled: settings.enabled,
      referrer_reward_type: settings.referrer_reward_type,
      referrer_reward_amount: settings.referrer_reward_amount,
      referred_discount_type: settings.referred_discount_type,
      referred_discount_amount: settings.referred_discount_amount,
      minimum_order_value: settings.minimum_order_value,
      terms_text: settings.terms_text
    });
  } catch (error: any) {
    console.error('Error fetching referral settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral settings' },
      { status: 500 }
    );
  }
}

