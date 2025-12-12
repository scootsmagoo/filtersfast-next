'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Tag, DollarSign, Gift, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Deal } from '@/lib/types/deal';

interface DealListResponse {
  success: boolean;
  deals: Deal[];
  total: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deals');
      if (!response.ok) throw new Error('Failed to load deals');

      const data: DealListResponse = await response.json();
      setDeals(data.deals);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"
          role="status"
          aria-label="Loading deals"
        >
          <span className="sr-only">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Special Offers & Deals
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
            Take advantage of our special offers! Add items to your cart and automatically receive free products when your order total falls within these price ranges.
          </p>
        </div>

        {/* Deals Grid */}
        {deals.length === 0 ? (
          <Card className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Active Deals
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
              Check back soon for new special offers!
            </p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {deals.map((deal) => {
              const validFrom = formatDate(deal.validFrom);
              const validTo = formatDate(deal.validTo);
              
              return (
                <Card key={deal.iddeal} className="p-6 hover:shadow-lg transition-shadow" aria-labelledby={`deal-title-${deal.iddeal}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-brand-orange flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors" id={`deal-title-${deal.iddeal}`}>
                          {deal.dealdiscription}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Price Range:</strong> {formatPrice(deal.startprice)} - {formatPrice(deal.endprice)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Gift className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Free Units:</strong> {deal.units} {deal.units === 1 ? 'product' : 'products'}
                      </span>
                    </div>

                    {(validFrom || validTo) && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {validFrom && validTo ? (
                            <>Valid: {validFrom} - {validTo}</>
                          ) : validFrom ? (
                            <>Starts: {validFrom}</>
                          ) : (
                            <>Ends: {validTo}</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors">
                      When your cart total is between {formatPrice(deal.startprice)} and {formatPrice(deal.endprice)}, you'll automatically receive {deal.units} free {deal.units === 1 ? 'product' : 'products'}!
                    </p>
                    <Link href="/">
                      <Button className="w-full">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* How It Works Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
            How Our Deals Work
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
              <li>Browse our products and add items to your cart</li>
              <li>As you shop, your cart total will be calculated automatically</li>
              <li>When your cart total falls within a deal's price range, you'll automatically receive the free products</li>
              <li>The free products will be added to your cart automatically at checkout</li>
              <li>Deals apply to your cart subtotal before taxes and shipping</li>
            </ol>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> Only one deal can apply per order. If your cart total matches multiple deals, the deal with the highest start price will be applied.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

