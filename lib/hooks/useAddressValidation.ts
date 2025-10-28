/**
 * useAddressValidation Hook
 * React hook for address validation functionality
 */

import { useState } from 'react';
import { AddressInput, AddressSuggestion } from '../types/address';

interface UseAddressValidationReturn {
  suggestions: AddressSuggestion[];
  isValidating: boolean;
  hasValidated: boolean;
  showSuggestions: boolean;
  error: string | null;
  validateAddress: (address: AddressInput) => Promise<boolean>;
  acceptSuggestion: (suggestion: AddressSuggestion | null) => void;
  useOriginalAddress: () => void;
  dismissSuggestions: () => void;
  reset: () => void;
}

export function useAddressValidation(): UseAddressValidationReturn {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAddress = async (address: AddressInput): Promise<boolean> => {
    setIsValidating(true);
    setError(null);
    setHasValidated(false);

    try {
      const response = await fetch('/api/address/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Address validation failed');
      }

      const data = await response.json();

      setHasValidated(true);

      // If address is valid and no multiple candidates, continue
      if (data.isValid && !data.hasMultipleCandidates) {
        setSuggestions([]);
        setShowSuggestions(false);
        return true;
      }

      // If we have suggestions, show them
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        return false; // Wait for user selection
      }

      // Address is invalid and no suggestions
      if (!data.isValid) {
        setSuggestions([]);
        setShowSuggestions(true); // Show modal with option to use original or edit
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Address validation error:', err);
      setError(err.message);
      setHasValidated(true);
      // On error, allow user to proceed
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  const acceptSuggestion = (suggestion: AddressSuggestion | null) => {
    setShowSuggestions(false);
    // Caller should handle updating the form with the suggestion
  };

  const useOriginalAddress = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const dismissSuggestions = () => {
    setShowSuggestions(false);
  };

  const reset = () => {
    setSuggestions([]);
    setIsValidating(false);
    setHasValidated(false);
    setShowSuggestions(false);
    setError(null);
  };

  return {
    suggestions,
    isValidating,
    hasValidated,
    showSuggestions,
    error,
    validateAddress,
    acceptSuggestion,
    useOriginalAddress,
    dismissSuggestions,
    reset,
  };
}

