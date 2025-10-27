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
import { Package, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import type { SavedModel } from '@/lib/types/models';

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
          setModels(data.models?.slice(0, 3) || []); // Show max 3
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
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => router.push(`/search?model=${encodeURIComponent(model.model.modelNumber)}`)}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand-orange hover:shadow-md transition-all text-left"
            >
              {model.model.imageUrl ? (
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={model.model.imageUrl}
                    alt={model.model.modelNumber}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 line-clamp-1">
                  {model.nickname || model.model.modelNumber}
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {model.model.brand} • {model.location || 'Find Filters'}
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

