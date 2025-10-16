'use client';

import { useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';

// Mock pool & spa filter products
const poolFilterProducts = [
  {
    id: 401,
    name: 'Pool Filter Cartridge - Hayward C-225',
    brand: 'Filters Fast',
    sku: 'FF-HC225',
    price: 39.99,
    rating: 4.7,
    reviewCount: 567,
    image: '/images/pool-filter-1.jpg',
    inStock: true,
    badge: 'Best Seller',
  },
  {
    id: 402,
    name: 'Spa Filter - Unicel 6CH-940',
    brand: 'Unicel',
    sku: 'UC-6CH940',
    price: 29.99,
    rating: 4.8,
    reviewCount: 423,
    image: '/images/pool-filter-2.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 403,
    name: 'Pool Filter Sand - 50 lbs',
    brand: 'HTH',
    sku: 'HTH-SAND50',
    price: 24.99,
    rating: 4.6,
    reviewCount: 289,
    image: '/images/pool-filter-3.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 404,
    name: 'DE Filter Grid Assembly',
    brand: 'Pentair',
    sku: 'PEN-GRID48',
    price: 89.99,
    rating: 4.9,
    reviewCount: 178,
    image: '/images/pool-filter-4.jpg',
    inStock: true,
    badge: 'Top Rated',
  },
  {
    id: 405,
    name: 'Hot Tub Filter - Pleatco PRB50-IN',
    brand: 'Pleatco',
    sku: 'PLT-PRB50',
    price: 34.99,
    rating: 4.8,
    reviewCount: 512,
    image: '/images/pool-filter-5.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 406,
    name: 'Intex Pool Filter Cartridge (2-Pack)',
    brand: 'Intex',
    sku: 'INT-29007-2PK',
    price: 19.99,
    rating: 4.5,
    reviewCount: 891,
    image: '/images/pool-filter-6.jpg',
    inStock: true,
    badge: 'Save 15%',
  },
  {
    id: 407,
    name: 'Pool Skimmer Sock (25-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-SOCK25',
    price: 12.99,
    rating: 4.4,
    reviewCount: 234,
    image: '/images/pool-filter-7.jpg',
    inStock: false,
    badge: null,
  },
  {
    id: 408,
    name: 'Jandy CS Pool Filter Cartridge',
    brand: 'Jandy',
    sku: 'JAN-CS100',
    price: 54.99,
    rating: 4.7,
    reviewCount: 345,
    image: '/images/pool-filter-8.jpg',
    inStock: true,
    badge: null,
  },
];

export default function PoolFiltersPage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(poolFilterProducts);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...poolFilterProducts];
    
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
    <div className="min-h-screen bg-brand-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">Pool & Spa Filters</h1>
              <p className="text-brand-gray-600">Keep your pool crystal clear with quality replacement filters</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-gray-600">{filteredProducts.length} products</p>
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
              availableBrands={['Filters Fast', 'Unicel', 'HTH', 'Pentair', 'Pleatco', 'Intex', 'Jandy']}
              priceRange={[0, 100]}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <ProductGrid
              products={filteredProducts}
              title="Pool & Spa Filters"
            />
          </main>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-t mt-12">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Pool Cartridge Filters</h3>
              <p className="text-sm text-brand-gray-600">
                Easy to clean and maintain. Perfect for in-ground and above-ground pools. Replace annually for best performance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Hot Tub & Spa Filters</h3>
              <p className="text-sm text-brand-gray-600">
                Keep your spa water clean and clear. Compatible with major brands including Sundance, Jacuzzi, and more.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Sand & DE Filters</h3>
              <p className="text-sm text-brand-gray-600">
                Premium filter media and DE grids for optimal filtration. Professional-grade quality at affordable prices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

