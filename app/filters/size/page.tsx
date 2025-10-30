'use client';

import { useState, useEffect } from 'react';
import SizeDimensionSelector from '@/components/products/SizeDimensionSelector';
import ProductGrid from '@/components/products/ProductGrid';
import FilterSidebar from '@/components/products/FilterSidebar';
import { SizeFilterProduct, CommonSize } from '@/lib/types/size-filter';
import { Ruler, Package, TrendingUp, Info } from 'lucide-react';

export default function BrowseBySizePage() {
  const [products, setProducts] = useState<SizeFilterProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SizeFilterProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Available dimensions and common sizes
  const [availableDimensions, setAvailableDimensions] = useState<{
    heights: number[];
    widths: number[];
    depths: number[];
  }>({ heights: [], widths: [], depths: [] });
  const [commonSizes, setCommonSizes] = useState<CommonSize[]>([]);
  
  // Current search filters
  const [currentFilters, setCurrentFilters] = useState<{
    height: number | null;
    width: number | null;
    depth: number | null;
  }>({ height: null, width: null, depth: null });

  // Sidebar filters
  const [sidebarFilters, setSidebarFilters] = useState<any>({});

  // Load available dimensions on mount
  useEffect(() => {
    fetchAvailableDimensions();
  }, []);

  const fetchAvailableDimensions = async () => {
    try {
      const response = await fetch('/api/filters/size?getDimensions=true');
      const data = await response.json();
      
      if (data.success) {
        setAvailableDimensions(data.dimensions);
        setCommonSizes(data.commonSizes);
      }
    } catch (err) {
      console.error('Error fetching dimensions:', err);
    }
  };

  const handleSearch = async (
    height: number | null,
    width: number | null,
    depth: number | null
  ) => {
    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    setCurrentFilters({ height, width, depth });
    
    try {
      const params = new URLSearchParams();
      if (height) params.set('height', height.toString());
      if (width) params.set('width', width.toString());
      if (depth) params.set('depth', depth.toString());
      
      const response = await fetch(`/api/filters/size?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
        
        // Reset sidebar filters
        setSidebarFilters({});
      } else {
        setError(data.error || 'Failed to fetch filters');
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
      setError('Failed to load filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarFilterChange = (filters: any) => {
    setSidebarFilters(filters);
    
    // Apply filters to products
    let filtered = [...products];
    
    // Brand filter
    if (filters.brands?.length > 0) {
      filtered = filtered.filter(product => 
        filters.brands.includes(product.brand)
      );
    }
    
    // MERV rating filter
    if (filters.mervRatings?.length > 0) {
      filtered = filtered.filter(product => 
        product.mervRating && filters.mervRatings.includes(product.mervRating)
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

  // Get unique brands from current products
  const availableBrands = [...new Set(products.map(p => p.brand))];

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-orange/10 via-brand-blue/10 to-green-50 border-b-2 border-brand-orange/20">
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 mb-4">
              <Ruler className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-gray-900 mb-4">
              Browse Filters by Size
            </h1>
            <p className="text-lg text-brand-gray-700 mb-6">
              Find the perfect air filter for your HVAC system by entering exact dimensions or selecting from popular sizes
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-brand-gray-600">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-orange" />
                <span>1,000+ Sizes Available</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Same-Day Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-blue" />
                <span>MERV 8, 11, 13 Options</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Selector Section */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <SizeDimensionSelector
            onSearch={handleSearch}
            availableDimensions={availableDimensions}
            commonSizes={commonSizes}
          />
        </div>
      </div>

      {/* Results Section */}
      {searchPerformed && (
        <div className="container-custom py-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
              <p className="mt-4 text-brand-gray-600">Searching for filters...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold mb-2">Error Loading Filters</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <Ruler className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                No Filters Found for This Size
              </h3>
              <p className="text-brand-gray-700 mb-6">
                {currentFilters.height && currentFilters.width && currentFilters.depth ? (
                  <>
                    We couldn't find any filters matching{' '}
                    <strong>
                      {currentFilters.height}×{currentFilters.width}×{currentFilters.depth}
                    </strong>
                  </>
                ) : (
                  'Try selecting different dimensions or choose from our popular sizes above'
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/air-filters"
                  className="px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange-dark transition-colors"
                >
                  Browse All Filters
                </a>
                <a
                  href="/custom-air-filters"
                  className="px-6 py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-dark transition-colors"
                >
                  Build Custom Filter
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-brand-gray-900">
                  {currentFilters.height && currentFilters.width && currentFilters.depth ? (
                    <>
                      Filters for{' '}
                      <span className="text-brand-orange">
                        {currentFilters.height}×{currentFilters.width}×{currentFilters.depth}
                      </span>
                    </>
                  ) : (
                    'All Filters'
                  )}
                </h2>
                <p className="text-brand-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>

              {/* Main Content Grid */}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                {products.length > 0 && (
                  <aside className="lg:w-64 flex-shrink-0">
                    <FilterSidebar
                      onFilterChange={handleSidebarFilterChange}
                      availableBrands={availableBrands}
                      priceRange={[0, 100]}
                      showMervFilter={true}
                    />
                  </aside>
                )}

                {/* Product Grid */}
                <main className="flex-1">
                  <ProductGrid
                    products={filteredProducts}
                    title=""
                  />
                </main>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Section (shown when no search performed) */}
      {!searchPerformed && (
        <div className="container-custom py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ruler className="w-8 h-8 text-brand-orange" />
                </div>
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  Exact Size Match
                </h3>
                <p className="text-sm text-brand-gray-600">
                  Enter your filter's exact dimensions to find perfect replacements with precise fits
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  All MERV Ratings
                </h3>
                <p className="text-sm text-brand-gray-600">
                  Choose from MERV 8, 11, or 13 ratings to match your air quality needs
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-brand-blue" />
                </div>
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  Fast Shipping
                </h3>
                <p className="text-sm text-brand-gray-600">
                  Free shipping on orders $50+, with same-day processing on in-stock items
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Content Section */}
      <div className="bg-white border-t">
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
              How to Find Your Filter Size
            </h2>
            <p className="text-brand-gray-700 mb-6">
              Finding the right air filter size is crucial for your HVAC system's efficiency and your home's air quality. 
              The size is typically printed on the cardboard frame of your current filter in a format like "16x20x1" 
              which represents Height × Width × Depth in inches.
            </p>
            
            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Common Filter Sizes
            </h3>
            <p className="text-brand-gray-700 mb-4">
              The most popular air filter sizes include 16x20x1, 16x25x1, 20x20x1, 20x25x1, and 14x20x1. 
              These standard sizes fit the majority of residential HVAC systems. If you have a media air cleaner 
              or whole-house air purifier, you may need a 4-inch or 5-inch deep filter.
            </p>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              MERV Ratings Explained
            </h3>
            <ul className="list-disc pl-6 text-brand-gray-700 space-y-2 mb-6">
              <li>
                <strong>MERV 8:</strong> Basic filtration for dust, pollen, and large particles. 
                Ideal for standard residential use.
              </li>
              <li>
                <strong>MERV 11:</strong> Better filtration that captures pet dander, mold spores, 
                and smaller allergens. Recommended for homes with pets or mild allergies.
              </li>
              <li>
                <strong>MERV 13:</strong> Premium filtration that captures bacteria, smoke, and even 
                virus carriers. Best for allergy sufferers, asthma, or those seeking maximum air quality.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
              Why Buy From FiltersFast?
            </h3>
            <ul className="list-disc pl-6 text-brand-gray-700 space-y-2">
              <li>Made in USA with premium materials</li>
              <li>365-day return policy - industry's best</li>
              <li>Free shipping on orders over $50</li>
              <li>Subscribe & Save up to 10%</li>
              <li>Same-day processing on in-stock orders</li>
              <li>Expert customer support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

