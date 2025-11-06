'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, Star, ShoppingCart } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { SearchResponse, SearchResult } from '@/lib/types';
import { Price } from '@/components/products/Price';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dispatch } = useCart();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    minRating: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, pageNum: number = 1) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: pageNum.toString(),
          limit: '20',
          ...(filters.category && { category: filters.category }),
          ...(filters.brand && { brand: filters.brand }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
          ...(filters.inStock && { inStock: 'true' }),
          ...(filters.minRating && { minRating: filters.minRating })
        });

        const response = await fetch(`/api/search?${params}`);
        const data: SearchResponse = await response.json();
        
        // Debug: Log first result to verify productId is present
        if (data.results.length > 0) {
          const firstResult = data.results[0].product;
          console.log('[Search Page] First search result received:', {
            id: firstResult.id,
            productId: firstResult.productId,
            productIdType: typeof firstResult.productId,
            hasProductId: !!firstResult.productId,
            name: firstResult.name,
            fullProductKeys: Object.keys(firstResult),
            fullProduct: JSON.stringify(firstResult, null, 2)
          });
          
          // Alert if productId is missing for database products
          if (!firstResult.productId && typeof firstResult.id === 'number' && firstResult.id > 1000) {
            console.error('[Search Page] ERROR: productId is missing! This will cause 404 errors.', firstResult);
          }
        }
        
        setResults(data.results);
        setTotal(data.total);
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters]
  );

  // Load suggestions
  const loadSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    }, 200),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setPage(1);
    
    if (value.trim()) {
      loadSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    debouncedSearch(query, 1);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    debouncedSearch(suggestion, 1);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
    debouncedSearch(query, 1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      minRating: ''
    });
    setPage(1);
  };

  // Load more results
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    debouncedSearch(query, nextPage);
  };

  // Add to cart
  const handleAddToCart = (product: any) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        image: product.image
      }
    });
  };

  // Initial search
  useEffect(() => {
    if (query) {
      debouncedSearch(query, 1);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-6">
        {/* Search Header */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search by part #, brand, or product..."
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white p-2 rounded hover:bg-brand-orange-dark transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Results Summary */}
          {query && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                {loading ? 'Searching...' : `${total} results for "${query}"`}
              </p>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <option value="">All Categories</option>
                    <option value="refrigerator">Refrigerator Filters</option>
                    <option value="water">Water Filters</option>
                    <option value="air">Air Filters</option>
                    <option value="pool">Pool Filters</option>
                    <option value="humidifier">Humidifier Filters</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    placeholder="Enter brand name"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* In Stock Filter */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">In Stock Only</span>
                  </label>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.8">4.8+ Stars</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button onClick={clearFilters} variant="outline" className="flex-1">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors">Searching...</p>
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 transition-colors">No results found for "{query}"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => {
                  // CRITICAL: Use productId if available (string ID from database), otherwise use numeric id
                  // The API returns productId: "prod-1762456823138-11r0fq" for database products
                  // We MUST use this instead of the numeric id to avoid 404 errors
                  
                  const product = result.product;
                  
                  // ALWAYS prefer productId over numeric id for database products
                  // The API returns productId: "prod-xxx" for database products
                  // Check if productId exists - it should be a string like "prod-1762456823138-11r0fq"
                  let productLinkId: string;
                  
                  if (product.productId && typeof product.productId === 'string') {
                    // Use the string productId from database
                    productLinkId = product.productId;
                  } else {
                    // Fallback to numeric id (for mock/legacy products)
                    productLinkId = String(product.id);
                  }
                  
                  // Debug logging - verify what we're using
                  if (product.name?.toLowerCase().includes('fart')) {
                    console.log('🔍 [FART PRODUCT] Link generation:', {
                      'product.productId': product.productId,
                      'product.id': product.id,
                      'productLinkId (WILL USE THIS)': productLinkId,
                      'Final URL': `/products/${productLinkId}`
                    });
                  }
                  
                  return (
                  <Card key={result.product.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                        <img
                          src={result.product.image}
                          alt={result.product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <a 
                              href={`/products/${productLinkId}`}
                              className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-orange cursor-pointer block transition-colors"
                            >
                              {result.product.name}
                            </a>
                            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                              {result.product.brand} • SKU: {result.product.sku}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                              {result.product.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-brand-orange">
                              <Price 
                                amountUSD={result.product.price}
                                originalPrice={result.product.originalPrice}
                                showCurrency
                              />
                            </div>
                          </div>
                        </div>

                        {/* Rating and Reviews */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(result.product.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                } transition-colors`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                            {result.product.rating} ({result.product.reviewCount} reviews)
                          </span>
                        </div>

                        {/* Match Info */}
                        <div className="mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            Matched: {result.matchedFields.join(', ')} • 
                            Type: {result.matchType} • 
                            Score: {result.score}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-4">
                          <Button
                            onClick={() => handleAddToCart(result.product)}
                            disabled={!result.product.inStock}
                            className="flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {result.product.inStock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                  );
                })}

                {/* Load More Button */}
                {results.length < total && (
                  <div className="text-center mt-8">
                    <Button onClick={loadMore} variant="outline">
                      Load More Results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
