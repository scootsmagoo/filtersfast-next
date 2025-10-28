/**
 * SavedModels Widget
 * 
 * Compact widget showing saved models for account dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Package, ArrowRight, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { SavedModel } from '@/lib/types/model';
import { APPLIANCE_TYPE_ICONS } from '@/lib/types/model';

export default function SavedModels() {
  const { data: session } = useSession();
  const router = useRouter();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/models/saved');
        if (response.ok) {
          const data = await response.json();
          setModels(data.savedModels?.slice(0, 3) || []); // Show max 3
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [session]);

  if (!session || (!loading && models.length === 0)) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Models</h2>
            <p className="text-sm text-gray-600">Saved appliances</p>
          </div>
        </div>

        <Link
          href="/account/models"
          className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-orange-dark font-medium"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading saved models">
          <Loader2 className="w-6 h-6 animate-spin text-brand-orange mx-auto" aria-hidden="true" />
          <p className="text-sm text-gray-500 text-center">Loading your models...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => router.push(`/products?model=${model.modelId}`)}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand-orange hover:shadow-md transition-all text-left"
              aria-label={`View filters for ${model.brand} ${model.modelNumber}`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-2xl" role="img" aria-hidden="true">
                  {APPLIANCE_TYPE_ICONS[model.applianceType]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 line-clamp-1">
                  {model.nickname || `${model.brand} ${model.modelNumber}`}
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {model.location || 'Saved model'}
                </p>
              </div>
            </button>
          ))}

          <Link
            href="/account/models"
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-orange hover:bg-brand-orange/5 transition-all text-gray-600 hover:text-brand-orange"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Model</span>
          </Link>
        </div>
      )}
    </Card>
  );
}

