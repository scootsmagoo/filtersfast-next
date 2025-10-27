/**
 * CustomFilterBuilder Component
 * 
 * Main component for building custom-sized air filters
 */

'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Info, Ruler } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DimensionSelector from './DimensionSelector';
import MervSelector from './MervSelector';
import { useCart } from '@/lib/cart-context';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';
import type { 
  CustomFilterConfiguration, 
  CustomFilterPricing, 
  FilterDepth, 
  MervRating 
} from '@/lib/types/custom-filters';

export default function CustomFilterBuilder() {
  // Filter configuration
  const [height, setHeight] = useState<number>(16);
  const [width, setWidth] = useState<number>(25);
  const [depth, setDepth] = useState<FilterDepth>(1);
  const [mervRating, setMervRating] = useState<MervRating>('M11');
  const [quantity, setQuantity] = useState<number>(1);

  // UI state
  const [calculating, setCalculating] = useState(false);
  const [pricing, setPricing] = useState<CustomFilterPricing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { addItem } = useCart();
  const { announceSuccess } = useStatusAnnouncement();

  // Calculate pricing when dimensions or MERV change
  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);

    try {
      const config: CustomFilterConfiguration = {
        dimensions: { height, width, depth },
        mervRating,
        quantity,
      };

      const response = await fetch('/api/custom-filters/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const data = await response.json();
      setPricing(data.pricing);
    } catch (err) {
      setError('Unable to calculate price. Please try again.');
      setPricing(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleAddToCart = async () => {
    if (!pricing) return;

    setIsAdding(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    // Add to cart
    addItem({
      id: pricing.baseProductId,
      name: pricing.description,
      brand: 'FiltersFast',
      sku: pricing.sku,
      price: pricing.unitPrice,
      image: '/images/products/custom-air-filter.jpg',
    });

    announceSuccess(`${pricing.description} added to cart`);
    
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const totalPrice = pricing ? pricing.unitPrice * quantity : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-full font-semibold text-sm mb-4">
          <Ruler className="w-4 h-4" />
          Custom Filter Builder
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Build Your Perfect Filter
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Can't find the exact size you need? Create a custom air filter with your exact dimensions.
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Dimensions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold text-gray-900">Enter Dimensions</h2>
            </div>
            
            <DimensionSelector
              height={height}
              width={width}
              depth={depth}
              onHeightChange={setHeight}
              onWidthChange={setWidth}
              onDepthChange={setDepth}
              disabled={calculating || isAdding}
            />
          </Card>

          {/* Step 2: MERV Rating */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold text-gray-900">Choose Filtration Level</h2>
            </div>
            
            <MervSelector
              selected={mervRating}
              onSelect={setMervRating}
              disabled={calculating || isAdding}
            />
          </Card>

          {/* Info Banner */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">How to measure your filter:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Measure the existing filter (not the vent opening)</li>
                  <li>Round to the nearest 0.25 inch</li>
                  <li>Common sizes: 16x20, 16x25, 20x20, 20x25</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Pricing Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h3>

              {pricing ? (
                <div className="space-y-4">
                  {/* Filter Info */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Custom Filter:</p>
                    <p className="font-semibold text-gray-900">{pricing.description}</p>
                    <p className="text-sm text-gray-600 mt-1">SKU: {pricing.sku}</p>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={calculating || isAdding}
                        className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-brand-orange transition-colors disabled:opacity-50"
                      >
                        −
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        disabled={calculating || isAdding}
                        className="w-20 text-center px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(100, quantity + 1))}
                        disabled={calculating || isAdding}
                        className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-brand-orange transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 py-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium text-gray-900">${pricing.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">×{quantity}</span>
                    </div>
                    {pricing.caseQuantity && (
                      <div className="text-xs text-gray-500 italic">
                        💡 Case of {pricing.caseQuantity}: ${pricing.casePrice?.toFixed(2)} (Save {Math.round((1 - (pricing.casePrice! / (pricing.unitPrice * pricing.caseQuantity))) * 100)}%)
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-brand-orange">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`w-full flex items-center justify-center gap-2 ${
                      justAdded ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {isAdding ? 'Adding...' : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    Configure your filter to see pricing
                  </p>
                  <Button onClick={handleCalculate} disabled={calculating}>
                    {calculating ? 'Calculating...' : 'Calculate Price'}
                  </Button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
            </Card>

            {/* Auto-calculate on changes */}
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full text-sm text-brand-orange hover:text-brand-orange-dark font-medium"
            >
              {calculating ? 'Calculating...' : 'Recalculate Price'}
            </button>

            {/* Trust Indicators */}
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Made in USA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Ships within 2-3 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>365-day return policy</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

