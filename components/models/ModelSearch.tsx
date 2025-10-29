/**
 * ModelSearch Component
 * 
 * Search for appliance models and view compatible filters
 */

'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { ModelLookupResult, ApplianceType } from '@/lib/types/models';

interface ModelSearchProps {
  onModelSelect?: (modelId: string, modelNumber: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function ModelSearch({
  onModelSelect,
  autoFocus = false,
  placeholder = 'Enter model number (e.g., RF28R7351SR)',
}: ModelSearchProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ModelLookupResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/models/search?q=${encodeURIComponent(query.trim())}`
      );

      if (!response.ok) {
        throw new Error('Failed to search models');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getTypeIcon = (type: ApplianceType) => {
    return '📱'; // You can add specific icons per type
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="flex items-center gap-2 px-6"
        >
          {searching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {hasSearched && !searching && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No models found</h3>
              <p className="text-gray-600">
                Try a different model number or check the spelling.
              </p>
            </Card>
          ) : (
            results.map((result, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                {/* Model Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {result.model.imageUrl && (
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={result.model.imageUrl}
                          alt={result.model.modelNumber}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getTypeIcon(result.model.type)}</span>
                        <h3 className="font-bold text-xl text-gray-900">
                          {result.model.modelNumber}
                        </h3>
                        {result.matchConfidence === 'exact' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Exact Match
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{result.model.brand}</p>
                      {result.model.description && (
                        <p className="text-sm text-gray-500 mt-1">{result.model.description}</p>
                      )}
                    </div>
                  </div>

                  {onModelSelect && (
                    <Button
                      onClick={() => onModelSelect(result.model.id, result.model.modelNumber)}
                      variant="secondary"
                      size="sm"
                    >
                      Save Model
                    </Button>
                  )}
                </div>

                {/* Compatible Products */}
                {result.compatibleProducts.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Compatible Filters ({result.compatibleProducts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.compatibleProducts.slice(0, 4).map((product) => (
                        <a
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand-orange hover:shadow-md transition-all"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-brand-orange font-bold">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.isPrimary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                    {result.compatibleProducts.length > 4 && (
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        + {result.compatibleProducts.length - 4} more compatible products
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

