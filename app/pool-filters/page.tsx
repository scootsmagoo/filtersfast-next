'use client';

import { useEffect, useMemo, useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';
import PoolFilterWizard from '@/components/pool/PoolFilterWizard';
import { POOL_FILTER_CATALOG } from '@/lib/data/pool-filter-wizard';
import { PoolWizardResult } from '@/lib/types/pool-filter';

interface ActiveFilters {
  brands?: string[] | null;
  priceRange?: [number, number] | null;
  ratings?: number[] | null;
  mervRatings?: number[] | null;
  features?: string[] | null;
}

interface GridProduct {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  badges?: string[];
}

// Calculate price range from products
const calculatePriceRange = (products: GridProduct[]): [number, number] => {
  if (products.length === 0) return [0, 150];
  const prices = products.map(p => p.price || 0).filter(p => p > 0);
  if (prices.length === 0) return [0, 150];
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  return [min, max];
};

export default function PoolFiltersPage() {
  const catalog = POOL_FILTER_CATALOG;
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [wizardResult, setWizardResult] = useState<PoolWizardResult | null>(null);
  const [wizardMatches, setWizardMatches] = useState<number[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<GridProduct[]>([]);

  const brandOptions = useMemo(
    () => [...new Set(catalog.map((item) => item.brand))].sort(),
    [catalog]
  );

  const baseProducts = useMemo<GridProduct[]>(
    () =>
      catalog.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        sku: item.sku,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
        reviewCount: item.reviewCount,
        image: item.image,
        inStock: item.inStock,
        badges: item.defaultBadges,
      })),
    [catalog]
  );

  // Calculate price range from base products
  const calculatedPriceRange = useMemo(() => calculatePriceRange(baseProducts), [baseProducts]);

  const applyFilters = (filters: ActiveFilters, wizardIds: number[]) => {
    const matchSet = new Set(wizardIds);

    let filtered = baseProducts.filter((product) => {
      // OWASP: Validate and sanitize brand filter
      if (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0) {
        const validBrands = filters.brands.filter((b: any) => 
          typeof b === 'string' && b.length > 0 && b.length <= 100
        );
        if (validBrands.length > 0 && !validBrands.includes(product.brand)) {
          return false;
        }
      }

      // OWASP: Validate and sanitize price filter
      if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
        const [min, max] = filters.priceRange;
        if (typeof min === 'number' && typeof max === 'number' && 
            isFinite(min) && isFinite(max) && 
            min >= 0 && max >= 0 && min <= max) {
          if (typeof product.price !== 'number' || product.price < min || product.price > max) {
            return false;
          }
        }
      }

      // OWASP: Validate and sanitize rating filter
      if (filters.ratings && Array.isArray(filters.ratings) && filters.ratings.length > 0) {
        const validRatings = filters.ratings.filter((r: any) => 
          Number.isInteger(r) && r >= 1 && r <= 5
        );
        if (validRatings.length > 0) {
          if (typeof product.rating !== 'number' || !isFinite(product.rating)) return false;
          const matches = validRatings.some((minRating: number) => product.rating >= minRating);
          if (!matches) {
            return false;
          }
        }
      }

      // OWASP: Validate features filter (whitelist approach)
      const allowedFeatures = ['Genuine OEM', 'NSF Certified', 'Free Shipping', 'On Sale', 'In Stock'];
      if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
        const validFeatures = filters.features.filter((f: any) => 
          typeof f === 'string' && allowedFeatures.includes(f)
        );
        if (validFeatures.length > 0) {
          const matches = validFeatures.some((feature: string) => {
            switch (feature) {
              case 'Genuine OEM':
                return product.brand && !product.brand.toLowerCase().includes('filtersfast') && !product.brand.toLowerCase().includes('filters fast');
              case 'NSF Certified':
                return Array.isArray(product.badges) && product.badges.includes('NSF Certified');
              case 'Free Shipping':
                return typeof product.price === 'number' && product.price >= 50;
              case 'On Sale':
                return product.originalPrice && typeof product.price === 'number' && product.originalPrice > product.price;
              case 'In Stock':
                return product.inStock;
              default:
                return false;
            }
          });
          if (!matches) {
            return false;
          }
        }
      }

      return true;
    });

    filtered = filtered
      .map((product) => ({
        ...product,
        badges: [
          ...(product.badges ?? []),
          ...(matchSet.has(product.id) ? ['Wizard Match'] : []),
        ],
      }))
      .sort((a, b) => {
        const aMatch = matchSet.has(a.id);
        const bMatch = matchSet.has(b.id);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.rating - a.rating;
      });

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    applyFilters(filters, wizardMatches);
  };

  const handleWizardResult = (result: PoolWizardResult) => {
    setWizardResult(result);
    const matchIds = result.matches.map((match) => match.productId);
    setWizardMatches(matchIds);
    applyFilters(activeFilters, matchIds);
  };

  // Initialize filtered products on first render
  useEffect(() => {
    setFilteredProducts(baseProducts);
  }, [baseProducts]);

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-gray-900 transition-colors">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Pool & Spa Filters
              </h1>
              <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">
                Guided wizard, compatibility data, and seasonal promos to keep water perfectly clear.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                {filteredProducts.length} products
              </p>
              {wizardResult && wizardResult.matches.length > 0 && (
                <p className="text-xs text-brand-orange mt-1">
                  Wizard highlighted {wizardResult.matches.length}{' '}
                  {wizardResult.matches.length === 1 ? 'match' : 'matches'} tailored to your pool.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 space-y-8">
        <PoolFilterWizard onResult={handleWizardResult} />

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              availableBrands={brandOptions}
              priceRange={calculatedPriceRange}
              products={baseProducts}
            />
          </aside>

          <main className="flex-1">
            <ProductGrid products={filteredProducts} title="Pool & Spa Filters" />
          </main>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12 transition-colors">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Cartridge Filters
              </h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Match measurements and connector styles for guaranteed fit. Our wizard cross-references
                OEM part numbers and FiltersFast replacements automatically.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Sand & DE Systems
              </h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Size media by tank diameter and pump flow rates. Seasonal promos help you restock opening,
                mid-season, and closing supplies.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">
                Spa & Hot Tub Care
              </h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Quick-turnover spas need antimicrobial media and frequent rotations. Use the wizard to plan
                alternating cartridges and reminder schedules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

