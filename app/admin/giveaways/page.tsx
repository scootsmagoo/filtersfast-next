'use client';

/**
 * Admin Giveaways Management Page
 * 
 * Features:
 * - View all giveaways with status (active, upcoming, ended)
 * - Create new giveaways
 * - Edit existing giveaways
 * - View entries
 * - Pick winners randomly
 * - Delete giveaways
 */

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Gift, Plus, Calendar, Users, Award, Edit, Trash2, Eye } from 'lucide-react';

interface Giveaway {
  id: number;
  campaign_name: string;
  title: string;
  description: string;
  product_name: string | null;
  product_url: string | null;
  product_image_url: string | null;
  prize_description: string;
  start_date: string;
  end_date: string;
  is_active: number;
  entry_count: number;
  winner_id: number | null;
  winner_first_name?: string;
  winner_last_name?: string;
  winner_email?: string;
  winner_notified: number;
}

interface Stats {
  total_giveaways: number;
  active_giveaways: number;
  ended_giveaways: number;
  winners_selected: number;
  total_entries: number;
}

export default function AdminGiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);

  useEffect(() => {
    fetchGiveaways();
  }, [filter]);

  async function fetchGiveaways() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/giveaways?status=${filter}`);
      const data = await res.json();
      
      if (data.success) {
        setGiveaways(data.giveaways);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteGiveaway(id: number) {
    if (!confirm('Are you sure you want to delete this giveaway? All entries will be permanently deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchGiveaways();
      } else {
        alert('Failed to delete giveaway');
      }
    } catch (error) {
      console.error('Error deleting giveaway:', error);
      alert('Failed to delete giveaway');
    }
  }

  async function pickWinner(id: number) {
    const sendEmail = confirm('Send winner notification email?');

    try {
      const res = await fetch(`/api/admin/giveaways/${id}/pick-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail })
      });

      const data = await res.json();

      if (data.success) {
        alert(`Winner selected: ${data.winner.firstName} ${data.winner.lastName} (${data.winner.email})`);
        fetchGiveaways();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error picking winner:', error);
      alert('Failed to pick winner');
    }
  }

  function getStatus(giveaway: Giveaway) {
    const now = new Date();
    const start = new Date(giveaway.start_date);
    const end = new Date(giveaway.end_date);

    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  }

  if (loading && !giveaways.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center" role="status" aria-live="polite">
          <span className="sr-only">Loading giveaways...</span>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="progressbar">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-8 h-8 text-orange-500" />
            Giveaways & Sweepstakes
          </h1>
          <p className="text-gray-600 mt-1">Manage promotional giveaways and contests</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Create Giveaway
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Giveaways</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_giveaways}</p>
              </div>
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_giveaways}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ended</p>
                <p className="text-2xl font-bold text-gray-600">{stats.ended_giveaways}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_entries}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Winners Selected</p>
                <p className="text-2xl font-bold text-orange-600">{stats.winners_selected}</p>
              </div>
              <Award className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('ended')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ended'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ended
        </button>
      </div>

      {/* Giveaways List */}
      {giveaways.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No giveaways found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first giveaway</p>
          <Button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Giveaway
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {giveaways.map((giveaway) => {
            const status = getStatus(giveaway);
            
            return (
              <Card key={giveaway.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{giveaway.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {!giveaway.is_active && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{giveaway.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Campaign:</span>{' '}
                        <span className="text-gray-600">{giveaway.campaign_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Entries:</span>{' '}
                        <span className="text-blue-600 font-semibold">{giveaway.entry_count}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Start:</span>{' '}
                        <span className="text-gray-600">{new Date(giveaway.start_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">End:</span>{' '}
                        <span className="text-gray-600">{new Date(giveaway.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {giveaway.winner_id && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <Award className="w-5 h-5" />
                          <span className="font-medium">Winner:</span>
                          <span>{giveaway.winner_first_name} {giveaway.winner_last_name} ({giveaway.winner_email})</span>
                          {giveaway.winner_notified ? (
                            <span className="text-xs bg-green-200 px-2 py-1 rounded">Notified</span>
                          ) : (
                            <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Not Notified</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => window.open(`/api/admin/giveaways/${giveaway.id}/entries`, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label={`View ${giveaway.entry_count} entries for ${giveaway.title}`}
                    >
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    </button>
                    
                    {!giveaway.winner_id && giveaway.entry_count > 0 && (
                      <button
                        onClick={() => pickWinner(giveaway.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        aria-label={`Pick winner from ${giveaway.entry_count} entries for ${giveaway.title}`}
                      >
                        <Award className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setEditingGiveaway(giveaway)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      aria-label={`Edit ${giveaway.title} giveaway`}
                    >
                      <Edit className="w-5 h-5" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => deleteGiveaway(giveaway.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Delete ${giveaway.title} giveaway`}
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGiveaway) && (
        <GiveawayFormModal
          giveaway={editingGiveaway}
          onClose={() => {
            setShowCreateModal(false);
            setEditingGiveaway(null);
          }}
          onSaved={() => {
            fetchGiveaways();
            setShowCreateModal(false);
            setEditingGiveaway(null);
          }}
        />
      )}
    </div>
  );
}

// Giveaway Form Modal Component
function GiveawayFormModal({
  giveaway,
  onClose,
  onSaved
}: {
  giveaway: Giveaway | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    campaignName: giveaway?.campaign_name || '',
    title: giveaway?.title || '',
    description: giveaway?.description || '',
    productName: giveaway?.product_name || '',
    productUrl: giveaway?.product_url || '',
    productImageUrl: giveaway?.product_image_url || '',
    prizeDescription: giveaway?.prize_description || '',
    startDate: giveaway?.start_date.split('T')[0] || '',
    endDate: giveaway?.end_date.split('T')[0] || '',
    isActive: giveaway?.is_active !== 0
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = giveaway
        ? `/api/admin/giveaways/${giveaway.id}`
        : '/api/admin/giveaways';
      
      const method = giveaway ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving giveaway:', error);
      alert('Failed to save giveaway');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="giveaway-form-title"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 id="giveaway-form-title" className="text-2xl font-bold text-gray-900">
            {giveaway ? 'Edit Giveaway' : 'Create Giveaway'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close form"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-campaignName" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name (unique identifier) <span className="text-red-600" aria-label="required">*</span>
            </label>
            <input
              id="admin-campaignName"
              name="campaignName"
              type="text"
              required
              disabled={!!giveaway}
              aria-required="true"
              aria-disabled={!!giveaway}
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              className="input-field"
              placeholder="e.g., SUMMER-2025-AIRPURIFIER"
            />
          </div>

          <div>
            <label htmlFor="admin-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-600" aria-label="required">*</span>
            </label>
            <input
              id="admin-title"
              name="title"
              type="text"
              required
              aria-required="true"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Win a HEPA Air Purifier!"
            />
          </div>

          <div>
            <label htmlFor="admin-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-600" aria-label="required">*</span>
            </label>
            <textarea
              id="admin-description"
              name="description"
              required
              aria-required="true"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Enter details about the giveaway..."
            />
          </div>

          <div>
            <label htmlFor="admin-prizeDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Prize Description <span className="text-red-600" aria-label="required">*</span>
            </label>
            <textarea
              id="admin-prizeDescription"
              name="prizeDescription"
              required
              aria-required="true"
              rows={2}
              value={formData.prizeDescription}
              onChange={(e) => setFormData({ ...formData, prizeDescription: e.target.value })}
              className="input-field"
              placeholder="What's the prize? e.g., True HEPA Desktop Air Purifier + $100 Amazon Gift Card"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-600" aria-label="required">*</span>
              </label>
              <input
                id="admin-startDate"
                name="startDate"
                type="date"
                required
                aria-required="true"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="admin-endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-600" aria-label="required">*</span>
              </label>
              <input
                id="admin-endDate"
                name="endDate"
                type="date"
                required
                aria-required="true"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name (optional)
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="input-field"
              placeholder="e.g., Propur Water Pitcher"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product URL (optional)
            </label>
            <input
              type="url"
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              className="input-field"
              placeholder="https://www.filtersfast.com/products/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.productImageUrl}
              onChange={(e) => setFormData({ ...formData, productImageUrl: e.target.value })}
              className="input-field"
              placeholder="https://www.filtersfast.com/images/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (giveaway is visible to users)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={saving} 
              className="btn-primary flex-1"
              aria-busy={saving}
              aria-label={saving ? 'Saving giveaway' : giveaway ? 'Update giveaway' : 'Create giveaway'}
            >
              {saving ? 'Saving...' : giveaway ? 'Update Giveaway' : 'Create Giveaway'}
            </Button>
            <Button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              aria-label="Cancel and close form"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

