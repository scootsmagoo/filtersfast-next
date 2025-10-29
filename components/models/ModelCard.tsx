/**
 * ModelCard Component
 * 
 * Display a saved appliance model with edit/delete options
 */

'use client';

import { useState } from 'react';
import { Edit2, Trash2, MapPin, Tag, Calendar, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { SavedModel } from '@/lib/types/models';

interface ModelCardProps {
  model: SavedModel;
  onUpdate?: (id: string, nickname?: string, location?: string) => void;
  onDelete?: (id: string) => void;
  onFindFilters?: (modelId: string, modelNumber: string) => void;
}

export default function ModelCard({
  model,
  onUpdate,
  onDelete,
  onFindFilters,
}: ModelCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(model.nickname || '');
  const [location, setLocation] = useState(model.location || '');

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(model.id, nickname || undefined, location || undefined);
    }
    setIsEditing(false);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'refrigerator': '🧊 Refrigerator',
      'hvac': '❄️ HVAC',
      'water-filter': '💧 Water Filter',
      'humidifier': '💨 Humidifier',
      'pool': '🏊 Pool',
      'other': '📱 Appliance',
    };
    return labels[type] || '📱 Appliance';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Model Image */}
        {model.model.imageUrl && (
          <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <img
              src={model.model.imageUrl}
              alt={model.model.modelNumber}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Model Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-3">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname (optional)
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Kitchen Fridge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location (optional)
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Kitchen, Basement"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setNickname(model.nickname || '');
                    setLocation(model.location || '');
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">
                    {model.nickname || model.model.modelNumber}
                  </h3>
                  {model.nickname && (
                    <p className="text-sm text-gray-600">Model: {model.model.modelNumber}</p>
                  )}
                </div>
                <span className="text-2xl">{getTypeLabel(model.model.type).split(' ')[0]}</span>
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-gray-700">{model.model.brand}</p>
                {model.model.description && (
                  <p className="text-sm text-gray-600">{model.model.description}</p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  <Tag className="w-3 h-3" />
                  {getTypeLabel(model.model.type)}
                </span>
                {model.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    <MapPin className="w-3 h-3" />
                    {model.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  <Calendar className="w-3 h-3" />
                  Added {new Date(model.dateAdded).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {onFindFilters && (
                  <Button
                    onClick={() => onFindFilters(model.model.id, model.model.modelNumber)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Find Filters
                  </Button>
                )}
                {onUpdate && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={() => {
                      if (confirm(`Remove ${model.nickname || model.model.modelNumber}?`)) {
                        onDelete(model.id);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

