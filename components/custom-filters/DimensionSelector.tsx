/**
 * DimensionSelector Component
 * 
 * Input fields for custom filter dimensions (height, width, depth)
 */

'use client';

import { DIMENSION_LIMITS, FILTER_DEPTHS, DOUBLE_SIZE_WIDTH_THRESHOLD, type FilterDepth } from '@/lib/types/custom-filters';

interface DimensionSelectorProps {
  height: number;
  width: number;
  depth: FilterDepth;
  onHeightChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onDepthChange: (value: FilterDepth) => void;
  disabled?: boolean;
}

export default function DimensionSelector({
  height,
  width,
  depth,
  onHeightChange,
  onWidthChange,
  onDepthChange,
  disabled = false,
}: DimensionSelectorProps) {
  
  const handleNumberInput = (
    value: string,
    onChange: (val: number) => void,
    min: number,
    max: number
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      onChange(min);
    } else {
      onChange(Math.max(min, Math.min(max, num)));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Filter Dimensions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Height */}
        <div>
          <label htmlFor="filter-height" className="block text-sm font-medium text-gray-700 mb-2">
            Height (inches)
          </label>
          <div className="relative">
            <input
              id="filter-height"
              type="number"
              min={DIMENSION_LIMITS.height.min}
              max={DIMENSION_LIMITS.height.max}
              step="0.25"
              value={height}
              onChange={(e) => handleNumberInput(
                e.target.value,
                onHeightChange,
                DIMENSION_LIMITS.height.min,
                DIMENSION_LIMITS.height.max
              )}
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-describedby="height-help"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              "
            </span>
          </div>
          <p id="height-help" className="text-xs text-gray-500 mt-1">
            {DIMENSION_LIMITS.height.min}" - {DIMENSION_LIMITS.height.max}"
          </p>
        </div>

        {/* Width */}
        <div>
          <label htmlFor="filter-width" className="block text-sm font-medium text-gray-700 mb-2">
            Width (inches)
          </label>
          <div className="relative">
            <input
              id="filter-width"
              type="number"
              min={DIMENSION_LIMITS.width.min}
              max={DIMENSION_LIMITS.width.max}
              step="0.25"
              value={width}
              onChange={(e) => handleNumberInput(
                e.target.value,
                onWidthChange,
                DIMENSION_LIMITS.width.min,
                DIMENSION_LIMITS.width.max
              )}
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-describedby="width-help"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              "
            </span>
          </div>
          <p id="width-help" className="text-xs text-gray-500 mt-1">
            {DIMENSION_LIMITS.width.min}" - {DIMENSION_LIMITS.width.max}"
          </p>
        </div>

        {/* Depth */}
        <div>
          <label htmlFor="filter-depth" className="block text-sm font-medium text-gray-700 mb-2">
            Depth
          </label>
          <select
            id="filter-depth"
            value={depth}
            onChange={(e) => onDepthChange(parseInt(e.target.value) as FilterDepth)}
            disabled={disabled}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
            aria-describedby="depth-help"
          >
            {FILTER_DEPTHS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} (Actual: {d.actualDepth}")
              </option>
            ))}
          </select>
          <p id="depth-help" className="text-xs text-gray-500 mt-1">
            Select filter thickness
          </p>
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Your Filter Size:</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-orange">
            {height}" × {width}" × {depth}"
          </span>
          {width >= DOUBLE_SIZE_WIDTH_THRESHOLD && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              Double Size
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

