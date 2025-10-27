/**
 * MervSelector Component
 * 
 * Select MERV rating for custom air filter
 */

'use client';

import { Check } from 'lucide-react';
import { MERV_RATINGS, type MervRating } from '@/lib/types/custom-filters';

interface MervSelectorProps {
  selected: MervRating;
  onSelect: (rating: MervRating) => void;
  disabled?: boolean;
}

export default function MervSelector({
  selected,
  onSelect,
  disabled = false,
}: MervSelectorProps) {
  
  const getPriceColor = (price: string) => {
    switch (price) {
      case 'Low':
        return 'text-green-600';
      case 'Medium':
        return 'text-blue-600';
      case 'Premium':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Select MERV Rating</h3>
        <p className="text-sm text-gray-600">
          Higher MERV ratings provide better filtration for allergies and air quality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(MERV_RATINGS) as MervRating[]).map((rating) => {
          const info = MERV_RATINGS[rating];
          const isSelected = selected === rating;

          return (
            <button
              key={rating}
              onClick={() => onSelect(rating)}
              disabled={disabled}
              className={`
                relative p-6 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? 'border-brand-orange bg-brand-orange/5 shadow-md'
                  : 'border-gray-200 hover:border-brand-orange/50 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-pressed={isSelected}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Rating Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-2xl font-bold ${isSelected ? 'text-brand-orange' : 'text-gray-900'}`}>
                  {info.name}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriceColor(info.price)} bg-current/10`}>
                  {info.price}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 font-medium mb-3">
                {info.description}
              </p>

              {/* Efficiency */}
              <p className="text-xs text-gray-600 mb-3">
                📊 {info.efficiency}
              </p>

              {/* Best For */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700">Best For:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {info.bestFor.slice(0, 3).map((use, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-brand-orange mt-0.5">•</span>
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Badge */}
              {rating === 'M11' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs font-semibold text-brand-orange">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

