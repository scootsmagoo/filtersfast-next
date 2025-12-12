'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Navigation, LocateFixed, Search as SearchIcon, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StoreLocatorMap from '@/components/store-locator/StoreLocatorMap';
import type { StoreLocationWithDistance } from '@/lib/types/store-location';

interface ApiResponse {
  success: boolean;
  locations: StoreLocationWithDistance[];
  total: number;
  error?: string;
}

interface StateOption {
  value: string;
  label: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const distanceOptions = [
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 250, label: '250 miles' },
];

export default function StoreLocatorPage() {
  const [locations, setLocations] = useState<StoreLocationWithDistance[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<StoreLocationWithDistance[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [locationTypes, setLocationTypes] = useState<Record<string, boolean>>({
    retail: true,
    dealer: true,
    distributor: true,
    service_center: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [locations, searchTerm, selectedState, maxDistance, locationTypes]);

  async function fetchLocations(params?: URLSearchParams) {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/store-locator', window.location.origin);
      if (params) {
        params.forEach((value, key) => url.searchParams.set(key, value));
      }
      const response = await fetch(url.toString());
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load store locations');
      }

      setLocations(data.locations);
      setFilteredLocations(data.locations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store locations');
    } finally {
      setLoading(false);
    }
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition({ lat: latitude, lng: longitude });
        const params = new URLSearchParams();
        params.set('lat', String(latitude));
        params.set('lng', String(longitude));
        if (maxDistance) {
          params.set('radius', String(maxDistance));
        }
        await fetchLocations(params);
        setIsLocating(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  function applyFilters() {
    let next = [...locations];

    // Type filter
    const activeTypes = Object.entries(locationTypes)
      .filter(([, active]) => active)
      .map(([type]) => type);
    next = next.filter((location) => activeTypes.includes(location.locationType));

    // State filter
    if (selectedState !== 'all') {
      next = next.filter((location) => location.state.toLowerCase() === selectedState.toLowerCase());
    }

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      next = next.filter((location) => {
        return (
          location.name.toLowerCase().includes(term) ||
          location.city.toLowerCase().includes(term) ||
          location.state.toLowerCase().includes(term) ||
          location.postalCode.toLowerCase().includes(term)
        );
      });
    }

    // Distance filter (requires user position/distance in API result)
    if (maxDistance !== null) {
      next = next.filter((location) => {
        if (location.distanceMiles === null || location.distanceMiles === undefined) return true;
        return location.distanceMiles <= maxDistance;
      });
    }

    // Sort by distance if available
    next.sort((a, b) => {
      const aDistance = a.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      const bDistance = b.distanceMiles ?? Number.MAX_SAFE_INTEGER;
      if (aDistance === bDistance) {
        return a.name.localeCompare(b.name);
      }
      return aDistance - bDistance;
    });

    setFilteredLocations(next);

    // Update selection if current selection no longer in filtered list
    if (selectedLocationId && !next.find((loc) => loc.id === selectedLocationId)) {
      setSelectedLocationId(next.length > 0 ? next[0].id : null);
    }
  }

  const stateOptions: StateOption[] = useMemo(() => {
    const states = new Set<string>();
    locations.forEach((location) => {
      states.add(location.state);
    });
    return Array.from(states)
      .sort()
      .map((state) => ({
        value: state,
        label: state,
      }));
  }, [locations]);

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors">
      <div className="container-custom py-12 space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-brand-orange/10 text-brand-orange rounded-full uppercase tracking-wide">
            <MapPin className="w-4 h-4" />
            Find a Store or Dealer
          </span>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Locate FiltersFast Retailers Near You
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Discover local partners for in-store pickup, commercial quotes, and expert support. Use the map or
            filters below to find the closest FiltersFast location or authorized dealer.
          </p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <SearchIcon className="w-4 h-4" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by city, state, or ZIP"
                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="all">All States</option>
                {stateOptions.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(locationTypes).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                      locationTypes[type]
                        ? 'border-brand-orange text-brand-orange font-semibold'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={locationTypes[type]}
                      onChange={(e) =>
                        setLocationTypes((prev) => ({
                          ...prev,
                          [type]: e.target.checked,
                        }))
                      }
                    />
                    <span className="capitalize text-xs sm:text-sm">{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Distance
              </label>
              <select
                value={maxDistance ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setMaxDistance(value ? Number(value) : null);
                }}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All distances</option>
                {distanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="justify-center mt-2 border border-dashed border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              >
                <LocateFixed className={`w-4 h-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Locating…' : 'Use my location'}
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            {error}
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <Card className="p-0 overflow-hidden min-h-[420px]">
            <StoreLocatorMap
              apiKey={GOOGLE_MAPS_API_KEY}
              locations={filteredLocations}
              selectedId={selectedLocationId}
              onMarkerSelect={(id) => setSelectedLocationId(id)}
              userPosition={userPosition}
            />
          </Card>

          <div className="space-y-4">
            {loading ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-300">Loading locations…</Card>
            ) : filteredLocations.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-300">
                No locations match your filters. Try broadening the search or clearing filters.
              </Card>
            ) : (
              filteredLocations.map((location) => {
                const isSelected = selectedLocationId === location.id;
                return (
                  <Card
                    key={location.id}
                    className={`p-6 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-brand-orange' : 'hover:shadow-lg'
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Show details for ${location.name} in ${location.city}, ${location.state}`}
                    onClick={() => setSelectedLocationId(location.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedLocationId(location.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {location.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide px-2 py-1 bg-brand-orange/10 text-brand-orange rounded-full mt-1">
                            {location.locationType.replace('_', ' ')}
                          </span>
                        </div>
                        {location.distanceMiles !== null && location.distanceMiles !== undefined && (
                          <span className="text-sm font-semibold text-brand-blue">
                            {location.distanceMiles.toFixed(1)} miles away
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <p>
                          {location.addressLine1}
                          {location.addressLine2 ? `, ${location.addressLine2}` : ''}
                        </p>
                        <p>
                          {location.city}, {location.state} {location.postalCode}
                        </p>
                        {location.phone && <p className="mt-1 font-medium">{location.phone}</p>}
                        {location.website && (
                          <p className="mt-1">
                            <a
                              href={location.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-orange hover:underline"
                            >
                              Visit website
                            </a>
                          </p>
                        )}
                      </div>

                      {location.services && location.services.length > 0 && (
                        <div className="text-sm">
                          <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wide">Services</p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {location.services.join(' • ')}
                          </p>
                        </div>
                      )}

                      {location.hours && (
                        <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(location.hours).map(([day, hours]) => (
                            <div key={day} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                              <span className="font-medium text-gray-700 dark:text-gray-200">{day}</span>
                              <span className="text-gray-600 dark:text-gray-300">{hours}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

