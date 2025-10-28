'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, Star, ShoppingCart } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { SearchResponse, SearchResult } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function SearchPage() {
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
    <div className="min-h-screen bg-gray-50">
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
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
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
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
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
              <p className="text-gray-600">
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
            <div className="w-64 bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    placeholder="Enter brand name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* In Stock Filter */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                <p className="mt-2 text-gray-600">Searching...</p>
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="text-center py-8">
                <p className="text-gray-600">No results found for "{query}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.product.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
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
                              href={`/products/${result.product.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-brand-orange cursor-pointer block"
                            >
                              {result.product.name}
                            </a>
                            <p className="text-sm text-gray-600">
                              {result.product.brand} • SKU: {result.product.sku}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {result.product.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-brand-orange">
                              {formatPrice(result.product.price)}
                            </div>
                            {result.product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">
                                {formatPrice(result.product.originalPrice)}
                              </div>
                            )}
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
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {result.product.rating} ({result.product.reviewCount} reviews)
                          </span>
                        </div>

                        {/* Match Info */}
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
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
                ))}

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
