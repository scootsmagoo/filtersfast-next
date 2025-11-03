'use client';

/**
 * Admin Shipping Configuration Page
 * Configure carriers, zones, and shipping rules
 */

import { useState, useEffect } from 'react';
import { Package, Truck, Settings, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { ShippingConfig, ShippingCarrier } from '@/lib/types/shipping';

export default function AdminShippingPage() {
  const [configs, setConfigs] = useState<ShippingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingConfig>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/shipping/configs');
      if (!response.ok) throw new Error('Failed to load shipping configs');
      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: ShippingConfig) => {
    setEditingCarrier(config.carrier);
    setFormData(config);
  };

  const handleSave = async () => {
    if (!editingCarrier) return;

    try {
      const response = await fetch('/api/admin/shipping/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: editingCarrier,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      await loadConfigs();
      setEditingCarrier(null);
      setFormData({});
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  const handleToggleActive = async (carrier: ShippingCarrier, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/shipping/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          is_active: !isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to update carrier status');
      await loadConfigs();
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update carrier status');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse" role="status" aria-live="polite">
          Loading shipping configuration...
          <span className="sr-only">Please wait</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Truck className="w-8 h-8" aria-hidden="true" />
              Shipping Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Configure shipping carriers and rates
            </p>
          </div>
        </div>

        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Carrier Configurations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {['usps', 'ups', 'fedex', 'dhl'].map((carrier) => {
            const config = configs.find((c) => c.carrier === carrier);
            const isEditing = editingCarrier === carrier;

            return (
              <Card key={carrier} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        config?.is_active 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                      aria-hidden="true"
                    >
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 uppercase">
                        {carrier}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="sr-only">Status: </span>
                        {config?.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => handleToggleActive(carrier as ShippingCarrier, config?.is_active || false)}
                          className={`px-3 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            config?.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 focus:ring-red-500'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 focus:ring-green-500'
                          }`}
                          aria-label={`${config?.is_active ? 'Disable' : 'Enable'} ${carrier.toUpperCase()} shipping`}
                        >
                          {config?.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEdit(config || { carrier: carrier as ShippingCarrier, is_active: false, api_credentials: {}, origin_address: { name: '', address_line1: '', city: '', state: '', postal_code: '', country: 'US' }, created_at: Date.now(), updated_at: Date.now(), id: '' })}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 transition-colors"
                          aria-label={`Edit ${carrier.toUpperCase()} configuration`}
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor={`${carrier}-address`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Origin Address
                      </label>
                      <input
                        id={`${carrier}-address`}
                        type="text"
                        placeholder="Street Address"
                        value={formData.origin_address?.address_line1 || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          origin_address: {
                            ...formData.origin_address!,
                            address_line1: e.target.value,
                          },
                        })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
                        aria-required="true"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${carrier}-city`} className="sr-only">City</label>
                        <input
                          id={`${carrier}-city`}
                          type="text"
                          placeholder="City"
                          value={formData.origin_address?.city || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            origin_address: {
                              ...formData.origin_address!,
                              city: e.target.value,
                            },
                          })}
                          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${carrier}-state`} className="sr-only">State</label>
                        <input
                          id={`${carrier}-state`}
                          type="text"
                          placeholder="State"
                          value={formData.origin_address?.state || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            origin_address: {
                              ...formData.origin_address!,
                              state: e.target.value,
                            },
                          })}
                          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`${carrier}-zip`} className="sr-only">ZIP Code</label>
                      <input
                        id={`${carrier}-zip`}
                        type="text"
                        placeholder="ZIP Code"
                        value={formData.origin_address?.postal_code || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          origin_address: {
                            ...formData.origin_address!,
                            postal_code: e.target.value,
                          },
                        })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label htmlFor={`${carrier}-markup`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Markup (%)
                      </label>
                      <input
                        id={`${carrier}-markup`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={formData.markup_percentage || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          markup_percentage: parseFloat(e.target.value) || undefined,
                        })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
                        aria-describedby={`${carrier}-markup-help`}
                      />
                      <p id={`${carrier}-markup-help`} className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add a percentage markup to carrier rates (optional)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1" aria-label={`Save ${carrier.toUpperCase()} configuration`}>
                        <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingCarrier(null);
                          setFormData({});
                        }}
                        aria-label={`Cancel editing ${carrier.toUpperCase()} configuration`}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {config ? (
                      <>
                        <p>
                          <strong>Origin:</strong> {config.origin_address?.city}, {config.origin_address?.state}
                        </p>
                        {config.markup_percentage && (
                          <p>
                            <strong>Markup:</strong> {config.markup_percentage}%
                          </p>
                        )}
                        {config.free_shipping_threshold && (
                          <p>
                            <strong>Free Shipping:</strong> ${config.free_shipping_threshold}+
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500">Not configured</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Environment Variables Guide */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" aria-hidden="true" />
            API Credentials Setup
          </h2>

          <div className="space-y-4 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              Add these environment variables to your `.env.local` file:
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-xs space-y-1">
              <p className="text-gray-800 dark:text-gray-200"># USPS</p>
              <p className="text-gray-600 dark:text-gray-400">USPS_USER_ID=your_usps_user_id</p>
              
              <p className="text-gray-800 dark:text-gray-200 mt-3"># UPS</p>
              <p className="text-gray-600 dark:text-gray-400">UPS_CLIENT_ID=your_ups_client_id</p>
              <p className="text-gray-600 dark:text-gray-400">UPS_CLIENT_SECRET=your_ups_client_secret</p>
              <p className="text-gray-600 dark:text-gray-400">UPS_ACCOUNT_NUMBER=your_ups_account_number</p>
              
              <p className="text-gray-800 dark:text-gray-200 mt-3"># FedEx</p>
              <p className="text-gray-600 dark:text-gray-400">FEDEX_ACCOUNT_NUMBER=your_fedex_account_number</p>
              <p className="text-gray-600 dark:text-gray-400">FEDEX_METER_NUMBER=your_fedex_meter_number</p>
              <p className="text-gray-600 dark:text-gray-400">FEDEX_API_KEY=your_fedex_api_key</p>
              <p className="text-gray-600 dark:text-gray-400">FEDEX_API_SECRET=your_fedex_api_secret</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

