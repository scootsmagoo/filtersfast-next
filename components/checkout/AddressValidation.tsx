/**
 * Address Validation Component
 * Shows address suggestions when validation finds issues
 * WCAG 2.1 AA compliant with keyboard navigation and focus management
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { AddressSuggestion } from '@/lib/types/address';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AddressValidationProps {
  suggestions: AddressSuggestion[];
  originalAddress: {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  onSelectSuggestion: (suggestion: AddressSuggestion | null) => void;
  onUseOriginal: () => void;
  onEdit: () => void;
}

export function AddressValidation({
  suggestions,
  originalAddress,
  onSelectSuggestion,
  onUseOriginal,
  onEdit,
}: AddressValidationProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);

  // WCAG: Focus management - focus first radio button on mount
  useEffect(() => {
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, []);

  // WCAG: Keyboard navigation - ESC to close (use original)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEdit(); // Allow user to go back and edit
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEdit]);

  // WCAG: Focus trap - keep focus within modal
  useEffect(() => {
    const handleFocusTrap = (e: FocusEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        e.preventDefault();
        firstFocusableRef.current?.focus();
      }
    };

    document.addEventListener('focusin', handleFocusTrap);
    return () => document.removeEventListener('focusin', handleFocusTrap);
  }, []);

  const handleSelect = () => {
    if (selectedIndex === null) return;

    if (selectedIndex === -1) {
      // Use original address
      onUseOriginal();
    } else if (selectedIndex === -2) {
      // Edit address
      onEdit();
    } else {
      // Use suggested address
      onSelectSuggestion(suggestions[selectedIndex]);
    }
  };

  const originalAddressString = `${originalAddress.street}${
    originalAddress.street2 ? ' ' + originalAddress.street2 : ''
  }, ${originalAddress.city}, ${originalAddress.state} ${originalAddress.zipCode}`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-validation-title"
      aria-describedby="address-validation-description"
      onClick={(e) => {
        // WCAG: Allow clicking backdrop to go back and edit
        if (e.target === e.currentTarget) {
          onEdit();
        }
      }}
    >
      <Card 
        ref={dialogRef}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 id="address-validation-title" className="text-2xl font-bold text-gray-900 mb-2">
              Verify Shipping Address
            </h2>
            <p id="address-validation-description" className="text-gray-600">
              {suggestions.length > 0
                ? 'We found suggested addresses that may improve delivery success. Please select the correct address below.'
                : 'We were unable to verify the provided address. Please confirm or update your address.'}
            </p>
          </div>

          {/* Address Options */}
          <fieldset className="space-y-3 mb-6">
            <legend className="sr-only">Select an address option</legend>

            {/* Suggested Addresses */}
            {suggestions.map((suggestion, index) => (
              <label
                key={index}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedIndex === index
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                } focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
              >
                <input
                  type="radio"
                  id={`address-${index}`}
                  name="address-option"
                  value={index}
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  aria-describedby={`address-${index}-details`}
                  ref={index === 0 ? firstFocusableRef : undefined}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {suggestion.fullAddress}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {/* WCAG: Sufficient contrast ratios for badges */}
                        {suggestion.confidence === 'exact' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                            <span aria-hidden="true">✓</span> Verified
                          </span>
                        )}
                        {suggestion.isResidential && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                            Residential
                          </span>
                        )}
                        {suggestion.isCommercial && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-600 text-white">
                            Commercial
                          </span>
                        )}
                        {suggestion.isPOBox && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-white">
                            PO Box
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p id={`address-${index}-details`} className="sr-only">
                    Suggested address: {suggestion.fullAddress}.
                    {suggestion.confidence === 'exact' && ' Verified by USPS.'}
                    {suggestion.isResidential && ' Residential address.'}
                    {suggestion.isCommercial && ' Commercial address.'}
                  </p>
                </div>
              </label>
            ))}

            {/* Original Address */}
            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedIndex === -1
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              } focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
            >
              <input
                type="radio"
                id="address-original"
                name="address-option"
                value="-1"
                checked={selectedIndex === -1}
                onChange={() => setSelectedIndex(-1)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                aria-describedby="original-address-details"
              />
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{originalAddressString}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <em>(Address as entered)</em>
                </p>
                <p id="original-address-details" className="sr-only">
                  Use the address as you entered it: {originalAddressString}
                </p>
              </div>
            </label>

            {/* Edit Address */}
            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedIndex === -2
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              } focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`}
            >
              <input
                type="radio"
                id="address-edit"
                name="address-option"
                value="-2"
                checked={selectedIndex === -2}
                onChange={() => setSelectedIndex(-2)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                aria-describedby="edit-address-details"
              />
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">Enter a different address</p>
                <p className="text-sm text-gray-600 mt-1">
                  Go back to edit the shipping address
                </p>
                <p id="edit-address-details" className="sr-only">
                  Go back to edit and enter a different shipping address
                </p>
              </div>
            </label>
          </fieldset>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleSelect}
              disabled={selectedIndex === null}
              className="flex-1"
              aria-label={
                selectedIndex === null
                  ? 'Select an address option first'
                  : selectedIndex === -1
                  ? 'Continue with address as entered'
                  : selectedIndex === -2
                  ? 'Go back to edit address'
                  : 'Continue with selected address'
              }
            >
              {selectedIndex === -2 ? 'Edit Address' : 'Continue with Selected Address'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg" role="note">
            <p className="text-sm text-blue-900">
              <strong>Why verify?</strong> Validating your address helps ensure successful delivery
              and reduces the chance of delays or returns.
            </p>
          </div>

          {/* WCAG: Keyboard instruction */}
          <p className="mt-2 text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded">ESC</kbd> to go back and edit
          </p>
        </div>
      </Card>
    </div>
  );
}

