'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ChevronLeft, Plus, Package } from 'lucide-react';
import { TierPricing } from '@/lib/types/b2b';

export default function AdminTierPricingPage() {
  const [pricingRules, setPricingRules] = useState<TierPricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    try {
      // This would be implemented when you create the API route
      // For now, just show empty state
      setPricingRules([]);
    } catch (error) {
      console.error('Error loading pricing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/admin/b2b"
          className="inline-flex items-center text-brand-orange hover:underline mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to B2B Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Volume Tier Pricing
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure quantity-based pricing discounts for B2B customers
            </p>
          </div>
          <button
            onClick={() => alert('Create tier pricing form would open here')}
            className="inline-flex items-center px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-semibold rounded-md transition-colors"
            aria-label="Create new tier pricing rule"
          >
            <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
            Create Pricing Rule
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8" role="region" aria-label="Tier Pricing Statistics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Rules
              </p>
              <TrendingUp className="w-5 h-5 text-brand-orange" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pricingRules.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Product Rules
              </p>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pricingRules.filter(p => p.productId).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Category Rules
              </p>
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pricingRules.filter(p => p.categoryId).length}
            </p>
          </div>
        </div>

        {/* Pricing Rules List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pricing Rules
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading pricing rules...</p>
            </div>
          ) : pricingRules.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Pricing Rules Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Create volume-based pricing tiers to offer discounts for bulk purchases.
                Rules can apply to specific products, SKUs, or entire categories.
              </p>
              <button
                onClick={() => alert('Create tier pricing form would open here')}
                className="inline-flex items-center px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white font-semibold rounded-md transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Rule
              </button>

              {/* Examples */}
              <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Example: Product Tier
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Buy 1-11: $10.00 each</li>
                    <li>• Buy 12-23: $9.00 each (10% off)</li>
                    <li>• Buy 24+: $8.50 each (15% off)</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Example: Category Tier
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Buy 1-49: Regular price</li>
                    <li>• Buy 50-99: 5% off</li>
                    <li>• Buy 100+: 10% off</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {rule.productId ? `Product ID: ${rule.productId}` : 
                         rule.sku ? `SKU: ${rule.sku}` : 
                         rule.categoryId ? `Category: ${rule.categoryId}` : 
                         'Global Rule'}
                      </h3>
                      <div className="space-y-1">
                        {rule.tiers.map((tier, idx) => (
                          <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            • Buy {tier.minQuantity}
                            {tier.maxQuantity ? `-${tier.maxQuantity}` : '+'}
                            : {tier.discountPercentage && `${tier.discountPercentage}% off`}
                            {tier.discountAmount && `$${tier.discountAmount} off`}
                            {tier.fixedPrice && `$${tier.fixedPrice}`}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Edit form would open here')}
                      className="text-brand-orange hover:underline text-sm"
                      aria-label={`Edit pricing rule for ${
                        rule.productId ? `Product ID ${rule.productId}` : 
                        rule.sku ? `SKU ${rule.sku}` : 
                        rule.categoryId ? `Category ${rule.categoryId}` : 
                        'Global Rule'
                      }`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

