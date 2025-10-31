'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface TierPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TierPricingData) => Promise<void>;
  existingRule?: TierPricingData;
}

export interface TierPricingData {
  productId?: number;
  sku?: string;
  categoryId?: string;
  tiers: Array<{
    minQuantity: number;
    maxQuantity?: number;
    discountPercentage?: number;
    discountAmount?: number;
    fixedPrice?: number;
  }>;
}

export default function TierPricingModal({ isOpen, onClose, onSave, existingRule }: TierPricingModalProps) {
  const [ruleType, setRuleType] = useState<'product' | 'sku' | 'category'>(
    existingRule?.productId ? 'product' : existingRule?.sku ? 'sku' : existingRule?.categoryId ? 'category' : 'sku'
  );
  const [identifier, setIdentifier] = useState(
    existingRule?.productId?.toString() || existingRule?.sku || existingRule?.categoryId || ''
  );
  const [tiers, setTiers] = useState(
    existingRule?.tiers || [{ minQuantity: 1, discountPercentage: 0 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinQuantity = lastTier.maxQuantity ? lastTier.maxQuantity + 1 : lastTier.minQuantity + 12;
    
    setTiers([...tiers, { minQuantity: newMinQuantity, discountPercentage: 0 }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: string, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value === '' ? undefined : parseFloat(value) || value };
    setTiers(updated);
  };

  const handlePricingTypeChange = (index: number, type: 'percentage' | 'amount' | 'fixed') => {
    const updated = [...tiers];
    // Clear other pricing methods
    updated[index] = {
      minQuantity: updated[index].minQuantity,
      maxQuantity: updated[index].maxQuantity,
      discountPercentage: type === 'percentage' ? 0 : undefined,
      discountAmount: type === 'amount' ? 0 : undefined,
      fixedPrice: type === 'fixed' ? 0 : undefined,
    };
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate
      if (!identifier) {
        throw new Error('Please specify a product ID, SKU, or category');
      }

      // Build data
      const data: TierPricingData = {
        tiers: tiers.map(tier => ({
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          discountPercentage: tier.discountPercentage,
          discountAmount: tier.discountAmount,
          fixedPrice: tier.fixedPrice,
        })),
      };

      if (ruleType === 'product') {
        data.productId = parseInt(identifier);
      } else if (ruleType === 'sku') {
        data.sku = identifier;
      } else {
        data.categoryId = identifier;
      }

      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingRule ? 'Edit' : 'Create'} Tier Pricing Rule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Apply To
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="product"
                  checked={ruleType === 'product'}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Product ID</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sku"
                  checked={ruleType === 'sku'}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">SKU</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="category"
                  checked={ruleType === 'category'}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Category</span>
              </label>
            </div>
          </div>

          {/* Identifier */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ruleType === 'product' ? 'Product ID' : ruleType === 'sku' ? 'SKU' : 'Category ID'}
            </label>
            <input
              type="text"
              id="identifier"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={ruleType === 'product' ? 'e.g., 12345' : ruleType === 'sku' ? 'e.g., 16x20x1-MERV8' : 'e.g., air-filters'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pricing Tiers
              </label>
              <button
                type="button"
                onClick={addTier}
                className="text-brand-orange hover:text-orange-600 text-sm font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Tier
              </button>
            </div>

            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tier {index + 1}
                    </span>
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Remove tier ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label htmlFor={`minQty-${index}`} className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Min Quantity *
                      </label>
                      <input
                        type="number"
                        id={`minQty-${index}`}
                        required
                        min="1"
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(index, 'minQuantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor={`maxQty-${index}`} className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Max Quantity (optional)
                      </label>
                      <input
                        type="number"
                        id={`maxQty-${index}`}
                        min={tier.minQuantity + 1}
                        value={tier.maxQuantity || ''}
                        onChange={(e) => updateTier(index, 'maxQuantity', e.target.value)}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Pricing Method */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Pricing Method
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handlePricingTypeChange(index, 'percentage')}
                        className={`px-3 py-2 text-xs rounded border ${
                          tier.discountPercentage !== undefined
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        % Off
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePricingTypeChange(index, 'amount')}
                        className={`px-3 py-2 text-xs rounded border ${
                          tier.discountAmount !== undefined
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        $ Off
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePricingTypeChange(index, 'fixed')}
                        className={`px-3 py-2 text-xs rounded border ${
                          tier.fixedPrice !== undefined
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Fixed $
                      </button>
                    </div>

                    {tier.discountPercentage !== undefined && (
                      <div>
                        <label htmlFor={`discount-${index}`} className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Discount Percentage
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            id={`discount-${index}`}
                            min="0"
                            max="100"
                            step="0.1"
                            value={tier.discountPercentage}
                            onChange={(e) => updateTier(index, 'discountPercentage', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                          />
                          <span className="ml-2 text-gray-600 dark:text-gray-400">%</span>
                        </div>
                      </div>
                    )}

                    {tier.discountAmount !== undefined && (
                      <div>
                        <label htmlFor={`amount-${index}`} className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Discount Amount Per Unit
                        </label>
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-600 dark:text-gray-400">$</span>
                          <input
                            type="number"
                            id={`amount-${index}`}
                            min="0"
                            step="0.01"
                            value={tier.discountAmount}
                            onChange={(e) => updateTier(index, 'discountAmount', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {tier.fixedPrice !== undefined && (
                      <div>
                        <label htmlFor={`fixed-${index}`} className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Fixed Price Per Unit
                        </label>
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-600 dark:text-gray-400">$</span>
                          <input
                            type="number"
                            id={`fixed-${index}`}
                            min="0"
                            step="0.01"
                            value={tier.fixedPrice}
                            onChange={(e) => updateTier(index, 'fixedPrice', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : existingRule ? 'Update Rule' : 'Create Rule'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

