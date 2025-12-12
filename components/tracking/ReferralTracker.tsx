'use client';

/**
 * Referral Tracker Component
 * 
 * Automatically tracks referral clicks when users arrive with referral codes
 * Add this to the root layout to enable referral tracking
 */

import { useReferralTracking } from '@/lib/hooks/useReferralTracking';

export default function ReferralTracker() {
  useReferralTracking();
  return null; // This component doesn't render anything
}

