'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const defaultBrands = ['GE', 'Whirlpool', 'LG', 'Samsung', 'Frigidaire', 'Kenmore', 'KitchenAid', 'Maytag', 'Bosch', 'FiltersFast'];
const priceRanges = [
  { label: 'Under $25', value: '0-25' },
  { label: '$25 - $50', value: '25-50' },
  { label: '$50 - $75', value: '50-75' },
  { label: '$75 - $100', value: '75-100' },
  { label: 'Over $100', value: '100-999' },
];
const ratings = [5, 4, 3];

interface FilterSection {
  title: string;
  expanded: boolean;
}

interface FilterSidebarProps {
  onFilterChange?: (filters: any) => void;
  availableBrands?: string[];
  priceRange?: number[];
  showMervFilter?: boolean;
}

export default function FilterSidebar({ onFilterChange, availableBrands, priceRange, showMervFilter = false }: FilterSidebarProps = {}) {
  const brands = availableBrands || defaultBrands;
  const [sections, setSections] = useState<Record<string, boolean>>({
    brand: true,
    price: true,
    rating: true,
    merv: showMervFilter,
    features: false,
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedMervRatings, setSelectedMervRatings] = useState<number[]>([]);

  const toggleSection = (section: string) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleMervRating = (rating: number) => {
    setSelectedMervRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedPrice('');
    setSelectedRating(null);
    setSelectedMervRatings([]);
  };

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        brands: selectedBrands,
        price: selectedPrice,
        rating: selectedRating,
        mervRatings: selectedMervRatings,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrands, selectedPrice, selectedRating, selectedMervRatings]);

  const hasFilters = selectedBrands.length > 0 || selectedPrice || selectedRating !== null || selectedMervRatings.length > 0;

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
                <button onClick={() => toggleBrand(brand)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
        <button
          onClick={() => toggleSection('brand')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Brand</h3>
          {sections.brand ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {sections.brand && (
          <div className="p-4 pt-0 space-y-2 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Price Range</h3>
          {sections.price ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {sections.price && (
          <div className="p-4 pt-0 space-y-2">
            {priceRanges.map((range) => (
              <label key={range.value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPrice === range.value}
                  onChange={() => setSelectedPrice(range.value)}
                  className="w-4 h-4 border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Customer Rating</h3>
          {sections.rating ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {sections.rating && (
          <div className="p-4 pt-0 space-y-2">
            {ratings.map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => setSelectedRating(rating)}
                  className="w-4 h-4 border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
          <button
            onClick={() => toggleSection('merv')}
            className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">MERV Rating</h3>
            {sections.merv ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {sections.merv && (
            <div className="p-4 pt-0 space-y-2">
              {[8, 11, 13].map((merv) => (
                <label key={merv} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedMervRatings.includes(merv)}
                    onChange={() => toggleMervRating(merv)}
                    className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="text-brand-gray-700 dark:text-gray-300 group-hover:text-brand-orange transition-colors">
                    MERV {merv}
                    {merv === 8 && <span className="text-xs ml-1">(Basic)</span>}
                    {merv === 11 && <span className="text-xs ml-1">(Better)</span>}
                    {merv === 13 && <span className="text-xs ml-1">(Best)</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
        <button
          onClick={() => toggleSection('features')}
          className="w-full flex justify-between items-center p-4 hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">Features</h3>
          {sections.features ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {sections.features && (
          <div className="p-4 pt-0 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-brand-gray-700 group-hover:text-brand-orange transition-colors">
                Genuine OEM
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-brand-gray-700 group-hover:text-brand-orange transition-colors">
                NSF Certified
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-brand-gray-700 group-hover:text-brand-orange transition-colors">
                Free Shipping
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-brand-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-brand-gray-700 group-hover:text-brand-orange transition-colors">
                On Sale
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

