'use client';

import { useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';

// Mock sale products
const saleProducts = [
  {
    id: 601,
    name: 'EDR3RXD1 Refrigerator Filter',
    brand: 'Whirlpool',
    sku: 'WHR-EDR3',
    price: 29.99,
    rating: 4.9,
    reviewCount: 3421,
    image: '/images/fridge-filter-1.jpg',
    inStock: true,
    badge: 'Save 30%',
  },
  {
    id: 602,
    name: '16x25x1 MERV 11 (12-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-1625-12',
    price: 54.99,
    rating: 4.8,
    reviewCount: 1892,
    image: '/images/air-filter-1.jpg',
    inStock: true,
    badge: 'Save 25%',
  },
  {
    id: 603,
    name: 'Pool Filter Cartridge Bundle',
    brand: 'Filters Fast',
    sku: 'FF-POOL-BDL',
    price: 69.99,
    rating: 4.7,
    reviewCount: 456,
    image: '/images/pool-filter-1.jpg',
    inStock: true,
    badge: 'Save 20%',
  },
  {
    id: 604,
    name: 'LT700P Refrigerator Filter (3-Pack)',
    brand: 'LG',
    sku: 'LG-LT700P-3',
    price: 79.99,
    rating: 4.8,
    reviewCount: 2134,
    image: '/images/fridge-filter-2.jpg',
    inStock: true,
    badge: 'Save 35%',
  },
  {
    id: 605,
    name: 'Aprilaire 35 Filter (6-Pack)',
    brand: 'Aprilaire',
    sku: 'APR-35-6',
    price: 89.99,
    rating: 4.9,
    reviewCount: 892,
    image: '/images/humidifier-filter-1.jpg',
    inStock: true,
    badge: 'Save 15%',
  },
  {
    id: 606,
    name: 'Under Sink Filter System',
    brand: 'Filters Fast',
    sku: 'FF-US-SYS',
    price: 149.99,
    rating: 4.8,
    reviewCount: 567,
    image: '/images/water-filter-1.jpg',
    inStock: true,
    badge: 'Clearance',
  },
  {
    id: 607,
    name: '20x25x1 MERV 13 (6-Pack)',
    brand: 'Filtrete',
    sku: 'FIL-2025-6',
    price: 44.99,
    rating: 4.9,
    reviewCount: 1678,
    image: '/images/air-filter-2.jpg',
    inStock: true,
    badge: 'Save 20%',
  },
  {
    id: 608,
    name: 'DA29-00020B Samsung Filter (2-Pack)',
    brand: 'Samsung',
    sku: 'SAM-DA29-2',
    price: 59.99,
    rating: 4.7,
    reviewCount: 1234,
    image: '/images/fridge-filter-3.jpg',
    inStock: false,
    badge: 'Save 25%',
  },
];

export default function SalePage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(saleProducts);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...saleProducts];
    
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
      <div className="bg-gradient-to-r from-brand-orange to-red-600 text-white">
        <div className="container-custom py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3">🔥 Limited Time Sale 🔥</h1>
            <p className="text-xl mb-2">Save up to 35% on premium filters</p>
            <p className="text-sm opacity-90">While supplies last • Free shipping on orders $99+</p>
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
              availableBrands={['Whirlpool', 'Filters Fast', 'LG', 'Aprilaire', 'Filtrete', 'Samsung']}
              priceRange={[0, 200]}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-700 rounded-lg p-4 mb-6 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1 transition-colors">⏰ Sale Ends Soon!</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 transition-colors">These deals won't last long. Stock up and save today!</p>
                </div>
              </div>
            </div>
            
            <ProductGrid
              products={filteredProducts}
              title="Sale Products"
            />
          </main>
        </div>
      </div>

      {/* Promotional Sections */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12 transition-colors">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Bulk Discounts</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Save even more when you buy multi-packs. Perfect for stocking up!
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Clearance Items</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                Final clearance on select products. Get them before they're gone!
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">Limited Time Only</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                These special prices won't last. Shop now to lock in your savings!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

