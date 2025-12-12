/**
 * Referral Tracking Hook
 * 
 * Automatically tracks referral clicks and stores referral codes in localStorage
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_CODE_KEY = 'ff_referral_code';
const REFERRAL_EXPIRY_DAYS = 30;

export function useReferralTracking() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for referral code in URL params
    const refCode = searchParams.get('ref') || searchParams.get('referral');
    
    if (refCode) {
      // Store referral code in localStorage with expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS);
      
      localStorage.setItem(REFERRAL_CODE_KEY, JSON.stringify({
        code: refCode.toUpperCase(),
        expiry: expiryDate.toISOString()
      }));

      // Track the click
      trackReferralClick(refCode, window.location.pathname);
    }
  }, [searchParams]);
}

async function trackReferralClick(code: string, landingPage: string) {
  try {
    await fetch('/api/referrals/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referral_code: code,
        landing_page: landingPage
      })
    });
  } catch (error) {
    // Silently fail - tracking shouldn't block the user
    console.log('Failed to track referral click:', error);
  }
}

/**
 * Get stored referral code from localStorage
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(REFERRAL_CODE_KEY);
    if (!stored) return null;

    const { code, expiry } = JSON.parse(stored);
    
    // Check if expired
    if (new Date(expiry) < new Date()) {
      localStorage.removeItem(REFERRAL_CODE_KEY);
      return null;
    }

    return code;
  } catch (error) {
    return null;
  }
}

/**
 * Clear stored referral code (after successful order)
 */
export function clearStoredReferralCode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  }
}

/**
 * Validate referral code via API
 */
export async function validateReferralCode(code: string): Promise<{ valid: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/referrals/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate referral code'
    };
  }
}

