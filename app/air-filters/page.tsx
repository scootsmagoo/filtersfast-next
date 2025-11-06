'use client';

import { useState, useEffect } from 'react';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';
import SizeDimensionSelector from '@/components/products/SizeDimensionSelector';
import { SizeFilterProduct, CommonSize } from '@/lib/types/size-filter';
import { Ruler } from 'lucide-react';

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
  
  // Displayed products (from database)
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load available dimensions and products on mount
  useEffect(() => {
    fetchAvailableDimensions();
    loadAirFilters();
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

  const loadAirFilters = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products?type=air-filter&limit=100');
      const data = await response.json();
      
      if (data.success && data.products) {
        // Convert database products to display format
        const formattedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          sku: p.sku,
          price: p.price,
          originalPrice: p.compareAtPrice,
          rating: p.rating || 4.5,
          reviewCount: p.reviewCount || 0,
          image: p.primaryImage || '/images/air-filter-1.jpg',
          inStock: p.inventoryQuantity > 0 || !p.trackInventory,
          badge: p.isBestSeller ? 'Best Seller' : p.isFeatured ? 'Featured' : p.isNew ? 'New' : null,
          mervRating: p.mervRating,
        }));
        
        setDisplayedProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      }
    } catch (err) {
      console.error('Error loading air filters:', err);
    } finally {
      setLoadingProducts(false);
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
    
    // If no dimensions selected, reload default products
    if (!height && !width && !depth) {
      setSizeProducts([]);
      setSearchPerformed(false);
      setSidebarFilters({});
      setSelectedMervRating(null);
      setLoading(false);
      setStatusMessage('');
      // Reload default products
      loadAirFilters();
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
      // Show all products from size search or default
      const allProducts = sizeProducts.length > 0 ? sizeProducts : displayedProducts;
      setDisplayedProducts(allProducts);
      setFilteredProducts(allProducts);
      setStatusMessage(`Showing all MERV ratings. ${allProducts.length} products available.`);
    } else {
      const sourceProducts = sizeProducts.length > 0 ? sizeProducts : displayedProducts;
      const filtered = sourceProducts.filter((p: any) => {
        if (!('mervRating' in p)) return false;
        // Handle MERV rating matching (could be string like "13" or number)
        const pRating = typeof p.mervRating === 'string' ? parseInt(p.mervRating) : p.mervRating;
        return pRating === rating;
      });
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
    <div className="min-h-screen bg-brand-gray-50 dark:bg-gray-900 transition-colors">
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
      <div className="bg-gradient-to-br from-brand-orange/10 via-brand-blue/10 to-green-50 dark:from-brand-orange/20 dark:via-brand-blue/20 dark:to-gray-800 border-b-2 border-brand-orange/20 dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Standard Air Filters
            </h1>
            <p className="text-brand-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
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
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="container-custom py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors" id="merv-section-heading">
              {searchPerformed ? 'Refine by MERV Rating' : 'Choose Your MERV Rating'}
            </h2>
            <p className="text-brand-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors" id="merv-section-description">
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
              className={`bg-gray-50 dark:bg-gray-700 border-2 rounded-lg p-6 transition-all text-left ${
                selectedMervRating === 8
                  ? 'border-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-brand-orange/50 cursor-pointer'
              }`}
              disabled={!searchPerformed && sizeProducts.length === 0}
              aria-label="MERV 8 - Basic filtration. Captures 70 to 85 percent of particles. Best for basic dust and pollen protection, standard residential use, and budget-conscious homeowners."
              aria-pressed={selectedMervRating === 8}
              aria-describedby="merv-8-details"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-2xl font-bold ${selectedMervRating === 8 ? 'text-brand-orange' : 'text-gray-900 dark:text-gray-100'} transition-colors`}>
                  MERV 8
                </span>
                <span className="text-xs font-semibold px-2 py-1 rounded text-green-600 bg-green-600/10">
                  Low Cost
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-3 transition-colors" id="merv-8-details">
                Basic Filtration
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 transition-colors">
                <span role="img" aria-label="Chart">📊</span> Captures 70-85% of particles 3-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 8 best uses">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors">Best For:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 transition-colors">
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
                  ? 'border-brand-orange bg-brand-orange/10 dark:bg-brand-orange/20 shadow-xl'
                  : 'bg-brand-orange/5 dark:bg-brand-orange/10 border-brand-orange hover:shadow-lg cursor-pointer'
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
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-3 transition-colors" id="merv-11-details">
                Superior Allergen Control
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 transition-colors">
                <span role="img" aria-label="Chart">📊</span> Captures 85-95% of particles 1-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 11 best uses">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors">Best For:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 transition-colors">
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
              className={`bg-purple-50 dark:bg-purple-900/20 border-2 rounded-lg p-6 transition-all text-left ${
                selectedMervRating === 13
                  ? 'border-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10 shadow-lg'
                  : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer'
              }`}
              disabled={!searchPerformed && sizeProducts.length === 0}
              aria-label="MERV 13 - Hospital-grade filtration. Premium choice. Captures 90 percent or more of particles. Best for severe allergies or asthma, bacteria and virus carriers, and maximum air quality."
              aria-pressed={selectedMervRating === 13}
              aria-describedby="merv-13-details"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-2xl font-bold ${selectedMervRating === 13 ? 'text-brand-orange' : 'text-gray-900 dark:text-gray-100'} transition-colors`}>
                  MERV 13
                </span>
                <span className="text-xs font-semibold px-2 py-1 rounded text-purple-600 bg-purple-600/10">
                  Premium
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-3 transition-colors" id="merv-13-details">
                Hospital-Grade Filtration
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 transition-colors">
                <span role="img" aria-label="Chart">📊</span> Captures 90%+ of particles 0.3-10 microns
              </p>
              <div className="space-y-1" aria-label="MERV 13 best uses">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors">Best For:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 transition-colors">
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
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
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
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                <span role="img" aria-label="Light bulb">💡</span> <strong>Tip:</strong> Select a size above, then choose your preferred MERV rating to see matching filters
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      {(searchPerformed || !loading) && (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
          <div className="container-custom py-6">
            <div className="flex items-center justify-between">
              <div>
                {searchPerformed && currentSizeFilters.height && currentSizeFilters.width && currentSizeFilters.depth ? (
                  <h2 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">
                    Filters for{' '}
                    <span className="text-brand-orange">
                      {currentSizeFilters.height}×{currentSizeFilters.width}×{currentSizeFilters.depth}
                    </span>
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 transition-colors">All Standard Air Filters</h2>
                )}
                <p className="text-brand-gray-600 dark:text-gray-300 text-sm mt-1 transition-colors">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container-custom py-8">
        {loading || loadingProducts ? (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange" aria-hidden="true"></div>
            <span className="sr-only">Loading, please wait. Searching for filters.</span>
            <p className="mt-4 text-brand-gray-600 dark:text-gray-300 transition-colors" aria-hidden="true">Searching for filters...</p>
          </div>
        ) : filteredProducts.length === 0 && searchPerformed ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-8 text-center max-w-2xl mx-auto transition-colors" role="status" aria-live="polite">
            <Ruler className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4 transition-colors" aria-hidden="true" />
            <h3 className="text-xl font-bold text-brand-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Filters Found for This Size
            </h3>
            <p className="text-brand-gray-700 dark:text-gray-300 mb-6 transition-colors">
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
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12 transition-colors">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">Need a Custom Size?</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 mb-3 transition-colors">
                Can't find your exact size? We can build custom air filters to your specifications.
              </p>
              <a href="/custom-air-filters" className="text-brand-orange hover:underline text-sm font-medium">Build Custom Filter →</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">MERV Ratings Explained</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 transition-colors">
                <strong>MERV 8:</strong> Basic filtration<br/>
                <strong>MERV 11:</strong> Better allergen capture<br/>
                <strong>MERV 13:</strong> Best for allergies & pets
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-gray-100 mb-3 transition-colors">Subscribe & Save</h3>
              <p className="text-sm text-brand-gray-600 dark:text-gray-300 mb-3 transition-colors">
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

