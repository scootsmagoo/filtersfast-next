/**
 * ID.me Verification Button Component
 * 
 * Displays verification button for military/first responders
 * WCAG 2.1 AA compliant
 */

'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { VerificationCheckResult } from '@/lib/types/idme';

interface IdMeVerificationButtonProps {
  onVerified?: () => void;
  compact?: boolean;
}

export default function IdMeVerificationButton({ 
  onVerified,
  compact = false 
}: IdMeVerificationButtonProps) {
  const [status, setStatus] = useState<VerificationCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/idme/status');
      const data = await response.json();
      setStatus(data);
      
      if (data.isVerified && onVerified) {
        onVerified();
      }
    } catch (error) {
      console.error('Failed to check ID.me status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    setVerifying(true);
    // Redirect to ID.me auth endpoint
    window.location.href = '/api/idme/auth';
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200"
        role="status"
        aria-live="polite"
        aria-label="Loading verification status"
      >
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
        <span className="ml-2 text-sm text-gray-600">Checking status...</span>
        <span className="sr-only">Loading your verification status, please wait</span>
      </div>
    );
  }

  if (status?.isVerified) {
    return (
      <div 
        className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-green-800">
            {status.verificationType === 'military' && 'Military Discount Active'}
            {status.verificationType === 'responder' && 'First Responder Discount Active'}
            {status.verificationType === 'employee' && 'Employee Discount Active'}
            {!['military', 'responder', 'employee'].includes(status.verificationType || '') && 'Verified Discount Active'}
          </p>
          {status.discountPercentage && (
            <p className="text-xs text-green-700 mt-1">
              {status.discountPercentage}% off eligible items
            </p>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Button
        onClick={handleVerify}
        disabled={verifying}
        variant="outline"
        className="w-full border-blue-600 bg-white text-blue-700 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Verify military or first responder status with ID.me"
      >
        {verifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            <span>Redirecting...</span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Verify with ID.me</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div 
      className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
      role="region"
      aria-label="Military and first responder discount"
    >
      <div className="flex items-start">
        <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" aria-hidden="true" />
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Military & First Responder Discount
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Verify your status to receive an exclusive discount on your order
          </p>
          
          <Button
            onClick={handleVerify}
            disabled={verifying}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Verify military or first responder status with ID.me for discount"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                <span>Redirecting to ID.me...</span>
              </>
            ) : (
              <>
                <span>Verify with ID.me</span>
              </>
            )}
          </Button>

          <div className="mt-3 flex items-center text-xs text-gray-500">
            <svg 
              className="w-4 h-4 mr-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>
              Secure verification by ID.me • 
              <a 
                href="https://www.id.me/individuals" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Learn more about ID.me verification (opens in new tab)"
              >
                What is ID.me?
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

