/**
 * Model Lookup Component
 * Search for appliance models and find compatible filters
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, BookmarkPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApplianceModel, ApplianceType, APPLIANCE_TYPE_LABELS, APPLIANCE_TYPE_ICONS } from '@/lib/types/model';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ModelLookupProps {
  onModelSelect?: (model: ApplianceModel) => void;
  showSaveButton?: boolean;
  className?: string;
}

export default function ModelLookup({ 
  onModelSelect, 
  showSaveButton = true,
  className = '' 
}: ModelLookupProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [applianceType, setApplianceType] = useState<ApplianceType | ''>('');
  const [results, setResults] = useState<ApplianceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Auto-search if query parameter is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSearch();
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a model number or brand to search');
      return;
    }

    if (query.length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        ...(applianceType && { type: applianceType }),
        limit: '10',
      });

      const response = await fetch(`/api/models/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search models');
      }

      setResults(data.models || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModel = async (modelId: string) => {
    setSavingModel(modelId);
    setError('');
    setSaveSuccess('');

    try {
      const response = await fetch('/api/models/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to save models to your account');
        }
        if (response.status === 409) {
          throw new Error('This model is already saved to your account');
        }
        throw new Error(data.error || 'Failed to save model');
      }

      // Show success feedback
      setSaveSuccess('Model saved successfully!');
      setTimeout(() => {
        setSavingModel(null);
        setSaveSuccess('');
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save model';
      setError(errorMsg);
      setSavingModel(null);
    }
  };

  return (
    <div className={className}>
      {/* Search Form */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4" role="search" aria-label="Search for appliance models">
          <div>
            <label htmlFor="model-search" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Model Number or Brand
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="model-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
                placeholder="e.g., GE GSS25GSHSS or Samsung RF28..."
                disabled={loading}
                aria-describedby="search-help"
                aria-invalid={!!error}
                maxLength={100}
              />
              <p id="search-help" className="sr-only">
                Enter your appliance brand or model number to find compatible filters
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="appliance-type" className="block text-sm font-medium text-gray-700 mb-2">
              Appliance Type (Optional)
            </label>
            <p id="type-help" className="sr-only">
              Filter results by appliance type to narrow your search
            </p>
            <select
              id="appliance-type"
              value={applianceType}
              onChange={(e) => setApplianceType(e.target.value as ApplianceType | '')}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all"
              disabled={loading}
              aria-describedby="type-help"
            >
              <option value="">All Types</option>
              {Object.entries(APPLIANCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {APPLIANCE_TYPE_ICONS[value as ApplianceType]} {label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full"
            aria-busy={loading}
            aria-label={loading ? 'Searching for models, please wait' : 'Search for models'}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                <span className="sr-only">Searching for models, please wait</span>
                <span aria-hidden="true">Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                Search Models
              </>
            )}
          </Button>
        </form>

        {/* Success Message */}
        {saveSuccess && (
          <div 
            className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-green-800">{saveSuccess}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div 
            className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {error.includes('sign in') && (
                <p className="text-xs text-red-700 mt-2">
                  <strong>Tip:</strong> <a href="/sign-in" className="underline hover:no-underline">Sign in to your account</a> to save models for quick reordering.
                </p>
              )}
              {error.includes('already saved') && (
                <p className="text-xs text-red-700 mt-2">
                  <strong>Tip:</strong> View your <a href="/account/models" className="underline hover:no-underline">saved models</a> to manage them.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Search Results */}
      {searched && !loading && (
        <div className="mt-6" role="region" aria-live="polite" aria-label="Search results">
          {results.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <span className="sr-only">Search complete: </span>
                Found {results.length} Model{results.length !== 1 ? 's' : ''}
              </h3>
              
              {results.map((model) => (
                <Card key={model.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl" role="img" aria-label={APPLIANCE_TYPE_LABELS[model.applianceType]}>
                          {APPLIANCE_TYPE_ICONS[model.applianceType]}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {model.brand} {model.modelNumber}
                        </h4>
                      </div>
                      
                      {model.modelName && (
                        <p className="text-sm text-gray-600 mb-2">{model.modelName}</p>
                      )}
                      
                      <p className="text-sm text-gray-500 mb-3">
                        {APPLIANCE_TYPE_LABELS[model.applianceType]}
                      </p>

                      {model.compatibleFilters && model.compatibleFilters.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Compatible Filters:
                          </p>
                          <div className="space-y-2">
                            {model.compatibleFilters.slice(0, 3).map((filter, idx) => (
                              <div 
                                key={idx}
                                className="text-sm text-gray-600 flex items-center gap-2"
                              >
                                {filter.isPrimary && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Recommended" />
                                )}
                                <span>{filter.productName} - ${filter.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {showSaveButton && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSaveModel(model.id)}
                        disabled={savingModel === model.id}
                        className="flex-shrink-0"
                        aria-label={`Save ${model.brand} ${model.modelNumber} to your account`}
                        aria-pressed={savingModel === model.id}
                      >
                        {savingModel === model.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" aria-hidden="true" />
                            <span className="sr-only">Model saved successfully</span>
                            <span aria-hidden="true">Saved!</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                            Save Model
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-2">
                <span className="sr-only">No results: </span>
                No models found for "{query}"
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Suggestions:</strong>
              </p>
              <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                <li>• Check your spelling and try again</li>
                <li>• Try searching for just the brand name (e.g., "GE" or "Samsung")</li>
                <li>• Look for the model number on your appliance label</li>
                <li>• Contact support if you need help finding your model</li>
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}


