'use client';

import { useState } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';

// Mock humidifier filter products
const humidifierFilterProducts = [
  {
    id: 501,
    name: 'Aprilaire 35 Humidifier Filter',
    brand: 'Aprilaire',
    sku: 'APR-35',
    price: 16.99,
    rating: 4.8,
    reviewCount: 1234,
    image: '/images/humidifier-filter-1.jpg',
    inStock: true,
    badge: 'Best Seller',
  },
  {
    id: 502,
    name: 'Honeywell HW HC-14 Replacement Filter',
    brand: 'Honeywell',
    sku: 'HON-HC14',
    price: 14.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/humidifier-filter-2.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 503,
    name: 'Essick Air HDC-12 Humidifier Wick',
    brand: 'Essick Air',
    sku: 'ESS-HDC12',
    price: 11.99,
    rating: 4.6,
    reviewCount: 567,
    image: '/images/humidifier-filter-3.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 504,
    name: 'GeneralAire 990-13 Evaporator Pad',
    brand: 'GeneralAire',
    sku: 'GA-99013',
    price: 18.99,
    rating: 4.9,
    reviewCount: 423,
    image: '/images/humidifier-filter-4.jpg',
    inStock: true,
    badge: 'Top Rated',
  },
  {
    id: 505,
    name: 'Aprilaire 600 Humidifier Filter (2-Pack)',
    brand: 'Aprilaire',
    sku: 'APR-600-2PK',
    price: 32.99,
    rating: 4.8,
    reviewCount: 678,
    image: '/images/humidifier-filter-5.jpg',
    inStock: true,
    badge: 'Save 20%',
  },
  {
    id: 506,
    name: 'BestAir CB41 Humidifier Pad',
    brand: 'BestAir',
    sku: 'BA-CB41',
    price: 9.99,
    rating: 4.5,
    reviewCount: 345,
    image: '/images/humidifier-filter-6.jpg',
    inStock: false,
    badge: null,
  },
  {
    id: 507,
    name: 'Carrier HUMCCSBP2317 Water Panel',
    brand: 'Carrier',
    sku: 'CAR-2317',
    price: 19.99,
    rating: 4.7,
    reviewCount: 512,
    image: '/images/humidifier-filter-7.jpg',
    inStock: true,
    badge: null,
  },
  {
    id: 508,
    name: 'Lennox X6670 Healthy Climate Filter',
    brand: 'Lennox',
    sku: 'LEN-X6670',
    price: 24.99,
    rating: 4.8,
    reviewCount: 789,
    image: '/images/humidifier-filter-8.jpg',
    inStock: true,
    badge: null,
  },
];

export default function HumidifierFiltersPage() {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [filteredProducts, setFilteredProducts] = useState(humidifierFilterProducts);

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
    
    // Apply filters
    let filtered = [...humidifierFilterProducts];
    
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
              <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">Humidifier Filters</h1>
              <p className="text-brand-gray-600">Maintain healthy humidity levels with quality replacement filters</p>
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
              availableBrands={['Aprilaire', 'Honeywell', 'Essick Air', 'GeneralAire', 'BestAir', 'Carrier', 'Lennox']}
              priceRange={[0, 50]}
            />
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <ProductGrid
              products={filteredProducts}
              title="Humidifier Filters"
            />
          </main>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-t mt-12">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Why Replace Humidifier Filters?</h3>
              <p className="text-sm text-brand-gray-600">
                Regular replacement ensures optimal humidity output, prevents mineral buildup, and maintains clean air quality. Replace every 6-12 months.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Compatible Brands</h3>
              <p className="text-sm text-brand-gray-600">
                We carry filters for all major brands including Aprilaire, Honeywell, Carrier, Lennox, GeneralAire, and more. Find your exact model number.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Subscribe & Save</h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                Get automatic filter deliveries on your schedule. Never miss a replacement and save up to 10%.
              </p>
              <a href="/auto-delivery" className="text-brand-orange hover:underline text-sm font-medium">Learn More →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

