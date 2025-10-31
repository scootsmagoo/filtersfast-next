'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, X, Ruler } from 'lucide-react';
import { CommonSize } from '@/lib/types/size-filter';

interface SizeDimensionSelectorProps {
  onSearch: (height: number | null, width: number | null, depth: number | null) => void;
  availableDimensions?: {
    heights: number[];
    widths: number[];
    depths: number[];
  };
  commonSizes?: CommonSize[];
}

export default function SizeDimensionSelector({
  onSearch,
  availableDimensions,
  commonSizes = [],
}: SizeDimensionSelectorProps) {
  const [height, setHeight] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [depth, setDepth] = useState<string>('');
  const [selectedCommonSize, setSelectedCommonSize] = useState<string | null>(null);

  const handleSearch = () => {
    const h = height ? parseFloat(height) : null;
    const w = width ? parseFloat(width) : null;
    const d = depth ? parseFloat(depth) : null;
    
    onSearch(h, w, d);
  };

  const handleClear = () => {
    setHeight('');
    setWidth('');
    setDepth('');
    setSelectedCommonSize(null);
    onSearch(null, null, null);
  };

  const handleCommonSizeClick = (size: CommonSize) => {
    setHeight(size.height.toString());
    setWidth(size.width.toString());
    setDepth(size.depth.toString());
    setSelectedCommonSize(size.label);
    onSearch(size.height, size.width, size.depth);
  };

  const isSearchActive = height || width || depth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2 transition-colors">
          <Ruler className="w-6 h-6 text-brand-orange" aria-hidden="true" />
          Find Your Filter Size
        </h2>
        <p className="text-brand-gray-600 dark:text-gray-300 transition-colors" id="size-selector-description">
          Select a common size or enter custom dimensions to find your perfect filter
        </p>
      </div>

      {/* Custom Dimensions Input */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors" id="custom-dimensions-heading">
          Enter Dimensions (Height × Width × Depth)
        </h3>
        
        <div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          role="group"
          aria-labelledby="custom-dimensions-heading"
        >
          {/* Height */}
          <div>
            <label 
              htmlFor="height" 
              className="block text-sm font-medium text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors"
            >
              Height (inches)
            </label>
            <input
              id="height"
              type="number"
              step="0.25"
              min="1"
              max="48"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                setSelectedCommonSize(null);
              }}
              placeholder="e.g., 16"
              className="w-full px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              aria-describedby="dimension-help"
            />
          </div>

          {/* Width */}
          <div>
            <label 
              htmlFor="width" 
              className="block text-sm font-medium text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors"
            >
              Width (inches)
            </label>
            <input
              id="width"
              type="number"
              step="0.25"
              min="1"
              max="48"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                setSelectedCommonSize(null);
              }}
              placeholder="e.g., 20"
              className="w-full px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              aria-describedby="dimension-help"
            />
          </div>

          {/* Depth */}
          <div>
            <label 
              htmlFor="depth" 
              className="block text-sm font-medium text-brand-gray-700 dark:text-gray-300 mb-2 transition-colors"
            >
              Depth (inches)
            </label>
            <input
              id="depth"
              type="number"
              step="0.25"
              min="1"
              max="6"
              value={depth}
              onChange={(e) => {
                setDepth(e.target.value);
                setSelectedCommonSize(null);
              }}
              placeholder="e.g., 1"
              className="w-full px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              aria-describedby="dimension-help"
            />
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={!isSearchActive}
              className="flex-1 flex items-center justify-center gap-2"
              aria-label="Search for filters with entered dimensions"
              type="button"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              Search
            </Button>
            {isSearchActive && (
              <Button
                onClick={handleClear}
                variant="secondary"
                className="flex items-center justify-center gap-2"
                aria-label="Clear all dimension filters and reset search"
              >
                <X className="w-5 h-5" aria-hidden="true" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors" id="dimension-help">
          <p className="text-sm text-brand-gray-700 dark:text-gray-300 transition-colors">
            <span role="img" aria-label="Light bulb">💡</span> <strong>Tip:</strong> Look on the side of your current filter for the size (e.g., 16x20x1). 
            The actual size may be slightly smaller (e.g., 15.5x19.5x0.75).
          </p>
        </div>
      </Card>

      {/* Common Sizes */}
      {commonSizes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors" id="popular-sizes-heading">
            Popular Sizes
          </h3>
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
            role="group"
            aria-labelledby="popular-sizes-heading"
          >
            {commonSizes.slice(0, 15).map((size) => (
              <button
                key={size.label}
                onClick={() => handleCommonSizeClick(size)}
                className={`
                  px-4 py-3 rounded-lg border-2 font-semibold text-sm
                  transition-all duration-200
                  ${
                    selectedCommonSize === size.label
                      ? 'border-brand-orange bg-brand-orange text-white shadow-md'
                      : 'border-brand-gray-300 dark:border-gray-600 text-brand-gray-700 dark:text-gray-300 hover:border-brand-orange hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                  }
                `}
                aria-label={`Select filter size ${size.label} inches - ${size.height} inches height by ${size.width} inches width by ${size.depth} inch depth`}
                aria-pressed={selectedCommonSize === size.label}
              >
                {size.label}
                {selectedCommonSize === size.label && <span className="sr-only"> (selected)</span>}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Measurement Guide */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-brand-orange/20 dark:border-gray-600 transition-colors">
        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 transition-colors">
          <Ruler className="w-5 h-5 text-brand-orange" aria-hidden="true" />
          How to Measure Your Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-1 transition-colors">1. Check Existing Filter</div>
            <p className="text-sm text-brand-gray-700 dark:text-gray-300 transition-colors">
              The size is usually printed on the cardboard frame (e.g., 16x20x1)
            </p>
          </div>
          <div>
            <div className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-1 transition-colors">2. Measure if Needed</div>
            <p className="text-sm text-brand-gray-700 dark:text-gray-300 transition-colors">
              Use a tape measure: Height × Width × Depth in inches
            </p>
          </div>
          <div>
            <div className="font-semibold text-brand-gray-900 dark:text-gray-100 mb-1 transition-colors">3. Round to Nearest</div>
            <p className="text-sm text-brand-gray-700 dark:text-gray-300 transition-colors">
              Round to the nearest whole or half inch (e.g., 15.5" = 16")
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

