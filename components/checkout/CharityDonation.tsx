'use client';

import { useState, useEffect } from 'react';
import { Charity, DonationSelection } from '@/lib/types/charity';

interface CharityDonationProps {
  orderSubtotal: number;
  onDonationChange: (donation: DonationSelection | null) => void;
  initialDonation?: DonationSelection | null;
}

export default function CharityDonation({ 
  orderSubtotal, 
  onDonationChange,
  initialDonation = null 
}: CharityDonationProps) {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCharity, setSelectedCharity] = useState<string>(initialDonation?.charityId || '');
  const [donationType, setDonationType] = useState<'none' | 'fixed' | 'roundup' | 'custom'>(
    initialDonation ? initialDonation.type : 'none'
  );
  const [fixedAmount, setFixedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');

  // Fetch charities on mount
  useEffect(() => {
    async function fetchCharities() {
      try {
        const [charitiesRes, featuredRes] = await Promise.all([
          fetch('/api/charities'),
          fetch('/api/charities?featured=true')
        ]);
        
        if (charitiesRes.ok) {
          const data = await charitiesRes.json();
          setCharities(data);
          
          // Auto-select featured charity if no initial selection
          if (!initialDonation && data.length > 0) {
            const featured = data.find((c: Charity) => c.featured) || data[0];
            setSelectedCharity(featured.id);
            setFeaturedCharity(featured);
          }
        }
        
        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setFeaturedCharity(data);
        }
      } catch (error) {
        console.error('Error fetching charities:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCharities();
  }, [initialDonation]);

  // Calculate round-up amount
  const roundUpAmount = Math.ceil(orderSubtotal) - orderSubtotal;

  // Get current charity
  const currentCharity = charities.find(c => c.id === selectedCharity);

  // Validate custom amount in real-time
  const validateCustomAmount = (value: string) => {
    if (!value || value === '') {
      setCustomError('');
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      setCustomError('Please enter a valid number');
      return;
    }

    if (num <= 0) {
      setCustomError('Donation amount must be greater than zero');
      return;
    }

    if (currentCharity?.minDonation && num < currentCharity.minDonation) {
      setCustomError(`Minimum donation is $${currentCharity.minDonation.toFixed(2)}`);
      return;
    }

    if (currentCharity?.maxDonation && num > currentCharity.maxDonation) {
      setCustomError(`Maximum donation is $${currentCharity.maxDonation.toFixed(2)}`);
      return;
    }

    setCustomError('');
  };

  // Update parent when donation changes
  useEffect(() => {
    if (donationType === 'none' || !selectedCharity) {
      onDonationChange(null);
      setError('');
      return;
    }

    let amount = 0;
    let type: 'fixed' | 'roundup' | 'custom' = 'fixed';

    if (donationType === 'roundup') {
      amount = roundUpAmount;
      type = 'roundup';
    } else if (donationType === 'fixed') {
      amount = fixedAmount;
      type = 'fixed';
    } else if (donationType === 'custom') {
      const parsed = parseFloat(customAmount);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        type = 'custom';
      } else {
        setError('Please enter a valid donation amount');
        onDonationChange(null);
        return;
      }
    }

    // Validate amount
    if (currentCharity) {
      if (currentCharity.minDonation && amount < currentCharity.minDonation) {
        setError(`Minimum donation is $${currentCharity.minDonation.toFixed(2)}`);
        onDonationChange(null);
        return;
      }
      if (currentCharity.maxDonation && amount > currentCharity.maxDonation) {
        setError(`Maximum donation is $${currentCharity.maxDonation.toFixed(2)}`);
        onDonationChange(null);
        return;
      }
    }

    setError('');
    onDonationChange({
      charityId: selectedCharity,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimals
      type
    });
  }, [donationType, selectedCharity, fixedAmount, customAmount, orderSubtotal, roundUpAmount, currentCharity, onDonationChange]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading charitable donation options...</span>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (charities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        {featuredCharity?.logo && (
          <img 
            src={featuredCharity.logo} 
            alt={`${featuredCharity.name} logo`}
            className="w-32 h-auto object-contain"
          />
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            Support {featuredCharity?.name || 'a Charity'}
          </h2>
          {featuredCharity && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-colors">
              {featuredCharity.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Charity Selection (if multiple) */}
      {charities.length > 1 && (
        <div className="mb-4">
          <label htmlFor="charity-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
            Select Charity
          </label>
          <select
            id="charity-select"
            value={selectedCharity}
            onChange={(e) => setSelectedCharity(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-describedby="charity-description"
          >
            {charities.map(charity => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Donation Amount Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          Donation Amount (Optional)
        </label>

        {/* No Donation */}
        <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="donation-type"
                value="none"
                checked={donationType === 'none'}
                onChange={() => setDonationType('none')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-brand-orange"
              />
          <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">No donation</span>
        </label>

        {/* Round Up */}
        {currentCharity?.allowRoundUp && roundUpAmount >= 0.01 && (
          <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="donation-type"
                value="roundup"
                checked={donationType === 'roundup'}
                onChange={() => setDonationType('roundup')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-brand-orange"
              />
            <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
              Round up to next dollar <span className="font-medium">(${roundUpAmount.toFixed(2)})</span>
            </span>
          </label>
        )}

        {/* Fixed Amounts */}
        {currentCharity?.suggestedAmounts.map(amount => (
          <label key={amount} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="donation-type"
                value={`fixed-${amount}`}
                checked={donationType === 'fixed' && fixedAmount === amount}
                onChange={() => {
                  setDonationType('fixed');
                  setFixedAmount(amount);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-brand-orange"
              />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors">${amount.toFixed(2)}</span>
          </label>
        ))}

        {/* Custom Amount */}
        {currentCharity?.allowCustomAmount && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input
                type="radio"
                name="donation-type"
                value="custom"
                checked={donationType === 'custom'}
                onChange={() => setDonationType('custom')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-brand-orange"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors">Custom amount</span>
            </label>
            {donationType === 'custom' && (
              <div className="ml-7">
                <div className="relative">
                  <label htmlFor="custom-donation-input" className="sr-only">
                    Enter custom donation amount
                  </label>
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400" aria-hidden="true">$</span>
                  <input
                    id="custom-donation-input"
                    type="number"
                    min={currentCharity.minDonation || 0.5}
                    max={currentCharity.maxDonation || 100}
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      validateCustomAmount(e.target.value);
                    }}
                    onBlur={(e) => validateCustomAmount(e.target.value)}
                    placeholder="0.00"
                    aria-invalid={!!customError}
                    aria-describedby={customError ? 'custom-donation-error custom-donation-hint' : 'custom-donation-hint'}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {currentCharity.minDonation && (
                  <p id="custom-donation-hint" className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    Min: ${currentCharity.minDonation.toFixed(2)} • Max: ${(currentCharity.maxDonation || 100).toFixed(2)}
                  </p>
                )}
                {customError && (
                  <p id="custom-donation-error" className="text-sm text-red-600 dark:text-red-400 mt-1 transition-colors" role="alert" aria-live="assertive">
                    {customError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors" role="alert" aria-live="assertive">
          <p className="text-sm text-red-600 dark:text-red-300 transition-colors">{error}</p>
        </div>
      )}

      {/* Learn More Link */}
      {currentCharity?.website && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
          <a
            href={currentCharity.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
          >
            Learn more about {currentCharity.name} →
          </a>
        </div>
      )}
    </div>
  );
}

