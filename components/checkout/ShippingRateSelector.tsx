'use client';

/**
 * Shipping Rate Selector Component
 * Fetches and displays real-time shipping rates from multiple carriers
 */

import { useState, useEffect } from 'react';
import { Truck, Clock, Loader2, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ShippingRate, ShippingRateResponse } from '@/lib/types/shipping';

interface ShippingRateSelectorProps {
  // Shipping address (destination)
  address: {
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  
  // Package info (calculated from cart)
  totalWeight: number;  // in pounds
  
  // Callbacks
  onRateSelect: (rate: ShippingRate) => void;
  selectedRate?: ShippingRate;
  
  // Optional origin address override
  originAddress?: {
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function ShippingRateSelector({
  address,
  totalWeight,
  onRateSelect,
  selectedRate,
  originAddress,
}: ShippingRateSelectorProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shipping rates when address changes
  useEffect(() => {
    if (!address.address_line1 || !address.city || !address.state || !address.postal_code) {
      setLoading(false);
      return;
    }

    fetchRates();
  }, [
    address.address_line1,
    address.city,
    address.state,
    address.postal_code,
    address.country,
    totalWeight,
  ]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);

    try {
      // Default origin address (should come from store config)
      const origin = originAddress || {
        name: 'FiltersFast Warehouse',
        company: 'FiltersFast',
        address_line1: '1234 Warehouse Dr',
        city: 'Indianapolis',
        state: 'IN',
        postal_code: '46225',
        country: 'US',
      };

      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination: {
            address_line1: address.address_line1,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            is_residential: true,
          },
          packages: [
            {
              weight: totalWeight || 1, // Default to 1 lb if not provided
              length: 12,
              width: 10,
              height: 6,
            },
          ],
        }),
      });

      if (!response.ok) {
        // Get detailed error message from API
        let errorMsg = 'Failed to fetch shipping rates';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error('Shipping API error:', response.status, errorData);
        } catch (e) {
          console.error('Shipping API error:', response.status, response.statusText);
        }
        throw new Error(errorMsg);
      }

      const data: ShippingRateResponse = await response.json();

      if (data.rates.length === 0 && data.errors.length > 0) {
        // Check if it's a configuration error
        const configError = data.errors.find(e => e.carrier === 'system');
        if (configError) {
          setError('Shipping carriers not configured. Please contact support or run: npm run init:shipping');
        } else {
          setError('Unable to fetch shipping rates. Please check your address.');
        }
        return;
      }

      setRates(data.rates);

      // Auto-select cheapest rate if none selected
      if (!selectedRate && data.rates.length > 0) {
        onRateSelect(data.rates[0]);
      }
    } catch (err) {
      console.error('Error fetching shipping rates:', err);
      setError('Failed to load shipping rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
          Shipping Method
        </h3>
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" aria-hidden="true" />
          <span className="ml-3 text-gray-600 dark:text-gray-300 transition-colors">
            Loading shipping rates...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
          Shipping Method
        </h3>
        <div 
          className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm text-red-800 dark:text-red-300 font-medium transition-colors">
              {error}
            </p>
            <button
              onClick={fetchRates}
              className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-label="Retry fetching shipping rates"
            >
              Try again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
          Shipping Method
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors" role="status">
          No shipping rates available for this address.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 id="shipping-method-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
        Shipping Method
      </h3>

      <div className="space-y-3" role="radiogroup" aria-labelledby="shipping-method-heading">
        {rates.map((rate, index) => {
          const isSelected = selectedRate?.service_code === rate.service_code && 
                            selectedRate?.carrier === rate.carrier;
          const rateId = `rate-${rate.carrier}-${rate.service_code}-${index}`;

          return (
            <button
              key={`${rate.carrier}-${rate.service_code}-${index}`}
              onClick={() => onRateSelect(rate)}
              role="radio"
              aria-checked={isSelected}
              aria-describedby={`${rateId}-details`}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${
                isSelected
                  ? 'border-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand-orange/50 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className={`w-5 h-5 ${
                      isSelected ? 'text-brand-orange' : 'text-gray-400 dark:text-gray-500'
                    }`} aria-hidden="true" />
                    <h4 className={`font-semibold ${
                      isSelected 
                        ? 'text-brand-orange' 
                        : 'text-gray-900 dark:text-gray-100'
                    } transition-colors`}>
                      {rate.service_name}
                    </h4>
                  </div>

                  <div id={`${rateId}-details`} className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-2 transition-colors">
                    {rate.delivery_days && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {rate.delivery_days === 1
                            ? 'Next day delivery'
                            : `${rate.delivery_days} days delivery`}
                        </span>
                      </div>
                    )}

                    {rate.delivery_date && !rate.delivery_days && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>Arrives {new Date(rate.delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {rate.carrier && (
                      <span className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 transition-colors">
                        {rate.carrier}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4" aria-label={`Shipping cost: $${rate.rate.toFixed(2)}`}>
                  <div className={`text-lg font-bold ${
                    isSelected 
                      ? 'text-brand-orange' 
                      : 'text-gray-900 dark:text-gray-100'
                  } transition-colors`}>
                    ${rate.rate.toFixed(2)}
                  </div>

                  {rate.retail_rate && rate.retail_rate > rate.rate && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-through transition-colors">
                      ${rate.retail_rate.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {rate.delivery_guarantee && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium transition-colors">
                  <span aria-label="Delivery guarantee available">✓ Delivery guarantee</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <p>* Delivery times are estimates and may vary.</p>
        <p>Shipping rates calculated in real-time from carrier APIs.</p>
      </div>
    </Card>
  );
}

