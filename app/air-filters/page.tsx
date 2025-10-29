'use client';

import { useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';
import CustomFilterBuilder from '@/components/custom-filters/CustomFilterBuilder';

// Mock air filter products
const airFilterProducts = [
  {
    id: 301,
    name: '16x25x1 MERV 11 Air Filter',
    brand: 'Filters Fast',
    sku: 'FF-1625-M11',
    price: 12.99,
    rating: 4.8,
    reviewCount: 2145,
    image: '/images/air-filter-1.jpg',
    inStock: true,
    badge: 'Best Value',
  },
  {
    id: 302,
    name: '20x20x1 MERV 13 Pleated Filter',
    brand: '3M Filtrete',
    sku: '3M-2020-M13',
    price: 18.99,
    rating: 4.9,
    reviewCount: 3234,
    image: '/images/air-filter-2.jpg',
    inStock: true,
    badge: 'Top Rated',
  },
  {
    id: 303,
    name: '14x20x1 MERV 8 Filter (6-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-1420-M8-6PK',
    price: 34.99,
    rating: 4.7,
    reviewCount: 1567,
    image: '/images/air-filter-3.jpg',
    inStock: true,
    badge: 'Save 20%',
  },
  {
    id: 304,
    name: '16x25x4 MERV 11 Pleated',
    brand: 'Honeywell',
    sku: 'HON-1625-M11',
    price: 24.99,
    rating: 4.8,
    reviewCount: 892,
    image: '/images/air-filter-4.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 305,
    name: '20x25x1 MERV 13 Allergen Filter',
    brand: 'Filtrete',
    sku: 'FIL-2025-M13',
    price: 16.99,
    rating: 4.9,
    reviewCount: 2789,
    image: '/images/air-filter-5.jpg',
    inStock: true,
    badge: 'Best Seller',
  },
  {
    id: 306,
    name: '16x20x1 MERV 11 Pleated (12-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-1620-M11-12PK',
    price: 69.99,
    rating: 4.8,
    reviewCount: 1234,
    image: '/images/air-filter-6.jpg',
    inStock: true,
    badge: 'Save 25%',
  },
  {
    id: 307,
    name: '24x24x1 MERV 8 Pleated Filter',
    brand: 'Nordic Pure',
    sku: 'NP-2424-M8',
    price: 14.99,
    rating: 4.6,
    reviewCount: 678,
    image: '/images/air-filter-7.jpg',
    inStock: false,
    badge: null,
  },
  {
    id: 308,
    name: '20x20x4 MERV 13 Deep Pleated',
    brand: 'Aprilaire',
    sku: 'APR-2020-M13',
    price: 32.99,
    rating: 4.9,
    reviewCount: 1456,
    image: '/images/air-filter-8.jpg',
    inStock: true,
    badge: null,
  },
];

export default function AirFiltersPage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(airFilterProducts);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...airFilterProducts];
    
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
      {/* Custom Filter Builder Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 border-b-2 border-green-200 py-12">
        <div className="container-custom">
          <CustomFilterBuilder />
        </div>
      </section>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">Standard Air Filters</h1>
              <p className="text-brand-gray-600">Browse our selection of standard-size HVAC filters - MERV 8, 11, 13 ratings available</p>
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
              availableBrands={['Filters Fast', '3M Filtrete', 'Honeywell', 'Filtrete', 'Nordic Pure', 'Aprilaire']}
              priceRange={[0, 100]}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <ProductGrid
              products={filteredProducts}
              title="Air Filters"
            />
          </main>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-t mt-12">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Find Your Size</h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                Can't find your filter size? Use our size selector to find the perfect fit for your HVAC system.
              </p>
              <a href="/" className="text-brand-orange hover:underline text-sm font-medium">Size Finder Tool →</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">MERV Ratings Explained</h3>
              <p className="text-sm text-brand-gray-600">
                <strong>MERV 8:</strong> Basic filtration<br/>
                <strong>MERV 11:</strong> Better allergen capture<br/>
                <strong>MERV 13:</strong> Best for allergies & pets
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Subscribe & Save</h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                Never forget to change your filter again. Get automatic deliveries and save up to 10%.
              </p>
              <a href="/auto-delivery" className="text-brand-orange hover:underline text-sm font-medium">Learn More →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

