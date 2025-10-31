'use client';

import { useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';

// Mock water filter products
const waterFilterProducts = [
  {
    id: 201,
    name: 'Under Sink Water Filter Replacement',
    brand: 'Filters Fast',
    sku: 'FFUL-001',
    price: 24.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/water-filter-1.jpg',
    inStock: true,
    badge: 'Best Seller',
  },
  {
    id: 202,
    name: 'Whole House Water Filter Cartridge',
    brand: '3M Aqua-Pure',
    sku: '3MAP-217',
    price: 49.99,
    rating: 4.8,
    reviewCount: 645,
    image: '/images/water-filter-2.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 203,
    name: 'Reverse Osmosis Membrane',
    brand: 'APEC Water',
    sku: 'APEC-RO-75',
    price: 64.99,
    rating: 4.9,
    reviewCount: 1203,
    image: '/images/water-filter-3.jpg',
    inStock: true,
    badge: 'Top Rated',
  },
  {
    id: 204,
    name: 'Countertop Water Filter Replacement',
    brand: 'PUR',
    sku: 'PUR-RF99',
    price: 18.99,
    rating: 4.5,
    reviewCount: 567,
    image: '/images/water-filter-4.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 205,
    name: 'Inline Water Filter for Ice Maker',
    brand: 'Swift Green',
    sku: 'SGF-IM2',
    price: 34.99,
    rating: 4.6,
    reviewCount: 423,
    image: '/images/water-filter-5.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 206,
    name: 'Shower Head Water Filter',
    brand: 'Aquasana',
    sku: 'AQ-4100',
    price: 42.99,
    rating: 4.7,
    reviewCount: 789,
    image: '/images/water-filter-6.jpg',
    inStock: false,
    badge: null,
  },
  {
    id: 207,
    name: 'Sediment Pre-Filter Cartridge',
    brand: 'iSpring',
    sku: 'ISP-FP15',
    price: 12.99,
    rating: 4.4,
    reviewCount: 334,
    image: '/images/water-filter-7.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 208,
    name: 'Carbon Block Water Filter',
    brand: 'Pentek',
    sku: 'PEN-CB10',
    price: 39.99,
    rating: 4.8,
    reviewCount: 921,
    image: '/images/water-filter-8.jpg',
    inStock: true,
    badge: 'Save 15%',
  },
];

export default function WaterFiltersPage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(waterFilterProducts);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...waterFilterProducts];
    
    // Brand filter
    if (filters.brands?.length > 0) {
      filtered = filtered.filter(product => 
        filters.brands.includes(product.brand)
      );
    }
    
    // Price filter
    if (filters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange[0] && 
        product.price <= filters.priceRange[1]
      );
    }
    
    // Rating filter
    if (filters.minRating) {
      filtered = filtered.filter(product => 
        product.rating >= filters.minRating
      );
    }
    
    // In stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }
    
    setFilteredProducts(filtered);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-gray-900 transition-colors">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Water Filters</h1>
              <p className="text-brand-gray-600 dark:text-gray-300 transition-colors">Clean, pure water for your home - under sink, whole house, RO systems & more</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">{filteredProducts.length} products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              availableBrands={['Filters Fast', '3M Aqua-Pure', 'APEC Water', 'PUR', 'Swift Green', 'Aquasana', 'iSpring', 'Pentek']}
              priceRange={[0, 100]}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <ProductGrid
              products={filteredProducts}
              title="Water Filters"
            />
          </main>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12 transition-colors">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">Under Sink Filters</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Perfect for point-of-use filtration at your kitchen sink. Remove chlorine, lead, and contaminants.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">Whole House Filters</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Filter all water entering your home. Protect appliances and enjoy cleaner water from every tap.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">RO Systems</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Reverse osmosis filtration removes up to 99% of contaminants for the purest drinking water.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

