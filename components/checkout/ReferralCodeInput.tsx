'use client';

/**
 * Referral Code Input Component
 * 
 * Allows users to enter a referral code at checkout
 * 
 * WCAG Compliant:
 * - Proper form labels and ARIA attributes
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Focus management
 * - Error messaging
 */

import { useState, useEffect, useRef } from 'react';
import { Gift, Check, X, Loader2 } from 'lucide-react';
import { getStoredReferralCode, validateReferralCode } from '@/lib/hooks/useReferralTracking';

interface ReferralCodeInputProps {
  onCodeValidated: (code: string | null) => void;
  className?: string;
}

export default function ReferralCodeInput({ onCodeValidated, className = '' }: ReferralCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for stored referral code on mount
    const storedCode = getStoredReferralCode();
    if (storedCode) {
      setCode(storedCode);
      handleValidate(storedCode);
    }
  }, []);

  const handleValidate = async (codeToValidate?: string) => {
    const referralCode = codeToValidate || code;
    
    if (!referralCode.trim()) {
      setMessage('Please enter a referral code');
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    setMessage('');
    setIsValid(null);

    const result = await validateReferralCode(referralCode.toUpperCase());

    setIsValidating(false);
    setIsValid(result.valid);
    
    if (result.valid) {
      setMessage(result.message || 'Valid referral code applied!');
      setAppliedCode(referralCode.toUpperCase());
      onCodeValidated(referralCode.toUpperCase());
    } else {
      setMessage(result.error || 'Invalid referral code');
      setAppliedCode(null);
      onCodeValidated(null);
    }
  };

  const handleRemove = () => {
    setCode('');
    setIsValid(null);
    setMessage('');
    setAppliedCode(null);
    onCodeValidated(null);
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`} role="region" aria-label="Referral code">
      {/* Screen reader announcements */}
      <div ref={announceRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h3 id="referral-code-heading" className="text-sm font-semibold text-blue-900">Have a Referral Code?</h3>
      </div>

      {appliedCode ? (
        // Applied code state
        <div 
          className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-300"
          role="status"
          aria-label="Referral code applied"
        >
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Code Applied: <span className="font-mono" aria-label={`Code ${appliedCode}`}>{appliedCode}</span>
              </p>
              <p className="text-xs text-gray-600">{message}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
            title="Remove code"
            aria-label={`Remove referral code ${appliedCode}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        // Input state
        <div>
          <label htmlFor="referral-code-input" className="sr-only">
            Referral code
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="referral-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleValidate();
                }
              }}
              placeholder="Enter referral code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isValidating}
              aria-describedby="referral-code-heading referral-code-help"
              aria-invalid={isValid === false}
              aria-busy={isValidating}
              maxLength={20}
            />
            <button
              onClick={() => handleValidate()}
              disabled={isValidating || !code.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isValidating ? 'Validating referral code' : 'Apply referral code'}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Apply</span>
              )}
            </button>
          </div>

          {/* Validation message */}
          {message && isValid !== null && !isValidating && (
            <div 
              className={`mt-2 text-sm flex items-center gap-2 ${
                isValid ? 'text-green-700' : 'text-red-700'
              }`}
              role="alert"
              aria-live="assertive"
            >
              {isValid ? (
                <Check className="w-4 h-4" aria-hidden="true" />
              ) : (
                <X className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{message}</span>
            </div>
          )}

          <p id="referral-code-help" className="mt-2 text-xs text-blue-700">
            Get a discount with your friend's referral code!
          </p>
        </div>
      )}
    </div>
  );
}

