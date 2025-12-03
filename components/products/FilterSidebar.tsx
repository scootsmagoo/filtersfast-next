'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const defaultBrands = ['GE', 'Whirlpool', 'LG', 'Samsung', 'Frigidaire', 'Kenmore', 'KitchenAid', 'Maytag', 'Bosch', 'FiltersFast'];
const ratings = [5, 4, 3, 2, 1];

interface FilterSection {
  title: string;
  expanded: boolean;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: any) => void;
  availableBrands?: string[];
  priceRange?: number[]; // [min, max] - calculated from products
  showMervFilter?: boolean;
  products?: any[]; // Optional: products to calculate price range from
}

export default function FilterSidebar({ onFilterChange, availableBrands, priceRange, showMervFilter = false, products = [] }: FilterSidebarProps = {}) {
  const brands = availableBrands || defaultBrands;
  
  // Calculate price range from products if not provided
  const calculatedPriceRange = useMemo(() => {
    if (priceRange && priceRange.length === 2) {
      return priceRange;
    }
    if (products && products.length > 0) {
      const prices = products.map(p => p.price || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        return [min, max];
      }
    }
    return [0, 200]; // Default range
  }, [priceRange, products]);

  const [sections, setSections] = useState<Record<string, boolean>>({
    brand: true,
    price: true,
    rating: true,
    merv: showMervFilter,
    features: false,
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(calculatedPriceRange[0]);
  const [priceMax, setPriceMax] = useState<number>(calculatedPriceRange[1]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedMervRatings, setSelectedMervRatings] = useState<number[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [priceError, setPriceError] = useState<string>('');

  // Update price range when calculatedPriceRange changes
  useEffect(() => {
    setPriceMin(calculatedPriceRange[0]);
    setPriceMax(calculatedPriceRange[1]);
  }, [calculatedPriceRange]);

  const toggleSection = (section: string) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // OWASP: Validate brand input to prevent XSS/injection
  const toggleBrand = (brand: string) => {
    // Sanitize: only allow alphanumeric, spaces, hyphens, and common brand characters
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9\s\-&.,()]/g, '').trim();
    if (!sanitizedBrand || sanitizedBrand.length > 100) return;
    
    setSelectedBrands((prev) =>
      prev.includes(sanitizedBrand) ? prev.filter((b) => b !== sanitizedBrand) : [...prev, sanitizedBrand]
    );
  };

  // OWASP: Validate rating is within valid range
  const toggleRating = (rating: number) => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
    
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  // OWASP: Validate MERV rating is within valid range
  const toggleMervRating = (rating: number) => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 20) return;
    
    setSelectedMervRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  // OWASP: Validate feature is from allowed list
  const allowedFeatures = ['Genuine OEM', 'NSF Certified', 'Free Shipping', 'On Sale', 'In Stock'];
  const toggleFeature = (feature: string) => {
    if (!allowedFeatures.includes(feature)) return;
    
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceMin(calculatedPriceRange[0]);
    setPriceMax(calculatedPriceRange[1]);
    setSelectedRatings([]);
    setSelectedMervRatings([]);
    setSelectedFeatures([]);
  };

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      const priceRangeValue = priceMin !== calculatedPriceRange[0] || priceMax !== calculatedPriceRange[1] 
        ? [priceMin, priceMax] 
        : null;
      
      onFilterChange({
        brands: selectedBrands.length > 0 ? selectedBrands : null,
        priceRange: priceRangeValue,
        ratings: selectedRatings.length > 0 ? selectedRatings : null,
        mervRatings: selectedMervRatings.length > 0 ? selectedMervRatings : null,
        features: selectedFeatures.length > 0 ? selectedFeatures : null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrands, priceMin, priceMax, selectedRatings, selectedMervRatings, selectedFeatures]);

  const hasFilters = selectedBrands.length > 0 || 
    priceMin !== calculatedPriceRange[0] || 
    priceMax !== calculatedPriceRange[1] || 
    selectedRatings.length > 0 || 
    selectedMervRatings.length > 0 ||
    selectedFeatures.length > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Active Filters */}
      {hasFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Active Filters</h3>
            <button
              onClick={clearFilters}
              className="text-brand-orange text-sm font-semibold hover:underline"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedBrands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium"
              >
                {brand}
                <button onClick={() => toggleBrand(brand)} aria-label={`Remove ${brand} filter`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(priceMin !== calculatedPriceRange[0] || priceMax !== calculatedPriceRange[1]) && (
              <span className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium">
                {formatPrice(priceMin)} - {formatPrice(priceMax)}
                <button 
                  onClick={() => {
                    setPriceMin(calculatedPriceRange[0]);
                    setPriceMax(calculatedPriceRange[1]);
                  }}
                  aria-label="Remove price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRatings.map((rating) => (
              <span
                key={rating}
                className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium"
              >
                {rating}+ Stars
                <button onClick={() => toggleRating(rating)} aria-label={`Remove ${rating} star filter`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedMervRatings.map((merv) => (
              <span
                key={merv}
                className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium"
              >
                MERV {merv}
                <button onClick={() => toggleMervRating(merv)} aria-label={`Remove MERV ${merv} filter`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium"
              >
                {feature}
                <button onClick={() => toggleFeature(feature)} aria-label={`Remove ${feature} filter`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors" role="group" aria-labelledby="brand-filter-heading">
        <button
          onClick={() => toggleSection('brand')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-expanded={sections.brand}
          aria-controls="brand-filter-content"
          id="brand-filter-heading"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Brand</h3>
          {sections.brand ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        </button>
        {sections.brand && (
          <div id="brand-filter-content" className="p-4 pt-0 space-y-2 max-h-64 overflow-y-auto" role="group">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                  aria-label={`Filter by ${brand} brand`}
                />
                <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                  {/* OWASP: React automatically escapes content, but we've already sanitized */}
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter - Slider */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors" role="group" aria-labelledby="price-filter-heading">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-expanded={sections.price}
          aria-controls="price-filter-content"
          id="price-filter-heading"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Price Range</h3>
          {sections.price ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        </button>
        {sections.price && (
          <div id="price-filter-content" className="p-4 pt-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label htmlFor="price-min" className="block text-xs text-brand-gray-600 dark:text-gray-400 mb-1">
                  Min Price
                </label>
                <input
                  id="price-min"
                  type="number"
                  min={calculatedPriceRange[0]}
                  max={calculatedPriceRange[1]}
                  step="1"
                  value={priceMin}
                  onChange={(e) => {
                    // OWASP: Validate and sanitize input
                    const inputValue = e.target.value;
                    if (inputValue === '' || inputValue === '-') {
                      setPriceError('');
                      return;
                    }
                    const numValue = Number(inputValue);
                    if (isNaN(numValue) || !isFinite(numValue)) {
                      setPriceError('Please enter a valid number');
                      return;
                    }
                    if (numValue < calculatedPriceRange[0] || numValue > calculatedPriceRange[1]) {
                      setPriceError(`Price must be between ${formatPrice(calculatedPriceRange[0])} and ${formatPrice(calculatedPriceRange[1])}`);
                      return;
                    }
                    const value = Math.max(calculatedPriceRange[0], Math.min(Math.floor(numValue), priceMax));
                    setPriceMin(value);
                    setPriceError('');
                  }}
                  onBlur={(e) => {
                    // Ensure value is within bounds on blur
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || numValue < calculatedPriceRange[0]) {
                      setPriceMin(calculatedPriceRange[0]);
                    } else if (numValue > priceMax) {
                      setPriceMin(priceMax);
                    }
                    setPriceError('');
                  }}
                  className="w-full px-3 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Minimum price in dollars"
                  aria-describedby="price-min-description"
                  aria-invalid={priceError ? 'true' : 'false'}
                  aria-errormessage={priceError ? 'price-error' : undefined}
                />
                <div id="price-min-description" className="sr-only">
                  Enter minimum price between {formatPrice(calculatedPriceRange[0])} and {formatPrice(calculatedPriceRange[1])}
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="price-max" className="block text-xs text-brand-gray-600 dark:text-gray-400 mb-1">
                  Max Price
                </label>
                <input
                  id="price-max"
                  type="number"
                  min={calculatedPriceRange[0]}
                  max={calculatedPriceRange[1]}
                  step="1"
                  value={priceMax}
                  onChange={(e) => {
                    // OWASP: Validate and sanitize input
                    const inputValue = e.target.value;
                    if (inputValue === '' || inputValue === '-') {
                      setPriceError('');
                      return;
                    }
                    const numValue = Number(inputValue);
                    if (isNaN(numValue) || !isFinite(numValue)) {
                      setPriceError('Please enter a valid number');
                      return;
                    }
                    if (numValue < calculatedPriceRange[0] || numValue > calculatedPriceRange[1]) {
                      setPriceError(`Price must be between ${formatPrice(calculatedPriceRange[0])} and ${formatPrice(calculatedPriceRange[1])}`);
                      return;
                    }
                    const value = Math.min(calculatedPriceRange[1], Math.max(Math.floor(numValue), priceMin));
                    setPriceMax(value);
                    setPriceError('');
                  }}
                  onBlur={(e) => {
                    // Ensure value is within bounds on blur
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || numValue > calculatedPriceRange[1]) {
                      setPriceMax(calculatedPriceRange[1]);
                    } else if (numValue < priceMin) {
                      setPriceMax(priceMin);
                    }
                    setPriceError('');
                  }}
                  className="w-full px-3 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Maximum price in dollars"
                  aria-describedby="price-max-description"
                  aria-invalid={priceError ? 'true' : 'false'}
                  aria-errormessage={priceError ? 'price-error' : undefined}
                />
                <div id="price-max-description" className="sr-only">
                  Enter maximum price between {formatPrice(calculatedPriceRange[0])} and {formatPrice(calculatedPriceRange[1])}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {priceError && (
                <div id="price-error" role="alert" className="text-red-600 dark:text-red-400 text-xs" aria-live="polite">
                  {priceError}
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-brand-gray-600 dark:text-gray-400">
                <span>{formatPrice(calculatedPriceRange[0])}</span>
                <span className="font-semibold text-brand-orange" aria-live="polite" aria-atomic="true">
                  {formatPrice(priceMin)} - {formatPrice(priceMax)}
                </span>
                <span>{formatPrice(calculatedPriceRange[1])}</span>
              </div>
              <div className="relative h-6 flex items-center">
                {/* Background track */}
                <div className="absolute w-full h-2 bg-brand-gray-200 dark:bg-gray-600 rounded-full"></div>
                {/* Active range track */}
                <div 
                  className="absolute h-2 bg-brand-orange rounded-full"
                  style={{
                    left: `${((priceMin - calculatedPriceRange[0]) / (calculatedPriceRange[1] - calculatedPriceRange[0])) * 100}%`,
                    width: `${((priceMax - priceMin) / (calculatedPriceRange[1] - calculatedPriceRange[0])) * 100}%`,
                  }}
                ></div>
                {/* Min slider */}
                <input
                  type="range"
                  min={calculatedPriceRange[0]}
                  max={calculatedPriceRange[1]}
                  step="1"
                  value={priceMin}
                  onChange={(e) => {
                    // OWASP: Validate input
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || !isFinite(numValue)) return;
                    const value = Math.min(Math.floor(numValue), priceMax);
                    setPriceMin(value);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-orange [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-orange [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none focus:outline-none focus:[&::-webkit-slider-thumb]:ring-2 focus:[&::-webkit-slider-thumb]:ring-brand-orange focus:[&::-webkit-slider-thumb]:ring-offset-2"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  aria-label="Minimum price slider"
                  aria-valuemin={calculatedPriceRange[0]}
                  aria-valuemax={calculatedPriceRange[1]}
                  aria-valuenow={priceMin}
                  aria-valuetext={`${formatPrice(priceMin)}`}
                />
                {/* Max slider */}
                <input
                  type="range"
                  min={calculatedPriceRange[0]}
                  max={calculatedPriceRange[1]}
                  step="1"
                  value={priceMax}
                  onChange={(e) => {
                    // OWASP: Validate input
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || !isFinite(numValue)) return;
                    const value = Math.max(Math.floor(numValue), priceMin);
                    setPriceMax(value);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-orange [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-orange [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none focus:outline-none focus:[&::-webkit-slider-thumb]:ring-2 focus:[&::-webkit-slider-thumb]:ring-brand-orange focus:[&::-webkit-slider-thumb]:ring-offset-2"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  aria-label="Maximum price slider"
                  aria-valuemin={calculatedPriceRange[0]}
                  aria-valuemax={calculatedPriceRange[1]}
                  aria-valuenow={priceMax}
                  aria-valuetext={`${formatPrice(priceMax)}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Filter - Multiple Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors" role="group" aria-labelledby="rating-filter-heading">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-expanded={sections.rating}
          aria-controls="rating-filter-content"
          id="rating-filter-heading"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Customer Rating</h3>
          {sections.rating ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        </button>
        {sections.rating && (
          <div id="rating-filter-content" className="p-4 pt-0 space-y-2">
            {ratings.map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRatings.includes(rating)}
                  onChange={() => toggleRating(rating)}
                  className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                  aria-label={`Filter by ${rating} star rating and up`}
                />
                <span className="flex items-center gap-1 text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                  {rating}
                  <span className="text-yellow-400">★</span>
                  & Up
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* MERV Rating Filter (Air Filters Only) */}
      {showMervFilter && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors" role="group" aria-labelledby="merv-filter-heading">
          <button
            onClick={() => toggleSection('merv')}
            className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={sections.merv}
            aria-controls="merv-filter-content"
            id="merv-filter-heading"
          >
            <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">MERV Rating</h3>
            {sections.merv ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
          </button>
          {sections.merv && (
            <div id="merv-filter-content" className="p-4 pt-0 space-y-2">
              {[8, 11, 13].map((merv) => (
                <label key={merv} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedMervRatings.includes(merv)}
                    onChange={() => toggleMervRating(merv)}
                    className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                    aria-label={`Filter by MERV ${merv} rating`}
                  />
                  <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                    MERV {merv}
                    {merv === 8 && <span className="text-xs ml-1 text-brand-gray-500">(Basic)</span>}
                    {merv === 11 && <span className="text-xs ml-1 text-brand-gray-500">(Better)</span>}
                    {merv === 13 && <span className="text-xs ml-1 text-brand-gray-500">(Best)</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Filter - Enhanced */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors" role="group" aria-labelledby="features-filter-heading">
        <button
          onClick={() => toggleSection('features')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-expanded={sections.features}
          aria-controls="features-filter-content"
          id="features-filter-heading"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Features</h3>
          {sections.features ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        </button>
        {sections.features && (
          <div id="features-filter-content" className="p-4 pt-0 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFeatures.includes('Genuine OEM')}
                onChange={() => toggleFeature('Genuine OEM')}
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                aria-label="Filter by Genuine OEM products"
              />
              <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                Genuine OEM
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFeatures.includes('NSF Certified')}
                onChange={() => toggleFeature('NSF Certified')}
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                aria-label="Filter by NSF Certified products"
              />
              <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                NSF Certified
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFeatures.includes('Free Shipping')}
                onChange={() => toggleFeature('Free Shipping')}
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                aria-label="Filter by Free Shipping products"
              />
              <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                Free Shipping
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFeatures.includes('On Sale')}
                onChange={() => toggleFeature('On Sale')}
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                aria-label="Filter by On Sale products"
              />
              <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                On Sale
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedFeatures.includes('In Stock')}
                onChange={() => toggleFeature('In Stock')}
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                aria-label="Filter by In Stock products"
              />
              <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                In Stock
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

