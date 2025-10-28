/**
 * Google reCAPTCHA v3 Integration
 * Provides utilities for client and server-side reCAPTCHA verification
 */

export interface RecaptchaConfig {
  siteKey: string;
  secretKey: string;
  minScore: number; // Minimum acceptable score (0.0 - 1.0)
}

export interface RecaptchaVerificationResult {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  message?: string;
  errors?: string[];
}

/**
 * reCAPTCHA Actions - Define specific actions for different form types
 * This helps Google's ML understand the context and improve scoring
 */
export enum RecaptchaAction {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  CHECKOUT = 'checkout',
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password',
  RETURN_REQUEST = 'return_request',
  CONTACT_FORM = 'contact_form',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  ADD_TO_CART = 'add_to_cart',
}

/**
 * Score thresholds for different actions
 * Adjust based on your security needs and user experience
 */
export const RECAPTCHA_THRESHOLDS = {
  [RecaptchaAction.SIGN_UP]: 0.5,
  [RecaptchaAction.SIGN_IN]: 0.5,
  [RecaptchaAction.CHECKOUT]: 0.5,
  [RecaptchaAction.FORGOT_PASSWORD]: 0.5,
  [RecaptchaAction.RESET_PASSWORD]: 0.5,
  [RecaptchaAction.RETURN_REQUEST]: 0.5,
  [RecaptchaAction.CONTACT_FORM]: 0.5,
  [RecaptchaAction.NEWSLETTER_SIGNUP]: 0.5,
  [RecaptchaAction.ADD_TO_CART]: 0.3, // Lower threshold for cart actions
} as const;

/**
 * Get the minimum score threshold for a given action
 */
export function getMinScoreForAction(action: RecaptchaAction): number {
  return RECAPTCHA_THRESHOLDS[action] || 0.5;
}

/**
 * Server-side verification of reCAPTCHA token
 * @param token - The reCAPTCHA token from the client
 * @param action - The expected action
 * @param remoteIp - Optional remote IP address
 */
export async function verifyRecaptchaToken(
  token: string,
  action: RecaptchaAction,
  remoteIp?: string
): Promise<RecaptchaVerificationResponse> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured');
    return {
      success: false,
      message: 'reCAPTCHA is not properly configured',
    };
  }

  if (!token || token.trim() === '') {
    return {
      success: false,
      message: 'reCAPTCHA token is missing',
    };
  }

  try {
    // Build the verification request
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    // Call Google's siteverify API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`reCAPTCHA verification request failed: ${response.statusText}`);
    }

    const result: RecaptchaVerificationResult = await response.json();

    // Check if verification was successful
    if (!result.success) {
      return {
        success: false,
        message: 'reCAPTCHA verification failed',
        errors: result['error-codes'],
      };
    }

    // Verify the action matches
    if (result.action !== action) {
      return {
        success: false,
        score: result.score,
        message: `Action mismatch: expected ${action}, got ${result.action}`,
      };
    }

    // Check the score against the threshold
    const minScore = getMinScoreForAction(action);
    if (result.score < minScore) {
      return {
        success: false,
        score: result.score,
        message: `Score too low: ${result.score} (minimum: ${minScore})`,
      };
    }

    // All checks passed
    return {
      success: true,
      score: result.score,
      message: 'Verification successful',
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Load reCAPTCHA script dynamically
 * @param siteKey - Your reCAPTCHA site key
 */
export function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.grecaptcha) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="recaptcha"]`
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA and get a token
 * @param siteKey - Your reCAPTCHA site key
 * @param action - The action being performed
 */
export async function executeRecaptcha(
  siteKey: string,
  action: RecaptchaAction
): Promise<string> {
  // Ensure the script is loaded
  await loadRecaptchaScript(siteKey);

  // Wait for grecaptcha to be ready
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || !window.grecaptcha.ready) {
      reject(new Error('reCAPTCHA not loaded'));
      return;
    }

    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * TypeScript declarations for grecaptcha
 */
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, parameters: any) => number;
    };
  }
}

