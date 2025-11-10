'use client';

/**
 * Admin Store & Dealer Locator Management
 */

import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Building2,
  Plus,
  Save,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  Globe,
  Phone,
  Mail,
  Compass,
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import type { StoreLocation, StoreLocationFormData } from '@/lib/types/store-location';
import type { ShippingZone } from '@/lib/types/shipping';

type FormState = {
  name: string;
  slug: string;
  locationType: 'retail' | 'dealer' | 'distributor' | 'service_center';
  status: 'active' | 'inactive';
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  googlePlaceId: string;
  latitude: string;
  longitude: string;
  hoursText: string;
  servicesText: string;
  notes: string;
  shippingZoneId: string;
  taxRegionCode: string;
  taxRateOverride: string;
};

const defaultFormState: FormState = {
  name: '',
  slug: '',
  locationType: 'retail',
  status: 'active',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  email: '',
  website: '',
  googlePlaceId: '',
  latitude: '',
  longitude: '',
  hoursText: '',
  servicesText: '',
  notes: '',
  shippingZoneId: '',
  taxRegionCode: '',
  taxRateOverride: '',
};

function formatHours(hours?: Record<string, string> | null): string {
  if (!hours) return '';
  return Object.entries(hours)
    .map(([day, value]) => `${day}: ${value}`)
    .join('\n');
}

function parseHours(value: string): Record<string, string> | null {
  if (!value || !value.trim()) return null;

  // Try JSON first
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      const normalized: Record<string, string> = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim()) {
          normalized[key.trim()] = val.trim();
        }
      });
      return Object.keys(normalized).length ? normalized : null;
    }
  } catch {
    // Fallback to line parsing
  }

  const lines = value.split('\n');
  const output: Record<string, string> = {};

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const [key, ...rest] = trimmed.split(':');
    if (!key || rest.length === 0) return;
    const val = rest.join(':').trim();
    if (val) {
      output[key.trim()] = val;
    }
  });

  return Object.keys(output).length ? output : null;
}

function parseServices(value: string): string[] | null {
  if (!value || !value.trim()) return null;
  const services = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return services.length ? services : null;
}

function formatServices(services?: string[] | null): string {
  if (!services || services.length === 0) return '';
  return services.join(', ');
}

function toFormState(location: StoreLocation): FormState {
  return {
    name: location.name,
    slug: location.slug,
    locationType: location.locationType,
    status: location.status,
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2 || '',
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: location.country,
    phone: location.phone || '',
    email: location.email || '',
    website: location.website || '',
    googlePlaceId: location.googlePlaceId || '',
    latitude: location.latitude !== null && location.latitude !== undefined ? String(location.latitude) : '',
    longitude:
      location.longitude !== null && location.longitude !== undefined ? String(location.longitude) : '',
    hoursText: formatHours(location.hours),
    servicesText: formatServices(location.services),
    notes: location.notes || '',
    shippingZoneId: location.shippingZoneId || '',
    taxRegionCode: location.taxRegionCode || '',
    taxRateOverride:
      location.taxRateOverride !== null && location.taxRateOverride !== undefined
        ? String(location.taxRateOverride)
        : '',
  };
}

function toPayload(form: FormState): StoreLocationFormData {
  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();
  const taxRateOverride = form.taxRateOverride.trim();

  return {
    name: form.name,
    slug: form.slug.trim() || undefined,
    locationType: form.locationType,
    status: form.status,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2 || null,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    country: form.country || 'US',
    phone: form.phone || null,
    email: form.email || null,
    website: form.website || null,
    googlePlaceId: form.googlePlaceId || null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    hours: parseHours(form.hoursText),
    services: parseServices(form.servicesText),
    notes: form.notes || null,
    shippingZoneId: form.shippingZoneId || null,
    taxRegionCode: form.taxRegionCode || null,
    taxRateOverride: taxRateOverride ? Number(taxRateOverride) : null,
  };
}

