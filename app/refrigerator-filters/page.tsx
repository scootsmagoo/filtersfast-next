'use client';

import { useState, useMemo } from 'react';
import ProductGrid from '@/components/products/ProductGrid';
import FilterSidebar from '@/components/products/FilterSidebar';

// Mock product data (would come from API/database in production)
const products = [
  {
    id: 1,
    name: 'GE MWF Refrigerator Water Filter',
    brand: 'GE',
    sku: 'MWF',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewCount: 1247,
    image: '/products/ge-mwf.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
  },
  {
    id: 2,
    name: 'Whirlpool EDR1RXD1 Water Filter',
    brand: 'Whirlpool',
    sku: 'EDR1RXD1',
    price: 44.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/products/whirlpool-edr1rxd1.jpg',
    inStock: true,
    badges: ['genuine'],
  },
  {
    id: 3,
    name: 'LG LT700P Refrigerator Water Filter',
    brand: 'LG',
    sku: 'LT700P',
    price: 42.99,
    originalPrice: 54.99,
    rating: 4.9,
    reviewCount: 2103,
    image: '/products/lg-lt700p.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
  },
  {
    id: 4,
    name: 'Samsung DA29-00020B Water Filter',
    brand: 'Samsung',
    sku: 'DA29-00020B',
    price: 38.99,
    rating: 4.6,
    reviewCount: 734,
    image: '/products/samsung-da29.jpg',
    inStock: true,
  },
  {
    id: 5,
    name: 'FiltersFast FF-100 Compatible Filter',
    brand: 'FiltersFast',
    sku: 'FF-100',
    price: 24.99,
    originalPrice: 39.99,
    rating: 4.7,
    reviewCount: 1456,
    image: '/products/ff-100.jpg',
    inStock: true,
    badges: ['sale', 'value'],
  },
  {
    id: 6,
    name: 'Frigidaire WF3CB PureSource 3 Filter',
    brand: 'Frigidaire',
    sku: 'WF3CB',
    price: 47.99,
    rating: 4.8,
    reviewCount: 623,
    image: '/products/frigidaire-wf3cb.jpg',
    inStock: true,
    badges: ['genuine'],
  },
];

export default function RefrigeratorFiltersPage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Calculate price range from products
  const calculatedPriceRange = useMemo(() => {
    const prices = products.map(p => p.price || 0).filter(p => p > 0);
    if (prices.length === 0) return [0, 100];
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return [min, max];
  }, []);

  // Get unique brands from products
  const availableBrands = useMemo(() => {
    return [...new Set(products.map(p => p.brand))];
  }, []);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...products];
    
    // OWASP: Validate and sanitize brand filter
    if (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0) {
      const validBrands = filters.brands.filter((b: any) => 
        typeof b === 'string' && b.length > 0 && b.length <= 100
      );
      if (validBrands.length > 0) {
        filtered = filtered.filter(product => 
          validBrands.includes(product.brand)
        );
      }
    }
    
    // OWASP: Validate and sanitize price filter
    if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
      const [min, max] = filters.priceRange;
      if (typeof min === 'number' && typeof max === 'number' && 
          isFinite(min) && isFinite(max) && 
          min >= 0 && max >= 0 && min <= max) {
        filtered = filtered.filter(product => 
          typeof product.price === 'number' &&
          product.price >= min && 
          product.price <= max
        );
      }
    }
    
    // OWASP: Validate and sanitize rating filter
    if (filters.ratings && Array.isArray(filters.ratings) && filters.ratings.length > 0) {
      const validRatings = filters.ratings.filter((r: any) => 
        Number.isInteger(r) && r >= 1 && r <= 5
      );
      if (validRatings.length > 0) {
        filtered = filtered.filter(product => {
          if (typeof product.rating !== 'number' || !isFinite(product.rating)) return false;
          return validRatings.some((minRating: number) => product.rating >= minRating);
        });
      }
    }
    
    // OWASP: Validate features filter (whitelist approach)
    const allowedFeatures = ['Genuine OEM', 'NSF Certified', 'Free Shipping', 'On Sale', 'In Stock'];
    if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
      const validFeatures = filters.features.filter((f: any) => 
        typeof f === 'string' && allowedFeatures.includes(f)
      );
      if (validFeatures.length > 0) {
        filtered = filtered.filter(product => {
          return validFeatures.some((feature: string) => {
            switch (feature) {
              case 'Genuine OEM':
                return product.brand && !product.brand.toLowerCase().includes('filtersfast') && !product.brand.toLowerCase().includes('filters fast');
              case 'NSF Certified':
                return product.nsfCertified || product.attributes?.certifications?.includes('NSF');
              case 'Free Shipping':
                return product.freeShipping || (typeof product.price === 'number' && product.price >= 50);
              case 'On Sale':
                return product.originalPrice && typeof product.price === 'number' && product.originalPrice > product.price;
              case 'In Stock':
                return product.inStock;
              default:
                return false;
            }
          });
        });
      }
    }
    
    setFilteredProducts(filtered);
  };

  return (
    <div className="bg-brand-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-brand-gray-200 dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Refrigerator Water Filters
            </h1>
            <p className="text-lg text-brand-gray-600 dark:text-gray-100 transition-colors">
              Premium replacement water filters for all major refrigerator brands. 
              Genuine OEM and compatible options with free shipping on orders $99+.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 border-b border-brand-gray-200 dark:border-gray-700 transition-colors">
        <div className="container-custom py-3">
          <nav className="flex text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
            <a href="/" className="hover:text-brand-orange transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="text-brand-gray-900 dark:text-gray-100 font-medium transition-colors">Refrigerator Water Filters</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              availableBrands={availableBrands}
              priceRange={calculatedPriceRange}
              products={products}
            />
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            <ProductGrid products={filteredProducts} />
          </main>
        </div>
      </div>
    </div>
  );
}

