'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchableProduct } from '@/lib/types';
import { Star, Search } from 'lucide-react';
import { Price } from '@/components/products/Price';

interface SearchPreviewProps {
  query: string;
  isVisible: boolean;
  onSelectProduct: (product: SearchableProduct) => void;
  onClose: () => void;
}

interface SearchSuggestion {
  product: SearchableProduct;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'keyword';
  matchedFields: string[];
}

export default function SearchPreview({ query, isVisible, onSelectProduct, onClose }: SearchPreviewProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch search suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelectProduct(suggestions[selectedIndex].product);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onSelectProduct, onClose]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  if (!isVisible || query.length < 2) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-label="Search suggestions"
      aria-expanded={isVisible && suggestions.length > 0}
      className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto"
    >
      {loading ? (
        <div className="p-4 text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
          <p className="text-sm text-gray-600 mt-2">
            <span className="sr-only">Loading search suggestions</span>
            <span aria-hidden="true">Searching...</span>
          </p>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-2">
          {suggestions.map((suggestion, index) => {
            // CRITICAL: Use productId if available (string ID from database), otherwise use numeric id
            // The API returns productId: "prod-1762456823138-11r0fq" for database products
            // We MUST use this instead of the numeric id to avoid 404 errors
            const product = suggestion.product;
            
            // ALWAYS prefer productId over numeric id for database products
            // The API returns productId: "prod-xxx" for database products
            // Check if productId exists - it should be a string like "prod-1762456823138-11r0fq"
            const productLinkId: string = product.productId && typeof product.productId === 'string'
              ? product.productId  // Use the string productId from database
              : String(product.id); // Fallback to numeric id (for mock/legacy products)
            
            return (
            <Link
              key={product.id}
              href={`/products/${productLinkId}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => {
                onSelectProduct(suggestion.product);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors block focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
              aria-label={`${suggestion.product.name}, ${suggestion.product.brand}, $${suggestion.product.price}`}
            >
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                <img
                  src={suggestion.product.image}
                  alt={suggestion.product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {suggestion.product.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {suggestion.product.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {suggestion.product.brand} • SKU: {suggestion.product.sku}
                      </span>
                      {suggestion.matchType === 'exact' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded" aria-label="Exact match">
                          Exact Match
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-brand-orange">
                      <Price 
                        amountUSD={suggestion.product.price}
                        originalPrice={suggestion.product.originalPrice}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1 mt-1" role="img" aria-label={`Rating: ${suggestion.product.rating} out of 5 stars`}>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                      <span className="text-xs text-gray-600">
                        {suggestion.product.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            );
          })}

          {/* View All Results */}
          <div className="border-t border-gray-200 px-4 py-2">
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => {
                onClose();
              }}
              className="w-full text-left text-sm text-brand-orange hover:text-brand-orange-dark font-medium flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              View all results for "{query}"
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500" role="status" aria-live="polite">
          <p className="text-sm">No products found for "{query}"</p>
          <p className="text-xs mt-1">Try different keywords or check spelling</p>
        </div>
      )}
    </div>
  );
}
