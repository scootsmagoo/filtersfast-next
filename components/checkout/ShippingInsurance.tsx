'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Shield, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  InsuranceSelection,
  InsuranceCarrier,
  INSURANCE_OPTIONS,
  getRecommendedInsurance,
  validateInsurance,
} from '@/lib/types/insurance';

interface ShippingInsuranceProps {
  orderSubtotal: number;
  onInsuranceChange: (selection: InsuranceSelection | null) => void;
  initialSelection?: InsuranceSelection | null;
}

export default function ShippingInsurance({
  orderSubtotal,
  onInsuranceChange,
  initialSelection,
}: ShippingInsuranceProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<InsuranceCarrier>(
    initialSelection?.carrier || 'none'
  );
  const [showInfo, setShowInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const recommendedCarrier = getRecommendedInsurance(orderSubtotal);
  const shouldShowInsurance = orderSubtotal >= 50; // Only show for orders $50+

  useEffect(() => {
    if (selectedCarrier === 'none') {
      onInsuranceChange(null);
      return;
    }

    const option = INSURANCE_OPTIONS.find(opt => opt.carrier === selectedCarrier);
    if (option) {
      const cost = option.calculateCost(orderSubtotal);
      onInsuranceChange({
        carrier: selectedCarrier,
        cost,
        coverageAmount: orderSubtotal,
      });
    }
  }, [selectedCarrier, orderSubtotal, onInsuranceChange]);

  // Don't show insurance for orders under $50
  if (!shouldShowInsurance) {
    return null;
  }

  const handleCarrierChange = (carrier: InsuranceCarrier) => {
    // OWASP: Server-side validation (client-side is UX only)
    const validation = validateInsurance(carrier, orderSubtotal);
    if (!validation.valid) {
      // WCAG: Accessible error messaging (not alert)
      setErrorMessage(validation.message || 'Invalid selection');
      setTimeout(() => setErrorMessage(''), 5000); // Auto-dismiss after 5s
      return;
    }
    setErrorMessage('');
    setSelectedCarrier(carrier);
  };

  return (
    <Card className="p-6 border-2 border-blue-100 dark:border-blue-900/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center transition-colors"
            aria-hidden="true"
          >
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            {/* WCAG: Proper heading hierarchy */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
              Shipping Insurance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
              Protect your order from loss or damage during transit
            </p>
          </div>
        </div>
        {/* WCAG: aria-expanded for collapsible content */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
          aria-label={showInfo ? "Hide insurance information" : "Show insurance information"}
          aria-expanded={showInfo}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
      
      {/* WCAG: Accessible error messaging with role="alert" */}
      {errorMessage && (
        <div 
          role="alert" 
          className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
        >
          <p className="text-sm font-medium text-red-800 dark:text-red-300 transition-colors">
            {errorMessage}
          </p>
        </div>
      )}

      {showInfo && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 transition-colors">
            Why add shipping insurance?
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 transition-colors">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Full coverage against loss, theft, or damage during shipping</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Fast and easy claims process with dedicated support</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Peace of mind for high-value orders</span>
            </li>
          </ul>
        </div>
      )}

      {/* WCAG: role="radiogroup" for proper semantics */}
      <div 
        role="radiogroup" 
        aria-label="Shipping insurance options"
        className="space-y-3"
      >
        {INSURANCE_OPTIONS.map((option) => {
          const cost = option.calculateCost(orderSubtotal);
          const isSelected = selectedCarrier === option.carrier;
          const isRecommended = option.carrier === recommendedCarrier;
          const isAvailable = !option.minOrderValue || orderSubtotal >= option.minOrderValue;

          return (
            <button
              key={option.carrier}
              onClick={() => handleCarrierChange(option.carrier)}
              disabled={!isAvailable}
              /* WCAG: role="radio" for proper semantics */
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!isAvailable}
              aria-describedby={`insurance-${option.carrier}-desc`}
              /* WCAG: Visible focus indicator */
              className={`w-full text-left p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : isAvailable
                  ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-400'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      {option.name}
                    </span>
                    {isRecommended && option.carrier !== 'none' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full transition-colors">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p 
                    id={`insurance-${option.carrier}-desc`}
                    className="text-sm text-gray-600 dark:text-gray-300 ml-7 transition-colors"
                  >
                    {option.description}
                  </p>
                  {!isAvailable && option.minOrderValue && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-7 mt-1 transition-colors">
                      Available for orders ${option.minOrderValue}+
                    </p>
                  )}
                </div>
                <div className="text-right ml-4" aria-live="polite">
                  {option.carrier === 'none' ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                      $0.00
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      ${cost.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {orderSubtotal >= 200 && selectedCarrier === 'none' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2 transition-colors">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 dark:text-yellow-100 transition-colors">
              Consider adding insurance
            </p>
            <p className="text-yellow-800 dark:text-yellow-200 transition-colors">
              For high-value orders, insurance provides peace of mind and protection against unexpected loss or damage.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

