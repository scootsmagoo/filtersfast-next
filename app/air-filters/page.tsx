'use client';

import { useState, useEffect } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';
import SizeDimensionSelector from '@/components/products/SizeDimensionSelector';
import { SizeFilterProduct, CommonSize } from '@/lib/types/size-filter';
import { Ruler } from 'lucide-react';

// Mock air filter products (will be replaced with API data when size is selected)
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
  // Products from size search
  const [sizeProducts, setSizeProducts] = useState<SizeFilterProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Available dimensions and common sizes
  const [availableDimensions, setAvailableDimensions] = useState<{
    heights: number[];
    widths: number[];
    depths: number[];
  }>({ heights: [], widths: [], depths: [] });
  const [commonSizes, setCommonSizes] = useState<CommonSize[]>([]);
  
  // Current search filters
  const [currentSizeFilters, setCurrentSizeFilters] = useState<{
    height: number | null;
    width: number | null;
    depth: number | null;
  }>({ height: null, width: null, depth: null });

  // MERV rating filter (separate from sidebar)
  const [selectedMervRating, setSelectedMervRating] = useState<number | null>(null);

  // Sidebar filters
  const [sidebarFilters, setSidebarFilters] = useState<any>({});
  
  // Displayed products (either from size search or default) - use 'any' to allow both types
  const [displayedProducts, setDisplayedProducts] = useState<any[]>(airFilterProducts);
  const [filteredProducts, setFilteredProducts] = useState<any[]>(airFilterProducts);

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

  const handleSizeSearch = async (
    height: number | null,
    width: number | null,
    depth: number | null
  ) => {
    setLoading(true);
    setSearchPerformed(true);
    setCurrentSizeFilters({ height, width, depth });
    setStatusMessage('Searching for filters...');
    
    // If no dimensions selected, show default products
    if (!height && !width && !depth) {
      setSizeProducts([]);
      setDisplayedProducts(airFilterProducts);
      setFilteredProducts(airFilterProducts);
      setSidebarFilters({});
      setSelectedMervRating(null);
      setLoading(false);
      setSearchPerformed(false);
      setStatusMessage('');
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (height) params.set('height', height.toString());
      if (width) params.set('width', width.toString());
      if (depth) params.set('depth', depth.toString());
      
      const response = await fetch(`/api/filters/size?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSizeProducts(data.products);
        // Apply MERV filter if one is selected
        const productsToDisplay = selectedMervRating 
          ? data.products.filter((p: SizeFilterProduct) => p.mervRating === selectedMervRating)
          : data.products;
        setDisplayedProducts(productsToDisplay);
        setFilteredProducts(productsToDisplay);
        setSidebarFilters({}); // Reset sidebar filters
        
        // Announce results to screen readers
        const sizeLabel = `${height} by ${width} by ${depth}`;
        setStatusMessage(`Found ${productsToDisplay.length} filters for size ${sizeLabel}`);
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
      setStatusMessage('Error loading filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMervRatingSelect = (rating: number | null) => {
    setSelectedMervRating(rating);
    
    // Apply MERV filter to current products
    if (rating === null) {
      // Show all products from size search
      const allProducts = sizeProducts.length > 0 ? sizeProducts : airFilterProducts;
      setDisplayedProducts(allProducts);
      setFilteredProducts(allProducts);
      setStatusMessage(`Showing all MERV ratings. ${allProducts.length} products available.`);
    } else {
      const filtered = (sizeProducts.length > 0 ? sizeProducts : airFilterProducts).filter(
        (p) => 'mervRating' in p && p.mervRating === rating
      );
      setDisplayedProducts(filtered);
      setFilteredProducts(filtered);
      setStatusMessage(`Filtered to MERV ${rating}. ${filtered.length} products found.`);
    }
    
    // Reset sidebar filters when MERV changes
    setSidebarFilters({});
  };

  const handleSidebarFilterChange = (filters: any) => {
    setSidebarFilters(filters);
    
    // Apply filters to displayed products
    let filtered = [...displayedProducts];
    
    // Brand filter
    if (filters.brands?.length > 0) {
      filtered = filtered.filter(product => 
        filters.brands.includes(product.brand)
      );
    }
    
    // MERV rating filter
    if (filters.mervRatings?.length > 0) {
      filtered = filtered.filter(product => 
        'mervRating' in product && filters.mervRatings.includes(product.mervRating)
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
  const availableBrands = [...new Set(displayedProducts.map(p => p.brand))];

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Screen Reader Status Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-orange/10 via-brand-blue/10 to-green-50 border-b-2 border-brand-orange/20">
        <div className="container-custom py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-orange/10 mb-3">
              <Ruler className="w-6 h-6 text-brand-orange" aria-hidden="true" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 mb-2">
              Standard Air Filters
            </h1>
            <p className="text-brand-gray-700 max-w-2xl mx-auto">
              Find your perfect HVAC filter by size or browse our complete selection
            </p>
          </div>
          
          {/* Size Selector */}
          <SizeDimensionSelector
            onSearch={handleSizeSearch}
            availableDimensions={availableDimensions}
            commonSizes={commonSizes}
          />
        </div>
      </div>

      {/* MERV Rating Information Section */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-2" id="merv-section-heading">
              {searchPerformed ? 'Refine by MERV Rating' : 'Choose Your MERV Rating'}
            </h2>
            <p className="text-brand-gray-600 max-w-2xl mx-auto" id="merv-section-description">
              {searchPerformed 
                ? 'Click a MERV rating below to filter your results'
                : 'Higher MERV ratings provide better filtration for allergies and air quality'
              }
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            role="group"
            aria-labelledby="merv-section-heading"
            aria-describedby="merv-section-description"
          >
            {/* MERV 8 */}
            <button
              onClick={() => handleMervRatingSelect(selectedMervRating === 8 ? null : 8)}
              className={`bg-gray-50 border-2 rounded-lg p-6 transition-all text-left ${
                selectedMervRating === 8
                  ? 'border-brand-orange bg-brand-orange/5 shadow-lg'
                  : 'border-gray-200 hover:border-brand-orange/50 cursor-pointer'
              }`}
              disabled={!searchPerformed && sizeProducts.length === 0}
              aria-label="MERV 8 - Basic filtration. Captures 70 to 85 percent of particles. Best for basic dust and pollen protection, standard residential use, and budget-conscious homeowners."
              aria-pressed={selectedMervRating === 8}
              aria-describedby="merv-8-details"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-2xl font-bold ${selectedMervRating === 8 ? 'text-brand-orange' : 'text-gray-900'}`}>
                  MERV 8
                </span>
                <span className="text-xs font-semibold px-2 py-1 rounded text-green-600 bg-green-600/10">
                  Low Cost
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-3" id="merv-8-details">
                Basic Filtration
              </p>
              <p className="text-xs text-gray-600 mb-3">
                <span role="img" aria-label="Chart">📊</span> Captures 70-85% of particles 3-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 8 best uses">
                <p className="text-xs font-semibold text-gray-700">Best For:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Basic dust and pollen protection</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Standard residential use</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Budget-conscious homeowners</span>
                  </li>
                </ul>
              </div>
            </button>

            {/* MERV 11 */}
            <button
              onClick={() => handleMervRatingSelect(selectedMervRating === 11 ? null : 11)}
              className={`border-2 rounded-lg p-6 shadow-md relative transition-all text-left ${
                selectedMervRating === 11
                  ? 'border-brand-orange bg-brand-orange/10 shadow-xl'
                  : 'bg-brand-orange/5 border-brand-orange hover:shadow-lg cursor-pointer'
              }`}
              disabled={!searchPerformed && sizeProducts.length === 0}
              aria-label="MERV 11 - Superior allergen control. Most popular choice. Captures 85 to 95 percent of particles. Best for homes with pets or allergies, mold spores and pollen, and better air quality."
              aria-pressed={selectedMervRating === 11}
              aria-describedby="merv-11-details"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold" aria-label="Most popular choice">
                <span role="img" aria-label="Star">⭐</span> Most Popular
              </div>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <span className="text-2xl font-bold text-brand-orange">MERV 11</span>
                <span className="text-xs font-semibold px-2 py-1 rounded text-blue-600 bg-blue-600/10">
                  Medium Cost
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-3" id="merv-11-details">
                Superior Allergen Control
              </p>
              <p className="text-xs text-gray-600 mb-3">
                <span role="img" aria-label="Chart">📊</span> Captures 85-95% of particles 1-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 11 best uses">
                <p className="text-xs font-semibold text-gray-700">Best For:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Homes with pets or allergies</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Mold spores and pollen</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Better air quality</span>
                  </li>
                </ul>
              </div>
            </button>

            {/* MERV 13 */}
            <button
              onClick={() => handleMervRatingSelect(selectedMervRating === 13 ? null : 13)}
              className={`bg-purple-50 border-2 rounded-lg p-6 transition-all text-left ${
                selectedMervRating === 13
                  ? 'border-brand-orange bg-brand-orange/5 shadow-lg'
                  : 'border-purple-200 hover:border-purple-400 cursor-pointer'
              }`}
              disabled={!searchPerformed && sizeProducts.length === 0}
              aria-label="MERV 13 - Hospital-grade filtration. Premium choice. Captures 90 percent or more of particles. Best for severe allergies or asthma, bacteria and virus carriers, and maximum air quality."
              aria-pressed={selectedMervRating === 13}
              aria-describedby="merv-13-details"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-2xl font-bold ${selectedMervRating === 13 ? 'text-brand-orange' : 'text-gray-900'}`}>
                  MERV 13
                </span>
                <span className="text-xs font-semibold px-2 py-1 rounded text-purple-600 bg-purple-600/10">
                  Premium
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-3" id="merv-13-details">
                Hospital-Grade Filtration
              </p>
              <p className="text-xs text-gray-600 mb-3">
                <span role="img" aria-label="Chart">📊</span> Captures 90%+ of particles 0.3-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 13 best uses">
                <p className="text-xs font-semibold text-gray-700">Best For:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Severe allergies or asthma</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Bacteria and virus carriers</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-brand-orange mt-0.5">•</span>
                    <span>Maximum air quality</span>
                  </li>
                </ul>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            {searchPerformed ? (
              <p className="text-sm text-brand-gray-600" role="status" aria-live="polite">
                {selectedMervRating ? (
                  <>
                    <strong>Showing MERV {selectedMervRating} filters.</strong> Click the card again to show all MERV ratings.
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="Light bulb">💡</span> <strong>Tip:</strong> Click a MERV rating above to filter results, or use the sidebar for more options
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-brand-gray-600">
                <span role="img" aria-label="Light bulb">💡</span> <strong>Tip:</strong> Select a size above, then choose your preferred MERV rating to see matching filters
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      {(searchPerformed || !loading) && (
        <div className="bg-white border-b">
          <div className="container-custom py-6">
            <div className="flex items-center justify-between">
              <div>
                {searchPerformed && currentSizeFilters.height && currentSizeFilters.width && currentSizeFilters.depth ? (
                  <h2 className="text-xl font-bold text-brand-gray-900">
                    Filters for{' '}
                    <span className="text-brand-orange">
                      {currentSizeFilters.height}×{currentSizeFilters.width}×{currentSizeFilters.depth}
                    </span>
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold text-brand-gray-900">All Standard Air Filters</h2>
                )}
                <p className="text-brand-gray-600 text-sm mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-custom py-8">
        {loading ? (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange" aria-hidden="true"></div>
            <span className="sr-only">Loading, please wait. Searching for filters.</span>
            <p className="mt-4 text-brand-gray-600" aria-hidden="true">Searching for filters...</p>
          </div>
        ) : filteredProducts.length === 0 && searchPerformed ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto" role="status" aria-live="polite">
            <Ruler className="w-16 h-16 text-yellow-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
              No Filters Found for This Size
            </h3>
            <p className="text-brand-gray-700 mb-6">
              {currentSizeFilters.height && currentSizeFilters.width && currentSizeFilters.depth ? (
                <>
                  We couldn't find any filters matching{' '}
                  <strong>
                    {currentSizeFilters.height}×{currentSizeFilters.width}×{currentSizeFilters.depth}
                  </strong>
                </>
              ) : (
                'Try selecting different dimensions or choose from our popular sizes above'
              )}
            </p>
            <a
              href="/custom-air-filters"
              className="inline-block px-6 py-3 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange-dark transition-colors"
            >
              Build Custom Filter
            </a>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <FilterSidebar
                onFilterChange={handleSidebarFilterChange}
                availableBrands={availableBrands}
                priceRange={[0, 100]}
                showMervFilter={true}
              />
            </aside>

            {/* Product Grid */}
            <main className="flex-1">
              <ProductGrid
                products={filteredProducts}
                title=""
              />
            </main>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white border-t mt-12">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 mb-3">Need a Custom Size?</h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                Can't find your exact size? We can build custom air filters to your specifications.
              </p>
              <a href="/custom-air-filters" className="text-brand-orange hover:underline text-sm font-medium">Build Custom Filter →</a>
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

