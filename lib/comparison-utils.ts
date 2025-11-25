import { ComparisonProduct } from './comparison-context';

export interface ComparisonAttribute {
  label: string;
  key: string;
  getValue: (product: ComparisonProduct) => string | number | boolean | null | undefined;
  formatValue?: (value: string | number | boolean | null | undefined) => string;
}

/**
 * Extract all unique attribute keys from products' specifications
 */
export function extractSpecificationKeys(products: ComparisonProduct[]): string[] {
  const keys = new Set<string>();
  products.forEach(product => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach(key => keys.add(key));
    }
  });
  return Array.from(keys).sort();
}

/**
 * Get comparison attributes for products
 */
export function getComparisonAttributes(products: ComparisonProduct[]): ComparisonAttribute[] {
  const baseAttributes: ComparisonAttribute[] = [
    {
      label: 'Price',
      key: 'price',
      getValue: (p) => p.price,
      formatValue: (val) => typeof val === 'number' ? `$${val.toFixed(2)}` : 'N/A',
    },
    {
      label: 'Original Price',
      key: 'originalPrice',
      getValue: (p) => p.originalPrice,
      formatValue: (val) => typeof val === 'number' ? `$${val.toFixed(2)}` : 'N/A',
    },
    {
      label: 'Brand',
      key: 'brand',
      getValue: (p) => p.brand,
    },
    {
      label: 'SKU',
      key: 'sku',
      getValue: (p) => p.sku,
    },
    {
      label: 'Rating',
      key: 'rating',
      getValue: (p) => p.rating,
      formatValue: (val) => typeof val === 'number' ? `${val.toFixed(1)} / 5.0` : 'N/A',
    },
    {
      label: 'Reviews',
      key: 'reviewCount',
      getValue: (p) => p.reviewCount,
      formatValue: (val) => typeof val === 'number' ? val.toLocaleString() : '0',
    },
    {
      label: 'In Stock',
      key: 'inStock',
      getValue: (p) => p.inStock,
      formatValue: (val) => val === true ? 'Yes' : 'No',
    },
    {
      label: 'Category',
      key: 'category',
      getValue: (p) => p.category,
      formatValue: (val) => typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A',
    },
  ];

  // Add specification attributes
  const specKeys = extractSpecificationKeys(products);
  const specAttributes: ComparisonAttribute[] = specKeys.map(key => ({
    label: key,
    key: `spec_${key}`,
    getValue: (p) => p.specifications?.[key] || null,
  }));

  return [...baseAttributes, ...specAttributes];
}

/**
 * Format a comparison value for display
 */
export function formatComparisonValue(
  value: string | number | boolean | null | undefined,
  formatFn?: (val: string | number | boolean | null | undefined) => string
): string {
  if (formatFn) {
    return formatFn(value);
  }
  
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  return String(value);
}

/**
 * Check if all products have the same value for an attribute
 */
export function areAllValuesEqual(
  products: ComparisonProduct[],
  attribute: ComparisonAttribute
): boolean {
  if (products.length === 0) return true;
  
  const firstValue = attribute.getValue(products[0]);
  return products.every(p => {
    const value = attribute.getValue(p);
    return value === firstValue;
  });
}

/**
 * Find the best value (e.g., highest rating, lowest price)
 */
export function findBestValue(
  products: ComparisonProduct[],
  attribute: ComparisonAttribute,
  direction: 'highest' | 'lowest' = 'highest'
): ComparisonProduct | null {
  if (products.length === 0) return null;
  
  return products.reduce((best, current) => {
    const bestValue = attribute.getValue(best);
    const currentValue = attribute.getValue(current);
    
    if (bestValue === null || bestValue === undefined) return current;
    if (currentValue === null || currentValue === undefined) return best;
    
    if (typeof bestValue === 'number' && typeof currentValue === 'number') {
      return direction === 'highest' 
        ? (currentValue > bestValue ? current : best)
        : (currentValue < bestValue ? current : best);
    }
    
    return best;
  });
}

