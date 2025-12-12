'use client';

import { useState, useEffect } from 'react';
import type {
  ProductOptionGroupWithOptions,
  ProductOptionWithInventory,
  Option,
} from '@/lib/types/product';

interface ProductOptionsProps {
  optionGroups: ProductOptionGroupWithOptions[];
  optionsWithInventory: Record<string, ProductOptionWithInventory[]>;
  basePrice: number;
  currencySign?: string;
  onOptionChange?: (selectedOptions: Record<string, string>) => void;
  onPriceChange?: (priceAdjustment: number, totalPrice: number) => void;
  onImageChange?: (imageUrl: string | null) => void;
}

export default function ProductOptions({
  optionGroups,
  optionsWithInventory,
  basePrice,
  currencySign = '$',
  onOptionChange,
  onPriceChange,
  onImageChange,
}: ProductOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [priceAdjustment, setPriceAdjustment] = useState(0);

  useEffect(() => {
    // Calculate price adjustment based on selected options
    let adjustment = 0;
    
    for (const [groupId, optionId] of Object.entries(selectedOptions)) {
      const options = optionsWithInventory[groupId];
      if (options) {
        const option = options.find(opt => opt.idOption === optionId);
        if (option) {
          // Calculate price adjustment
          if (option.percToAdd > 0) {
            adjustment += (basePrice * option.percToAdd) / 100;
          }
          if (option.priceToAdd > 0) {
            adjustment += option.priceToAdd;
          }
          
          // Update image if option has custom image
          if (option.image && onImageChange) {
            onImageChange(option.image.optionImageUrl);
          }
        }
      }
    }

    setPriceAdjustment(adjustment);
    const totalPrice = basePrice + adjustment;
    
    if (onPriceChange) {
      onPriceChange(adjustment, totalPrice);
    }
  }, [selectedOptions, basePrice, optionsWithInventory, onPriceChange, onImageChange]);

  const handleOptionChange = (groupId: string, optionId: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [groupId]: optionId,
    };
    
    setSelectedOptions(newSelectedOptions);
    
    if (onOptionChange) {
      onOptionChange(newSelectedOptions);
    }
  };

  const formatPrice = (price: number) => {
    return `${currencySign}${price.toFixed(2)}`;
  };

  const getOptionPriceText = (option: Option) => {
    let text = option.optionDescrip;
    let priceAdd = 0;
    
    if (option.percToAdd > 0) {
      priceAdd = (basePrice * option.percToAdd) / 100;
    }
    if (option.priceToAdd > 0) {
      priceAdd += option.priceToAdd;
    }
    
    if (priceAdd > 0) {
      text += ` (+${formatPrice(priceAdd)})`;
    } else if (priceAdd < 0) {
      text += ` (${formatPrice(priceAdd)})`;
    }
    
    return text;
  };

  if (optionGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" role="group" aria-label="Product Options">
      {optionGroups.map((group) => {
        const options = optionsWithInventory[group.idOptionGroup] || [];
        const selectedOptionId = selectedOptions[group.idOptionGroup];
        const selectId = `option-${group.idOptionGroup}`;
        const textInputId = `text-option-${group.idOptionGroup}`;
        const descriptionId = `option-desc-${group.idOptionGroup}`;
        const errorId = `option-error-${group.idOptionGroup}`;
        
        const selectedOption = selectedOptionId 
          ? options.find(opt => opt.idOption === selectedOptionId)
          : null;
        const hasError = selectedOption && (selectedOption.blocked || selectedOption.unavailable);
        
        return (
          <div key={group.idOptionGroup} className="space-y-2">
            <label 
              htmlFor={group.optionType === 'S' ? selectId : textInputId}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {group.optionGroupDesc}
              {group.optionReq === 'Y' && (
                <span className="text-red-600 dark:text-red-400 ml-1" aria-label="required">*</span>
              )}
              {group.optionReq === 'N' && (
                <span className="text-gray-500 dark:text-gray-400 ml-1" aria-label="optional">(Optional)</span>
              )}
              {group.sizingLink === 1 && (
                <a
                  href="#sizeFitting"
                  className="ml-2 text-brand-orange hover:text-brand-orange-dark text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
                  aria-label={`See sizing chart for ${group.optionGroupDesc}`}
                >
                  See Sizing Chart
                </a>
              )}
            </label>
            
            <div id={descriptionId} className="sr-only">
              {group.optionType === 'S' 
                ? `Select ${group.optionGroupDesc.toLowerCase()}${group.optionReq === 'Y' ? ' (required)' : ''}`
                : `Enter ${group.optionGroupDesc.toLowerCase()}${group.optionReq === 'Y' ? ' (required)' : ''}`
              }
            </div>
            
            {group.optionType === 'S' && (
              <>
                <select
                  id={selectId}
                  value={selectedOptionId || ''}
                  onChange={(e) => handleOptionChange(group.idOptionGroup, e.target.value)}
                  required={group.optionReq === 'Y'}
                  aria-required={group.optionReq === 'Y'}
                  aria-describedby={`${descriptionId} ${hasError ? errorId : ''}`}
                  aria-invalid={hasError ? 'true' : 'false'}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                >
                  <option value="">Select {group.optionGroupDesc}...</option>
                  {options.map((option) => {
                    const isAvailable = option.available && !option.blocked;
                    const isUnavailable = option.unavailable || option.blocked;
                    
                    return (
                      <option
                        key={option.idOption}
                        value={option.idOption}
                        disabled={!isAvailable}
                      >
                        {getOptionPriceText(option)}
                        {isUnavailable && ' (Unavailable)'}
                        {option.blocked && ' (Discontinued)'}
                      </option>
                    );
                  })}
                </select>
              </>
            )}
            
            {group.optionType === 'T' && options.length > 0 && (
              <div className="space-y-2">
                <input
                  type="hidden"
                  name={`OPTidOption${group.idOptionGroup}`}
                  value={options[0].idOption}
                />
                <input
                  id={textInputId}
                  type="text"
                  name={`TXTidOption${group.idOptionGroup}`}
                  placeholder={`Enter ${group.optionGroupDesc.toLowerCase()}`}
                  maxLength={200}
                  required={group.optionReq === 'Y'}
                  aria-required={group.optionReq === 'Y'}
                  aria-describedby={descriptionId}
                  aria-label={`Enter ${group.optionGroupDesc.toLowerCase()}`}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                  onChange={(e) => {
                    // For text type options, we might want to handle this differently
                    // For now, just update the selected option
                    if (options[0]) {
                      handleOptionChange(group.idOptionGroup, options[0].idOption);
                    }
                  }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                  Maximum {200} characters
                </div>
              </div>
            )}
            
            {/* Show availability warnings with proper ARIA */}
            <div id={errorId} role="alert" aria-live="polite" aria-atomic="true">
              {selectedOptionId && options.find(opt => opt.idOption === selectedOptionId)?.blocked && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  <span className="sr-only">Error: </span>
                  This option is discontinued and no longer available.
                </p>
              )}
              {selectedOptionId && options.find(opt => opt.idOption === selectedOptionId)?.unavailable && !options.find(opt => opt.idOption === selectedOptionId)?.blocked && (
                <p className="text-sm text-orange-600 dark:text-orange-400" role="alert">
                  <span className="sr-only">Warning: </span>
                  This option is currently unavailable.
                </p>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Price adjustment display */}
      {priceAdjustment !== 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700" role="status" aria-live="polite" aria-atomic="true">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Option adjustment:</span>
            <span 
              className={`font-semibold ${priceAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              aria-label={`Price adjustment: ${priceAdjustment > 0 ? 'plus' : 'minus'} ${Math.abs(priceAdjustment).toFixed(2)}`}
            >
              {priceAdjustment > 0 ? '+' : ''}{formatPrice(priceAdjustment)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

