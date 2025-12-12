/**
 * Social Share Tracking API
 * POST - Track social media shares
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { trackSocialShare } from '@/lib/db/referrals';
import { TrackSocialShareInput } from '@/lib/types/referral';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { share_type, share_platform, shared_url, product_id, referral_code } = body;

    if (!share_type || !share_platform || !shared_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user session (optional - can share without being logged in)
    const session = await auth.api.getSession({
      headers: await headers()
    });

    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined;

    // Track the share
    const shareData: TrackSocialShareInput = {
      user_id: session?.user?.id,
      share_type,
      share_platform,
      shared_url,
      product_id,
      referral_code,
      ip_address: ip
    };

    const share = trackSocialShare(shareData);

    return NextResponse.json({ 
      success: true, 
      message: 'Share tracked successfully',
      share_id: share.id 
    });
  } catch (error: any) {
    console.error('Error tracking social share:', error);
    
    // Don't fail loudly - tracking shouldn't block the user
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 } // Return 200 to not break the flow
    );
  }
}

