'use client';

/**
 * SMS Opt-In Component for Checkout
 * 
 * Allows customers to subscribe to SMS notifications during checkout
 * Fully accessible (WCAG 2.1 AA) with screen reader support
 * TCPA compliant with clear consent language
 */

import { useState } from 'react';
import { MessageSquare, Check, AlertCircle } from 'lucide-react';

interface SMSOptInProps {
  onOptIn: (phoneNumber: string, consent: boolean, options: {
    transactional: boolean;
    marketing: boolean;
  }) => void;
  initialPhoneNumber?: string;
  showMarketing?: boolean;
}

export default function SMSOptIn({ 
  onOptIn, 
  initialPhoneNumber = '',
  showMarketing = true 
}: SMSOptInProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [transactionalOptIn, setTransactionalOptIn] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as (XXX) XXX-XXXX
    let formatted = value;
    if (value.length > 0) {
      if (value.length <= 3) {
        formatted = `(${value}`;
      } else if (value.length <= 6) {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    
    setPhoneNumber(formatted);
    setError('');
  };

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handleConsentChange = (checked: boolean) => {
    setTcpaConsent(checked);
    
    if (checked && validatePhone(phoneNumber)) {
      onOptIn(phoneNumber, true, {
        transactional: transactionalOptIn,
        marketing: marketingOptIn,
      });
      setError('');
    } else if (checked && !validatePhone(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
    } else {
      onOptIn('', false, { transactional: false, marketing: false });
    }
  };

  return (
    <div 
      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      role="region"
      aria-label="SMS notifications opt-in"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-blue-100 p-2 rounded-lg" role="img" aria-label="SMS notification icon">
          <MessageSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900 text-sm" id="sms-optin-heading">
            Get Order Updates via Text
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Stay updated on your order with real-time SMS notifications
          </p>
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="mb-3">
        <label 
          htmlFor="sms-phone" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mobile Phone Number
        </label>
        <input
          type="tel"
          id="sms-phone"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
          maxLength={14}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          aria-describedby={error ? 'sms-phone-error' : 'sms-phone-description'}
          aria-invalid={error ? 'true' : 'false'}
        />
        {error && (
          <p 
            id="sms-phone-error" 
            className="mt-1 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {error}
          </p>
        )}
        {!error && (
          <p id="sms-phone-description" className="mt-1 text-xs text-gray-500">
            Standard messaging rates may apply
          </p>
        )}
      </div>

      {/* Notification Type Selection */}
      <div className="space-y-2 mb-3" role="group" aria-labelledby="sms-optin-heading">
        <label htmlFor="transactional-optin" className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            id="transactional-optin"
            checked={transactionalOptIn}
            onChange={(e) => setTransactionalOptIn(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            aria-describedby="transactional-description"
            aria-label="Order updates: Shipping updates, delivery confirmations, and return status"
          />
          <span className="flex-1">
            <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
              Order Updates <span className="text-blue-600">(Recommended)</span>
            </span>
            <span 
              id="transactional-description" 
              className="block text-xs text-gray-600 mt-0.5"
            >
              Shipping updates, delivery confirmations, and return status
            </span>
          </span>
        </label>

        {showMarketing && (
          <label htmlFor="marketing-optin" className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              id="marketing-optin"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              aria-describedby="marketing-description"
              aria-label="Exclusive offers: Flash sales, new products, and special promotions"
            />
            <span className="flex-1">
              <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                Exclusive Offers <span className="text-xs text-gray-500">(Optional)</span>
              </span>
              <span 
                id="marketing-description" 
                className="block text-xs text-gray-600 mt-0.5"
              >
                Flash sales, new products, and special promotions
              </span>
            </span>
          </label>
        )}
      </div>

      {/* TCPA Consent Checkbox */}
      <div className="border-t border-blue-200 pt-3">
        <label htmlFor="tcpa-consent" className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            id="tcpa-consent"
            checked={tcpaConsent}
            onChange={(e) => handleConsentChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            aria-describedby="tcpa-consent-text"
            aria-label="I agree to receive text messages from FiltersFast"
            required={transactionalOptIn || marketingOptIn}
          />
          <span className="flex-1">
            <span 
              id="tcpa-consent-text" 
              className="text-xs text-gray-700 leading-relaxed"
            >
              <Check className="w-3 h-3 inline mr-1 text-green-600" aria-hidden="true" />
              I agree to receive text messages from FiltersFast. Msg &amp; data rates may apply. 
              Text STOP to opt out.{' '}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-expanded={showDetails}
                aria-controls="tcpa-details"
                aria-label={showDetails ? 'Hide SMS terms details' : 'View SMS terms details'}
              >
                {showDetails ? 'Hide' : 'View'} Details
              </button>
            </span>
          </span>
        </label>

        {/* Expanded TCPA Details */}
        {showDetails && (
          <div 
            id="tcpa-details"
            className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed"
            role="region"
            aria-label="SMS Terms and Conditions"
          >
            <p className="mb-2">
              By checking the box above, you consent to receive recurring automated promotional 
              and personalized marketing text messages (e.g., cart reminders, order updates) from 
              FiltersFast at the cell number used when signing up. Consent is not a condition of 
              any purchase.
            </p>
            <p className="mb-2">
              Reply <strong>HELP</strong> for help and <strong>STOP</strong> to cancel. 
              Message frequency varies. Message and data rates may apply.
            </p>
            <p>
              View our{' '}
              <a 
                href="/terms/sms-terms" 
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                SMS Terms
              </a>
              {' '}and{' '}
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>.
            </p>
          </div>
        )}
      </div>

      {/* Success Indicator */}
      {tcpaConsent && validatePhone(phoneNumber) && (
        <div 
          className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2"
          role="status"
          aria-live="polite"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          <span>SMS notifications enabled for {phoneNumber}</span>
        </div>
      )}
    </div>
  );
}

