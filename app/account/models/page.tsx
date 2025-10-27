/**
 * My Models Page
 * 
 * Manage saved appliance models
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { ArrowLeft, Plus, Loader2, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ModelSearch from '@/components/models/ModelSearch';
import ModelCard from '@/components/models/ModelCard';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';
import type { SavedModel } from '@/lib/types/models';

export default function MyModelsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { announceSuccess, announceError } = useStatusAnnouncement();
  
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModel, setShowAddModel] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in?redirect=/account/models');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchModels();
    }
  }, [session]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/models/saved');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModel = async (modelId: string, modelNumber: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/models/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelNumber: modelNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setModels([...models, data.model]);
        setShowAddModel(false);
        announceSuccess(`Model ${modelNumber} added successfully!`);
      } else {
        throw new Error('Failed to save model');
      }
    } catch (error) {
      announceError('Failed to save model. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateModel = async (
    id: string,
    nickname?: string,
    location?: string
  ) => {
    try {
      const response = await fetch(`/api/models/saved/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, location }),
      });

      if (response.ok) {
        const data = await response.json();
        setModels(models.map((m) => (m.id === id ? data.model : m)));
        announceSuccess('Model updated successfully!');
      }
    } catch (error) {
      announceError('Failed to update model.');
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const response = await fetch(`/api/models/saved/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModels(models.filter((m) => m.id !== id));
        announceSuccess('Model removed successfully!');
      }
    } catch (error) {
      announceError('Failed to remove model.');
    }
  };

  const handleFindFilters = (modelId: string, modelNumber: string) => {
    // TODO: Navigate to product search with model filter
    router.push(`/search?model=${encodeURIComponent(modelNumber)}`);
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading your models...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-brand-orange hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Models</h1>
                <p className="text-gray-600 mt-2">
                  Save your appliance models for quick filter lookups
                </p>
              </div>

              <Button
                onClick={() => setShowAddModel(!showAddModel)}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Model
              </Button>
            </div>
          </div>

          {/* Add Model Section */}
          {showAddModel && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New Model</h2>
                <button
                  onClick={() => setShowAddModel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <ModelSearch
                onModelSelect={handleSaveModel}
                autoFocus={true}
              />
            </Card>
          )}

          {/* Models List */}
          {models.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                No saved models yet
              </h2>
              <p className="text-gray-600 mb-6">
                Add your appliance models to quickly find compatible filters
              </p>
              <Button
                onClick={() => setShowAddModel(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Your First Model
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onUpdate={handleUpdateModel}
                  onDelete={handleDeleteModel}
                  onFindFilters={handleFindFilters}
                />
              ))}
            </div>
          )}

          {/* Help Text */}
          <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">💡 Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Find your model number on your appliance's label or manual</li>
              <li>• Add nicknames like "Kitchen Fridge" for easy identification</li>
              <li>• We'll show you compatible filters for each saved model</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

