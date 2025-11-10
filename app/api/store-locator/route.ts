/**
 * Public Store / Dealer Locator API
 * GET - Returns active locations with optional distance calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveStoreLocations, getStoreLocations } from '@/lib/db/store-locations';
import type { StoreLocationWithDistance, StoreLocationType } from '@/lib/types/store-location';

function toNumber(value: string | null): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

const LOCATION_TYPES: StoreLocationType[] = [
  'retail',
  'dealer',
  'distributor',
  'service_center',
];

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const lat = toNumber(params.get('lat'));
    const lng = toNumber(params.get('lng'));
    const radius = toNumber(params.get('radius')) ?? null;
    const stateFilter = params.get('state')?.trim();
    const typeFilters = params
      .getAll('type')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => LOCATION_TYPES.includes(value as StoreLocationType)) as StoreLocationType[];
    const includeInactive = params.get('status') === 'all';

    const locations = includeInactive
      ? getStoreLocations({
          states: stateFilter ? [stateFilter] : undefined,
          types: typeFilters.length ? typeFilters : undefined,
        })
      : getActiveStoreLocations().filter((location) =>
          stateFilter ? location.state.toLowerCase() === stateFilter.toLowerCase() : true
        );

    let results: StoreLocationWithDistance[] = locations.map((location) => {
      const hasCoords =
        location.latitude !== null &&
        location.latitude !== undefined &&
        location.longitude !== null &&
        location.longitude !== undefined;

      let distanceMiles: number | null = null;

      if (hasCoords && lat !== null && lng !== null) {
        distanceMiles = parseFloat(
          haversineMiles(lat, lng, location.latitude!, location.longitude!).toFixed(2)
        );
      }

      return {
        ...location,
        distanceMiles,
      };
    });

    if (radius !== null && lat !== null && lng !== null) {
      results = results.filter(
        (location) => location.distanceMiles === null || location.distanceMiles <= radius
      );
    }

    if (lat !== null && lng !== null) {
      results.sort((a, b) => {
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const limit = toNumber(params.get('limit'));
    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    const sanitizedResults: StoreLocationWithDistance[] = results.map((location) => ({
      id: location.id,
      name: location.name,
      slug: location.slug,
      locationType: location.locationType,
      status: location.status,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2 ?? null,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      country: location.country,
      phone: location.phone ?? null,
      website: location.website ?? null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      hours: location.hours ?? null,
      services: location.services ?? null,
      distanceMiles: location.distanceMiles ?? null,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      locations: sanitizedResults,
      total: sanitizedResults.length,
    });
  } catch (error) {
    console.error('Error loading store locator data:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : 'Failed to load store locations',
      },
      { status: 500 }
    );
  }
}

