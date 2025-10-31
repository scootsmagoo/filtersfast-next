/**
 * Affiliate Tracking Hook
 * 
 * Automatically tracks affiliate clicks and stores tracking info in cookies
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

const AFFILIATE_CODE_PARAM = 'aff';
const AFFILIATE_CODE_COOKIE = 'ff_aff_code';
const AFFILIATE_SESSION_COOKIE = 'ff_aff_session';
const COOKIE_DURATION_DAYS = 30; // Default, should match server settings

export function useAffiliateTracking() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if affiliate code is in URL
    const affiliateCode = searchParams?.get(AFFILIATE_CODE_PARAM);

    if (affiliateCode) {
      // Track the click
      trackAffiliateClick(affiliateCode);
    }
  }, [searchParams]);
}

async function trackAffiliateClick(affiliateCode: string) {
  try {
    // Don't track if we already have a session for this code
    const existingCode = Cookies.get(AFFILIATE_CODE_COOKIE);
    if (existingCode === affiliateCode) {
      console.log('[Affiliate] Click already tracked for this code');
      return;
    }

    // Track the click via API
    const response = await fetch('/api/affiliates/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affiliate_code: affiliateCode,
        landing_page: window.location.href,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // Store affiliate code and session token in cookies
      Cookies.set(AFFILIATE_CODE_COOKIE, affiliateCode, {
        expires: COOKIE_DURATION_DAYS,
        sameSite: 'lax',
      });

      Cookies.set(AFFILIATE_SESSION_COOKIE, data.session_token, {
        expires: COOKIE_DURATION_DAYS,
        sameSite: 'lax',
      });

      console.log('[Affiliate] Click tracked successfully:', affiliateCode);
    } else {
      console.error('[Affiliate] Failed to track click:', await response.text());
    }
  } catch (error) {
    console.error('[Affiliate] Error tracking click:', error);
  }
}

/**
 * Get current affiliate tracking info
 */
export function getAffiliateTrackingInfo() {
  return {
    affiliateCode: Cookies.get(AFFILIATE_CODE_COOKIE),
    sessionToken: Cookies.get(AFFILIATE_SESSION_COOKIE),
  };
}

/**
 * Clear affiliate tracking info
 */
export function clearAffiliateTracking() {
  Cookies.remove(AFFILIATE_CODE_COOKIE);
  Cookies.remove(AFFILIATE_SESSION_COOKIE);
}

