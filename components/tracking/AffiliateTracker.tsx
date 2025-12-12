'use client';

/**
 * Affiliate Tracker Component
 * 
 * Automatically tracks affiliate clicks when users arrive with affiliate codes
 * Add this to the root layout to enable affiliate tracking
 */

import { useAffiliateTracking } from '@/lib/hooks/useAffiliateTracking';

export default function AffiliateTracker() {
  useAffiliateTracking();
  return null; // This component doesn't render anything
}