export default function AdminStoreLocationsPage() {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isEditing = Boolean(editingId);

  useEffect(() => {
    loadLocations();
    loadShippingZones();
  }, []);

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  async function loadLocations() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/store-locations');
      if (!response.ok) {
        throw new Error('Failed to load store locations');
      }
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store locations');
    } finally {
      setLoading(false);
    }
  }

  async function loadShippingZones() {
    setZonesLoading(true);
    try {
      const response = await fetch('/api/admin/shipping/zones');
      if (!response.ok) {
        throw new Error('Failed to load shipping zones');
      }
      const data = await response.json();
      setShippingZones(data.zones || []);
    } catch (err) {
      console.error('Error loading shipping zones:', err);
    } finally {
      setZonesLoading(false);
    }
  }

  function handleInputChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setFormState(defaultFormState);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = toPayload(formState);
      const endpoint = isEditing ? `/api/admin/store-locations/${editingId}` : '/api/admin/store-locations';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        const message = body?.error || 'Failed to save location';
        throw new Error(message);
      }

      await loadLocations();
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(location: StoreLocation) {
    setEditingId(location.id);
    setFormState(toFormState(location));
    setFormError(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this location? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/store-locations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Failed to delete location');
      }
      await loadLocations();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete location');
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} location${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/store-locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Failed to delete locations');
      }
      await loadLocations();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete locations');
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminBreadcrumb />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-brand-orange" aria-hidden="true" />
              Store & Dealer Locator
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage physical retail locations, dealer partners, and service centers. Tie each location to
              shipping zones and tax regions for accurate fulfillment rules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={loadLocations}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 text-red-800 dark:text-red-300">
            {error}
          </Card>
        )}

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit Location' : 'Add Location'}
              </h2>
              {isEditing && (
                <Button variant="secondary" onClick={resetForm} type="button" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
            </div>

            {formError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="FiltersFast Retail Store"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location Type
                    </label>
                    <select
                      value={formState.locationType}
                      onChange={(e) => handleInputChange('locationType', e.target.value as FormState['locationType'])}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="retail">Retail Store</option>
                      <option value="dealer">Authorized Dealer</option>
                      <option value="distributor">Distributor</option>
                      <option value="service_center">Service Center</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) => handleInputChange('status', e.target.value as FormState['status'])}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formState.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Suite 200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="NC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formState.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="US"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="1-866-438-3458"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="store@filtersfast.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={formState.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="https://www.filtersfast.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Google Place ID
                    </label>
                    <input
                      type="text"
                      value={formState.googlePlaceId}
                      onChange={(e) => handleInputChange('googlePlaceId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="ChIJ9wJk..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={formState.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="35.0056"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={formState.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="-80.5976"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Shipping Zone
                  </label>
                  <select
                    value={formState.shippingZoneId}
                    onChange={(e) => handleInputChange('shippingZoneId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    disabled={zonesLoading}
                  >
                    <option value="">{zonesLoading ? 'Loading zones…' : 'Not linked'}</option>
                    {shippingZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} {zone.is_active ? '' : '(inactive)'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Map this location to a shipping zone for pickup or regional pricing rules.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Region Code
                    </label>
                    <input
                      type="text"
                      value={formState.taxRegionCode}
                      onChange={(e) => handleInputChange('taxRegionCode', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="NC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Rate Override (%)
                    </label>
                    <input
                      type="number"
                      value={formState.taxRateOverride}
                      onChange={(e) => handleInputChange('taxRateOverride', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="7.25"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Hours of Operation
                  </label>
                  <textarea
                    value={formState.hoursText}
                    onChange={(e) => handleInputChange('hoursText', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-h-[120px]"
                    placeholder={'Monday: 9:00 AM - 5:00 PM\nTuesday: 9:00 AM - 5:00 PM'}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Provide `Day: Hours` per line or paste a JSON object. Leave blank to omit.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Services Offered
                  </label>
                  <textarea
                    value={formState.servicesText}
                    onChange={(e) => handleInputChange('servicesText', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-h-[80px]"
                    placeholder="Retail showroom, Commercial sales, Filter pickup"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Comma separated list (e.g. `Order pickup, Dealer support, Installation`).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-h-[100px]"
                    placeholder="Details visible to admins. Include parking info, lead contacts, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isEditing ? 'Update Location' : 'Create Location'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Locations Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Locations ({locations.length})
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Click a row to edit. Select multiple to bulk delete.
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              Loading locations…
            </div>
          ) : locations.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              No locations yet. Add your first store or dealer using the form above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        aria-label="Select all locations"
                        checked={selectedIds.size === locations.length && locations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(locations.map((loc) => loc.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      City / State
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Shipping Zone
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Tax Region
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedLocations.map((location) => {
                    const isSelected = selectedIds.has(location.id);
                    return (
                      <tr
                        key={location.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          location.status === 'inactive' ? 'opacity-70' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${location.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelection(location.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{location.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {location.status === 'active' ? 'Active' : 'Inactive'} · Slug: {location.slug}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {location.locationType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {location.city}, {location.state}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {location.shippingZoneName || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {location.taxRegionCode || '—'}
                          {location.taxRateOverride !== null && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({location.taxRateOverride}%)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(location)}
                              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              aria-label={`Edit ${location.name}`}
                            >
                              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <button
                              onClick={() => handleDelete(location.id)}
                              className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
                              aria-label={`Delete ${location.name}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

