/**
 * Saved Models Page
 * View and manage customer's saved appliance models
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { SavedModel, APPLIANCE_TYPE_LABELS, APPLIANCE_TYPE_ICONS } from '@/lib/types/model';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bookmark, Trash2, ShoppingCart, Loader2, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SavedModelsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in?redirect=/account/models');
      return;
    }

    if (session) {
      loadSavedModels();
    }
  }, [session, isPending, router]);

  const loadSavedModels = async () => {
    try {
      const response = await fetch('/api/models/saved');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load saved models');
      }

      setSavedModels(data.savedModels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelId: string, modelName: string) => {
    if (!confirm(`Remove ${modelName} from your saved models?`)) {
      return;
    }

    setDeletingId(modelId);
    setError('');

    try {
      const response = await fetch(`/api/models/saved/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove model');
      }

      setSavedModels(prev => prev.filter(m => m.id !== modelId));
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `${modelName} removed from saved models`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove model. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" aria-hidden="true" />
          <span className="sr-only">Loading your saved models...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 transition-colors">
              <Bookmark className="w-8 h-8 text-brand-orange" />
              My Saved Models
            </h1>
            <Link href="/model-lookup">
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Add Model
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Quickly find and reorder filters for your saved appliances
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 transition-colors"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 transition-colors" aria-hidden="true" />
            <p className="text-sm text-red-800 dark:text-red-300 transition-colors">{error}</p>
          </div>
        )}

        {/* Saved Models List */}
        {savedModels.length === 0 ? (
          <Card className="p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              No Saved Models Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
              Save your appliance models for quick filter reordering and automatic reminders
            </p>
            <Link href="/model-lookup">
              <Button aria-label="Find and save your appliance model">
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                Find Your Model
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedModels.map((model) => (
              <Card key={model.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl" role="img" aria-label={APPLIANCE_TYPE_LABELS[model.applianceType]}>
                        {APPLIANCE_TYPE_ICONS[model.applianceType]}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                          {model.brand} {model.modelNumber}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {APPLIANCE_TYPE_LABELS[model.applianceType]}
                        </p>
                      </div>
                    </div>

                    {model.nickname && (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        {model.nickname}
                      </p>
                    )}

                    {model.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 transition-colors">
                        📍 {model.location}
                      </p>
                    )}

                    {model.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3 transition-colors">
                        {model.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      <span>
                        Saved {new Date(model.createdAt).toLocaleDateString()}
                      </span>
                      {model.lastOrderedDate && (
                        <>
                          <span>•</span>
                          <span>
                            Last ordered {new Date(model.lastOrderedDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/products?model=${model.modelId}`)}
                      aria-label={`Order filters for ${model.brand} ${model.modelNumber}`}
                      className="focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                      Order Filters
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(model.id, `${model.brand} ${model.modelNumber}`)}
                      disabled={deletingId === model.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                      aria-label={`Remove ${model.brand} ${model.modelNumber} from saved models`}
                      aria-busy={deletingId === model.id}
                    >
                      {deletingId === model.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span className="sr-only">Removing model...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only">Remove</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 transition-colors">💡 Pro Tip</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
            Save all your appliance models to make reordering filters quick and easy. 
            We'll even remind you when it's time to replace them!
          </p>
        </Card>
      </div>
    </div>
  );
}
