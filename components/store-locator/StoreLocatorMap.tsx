import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { StoreLocationWithDistance } from '@/lib/types/store-location';

export interface StoreLocatorMapProps {
  apiKey?: string;
  locations: StoreLocationWithDistance[];
  selectedId?: string | null;
  onMarkerSelect?: (id: string) => void;
  userPosition?: { lat: number; lng: number } | null;
}

type MapInstance = google.maps.Map;
type Marker = google.maps.marker.AdvancedMarkerElement;

export default function StoreLocatorMap({
  apiKey,
  locations,
  selectedId,
  onMarkerSelect,
  userPosition,
}: StoreLocatorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const loaderRef = useRef<Loader | null>(null);

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;

    async function initMap() {
      try {
        if (!loaderRef.current) {
          loaderRef.current = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['places', 'marker'],
          });
        }

        const google = await loaderRef.current.load();

        if (cancelled) return;

        const initialCenter =
          userPosition ||
          (locations.length > 0 && locations[0].latitude && locations[0].longitude
            ? { lat: locations[0].latitude, lng: locations[0].longitude }
            : { lat: 35.2271, lng: -80.8431 }); // Charlotte, NC fallback

        mapRef.current = new google.maps.Map(mapContainerRef.current!, {
          center: initialCenter,
          zoom: 6,
          mapId: 'store_locator_map',
          gestureHandling: 'greedy',
          mapTypeControl: false,
          fullscreenControl: true,
        });

        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize Google Maps:', err);
      }
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, locations, userPosition]);

  useEffect(() => {
    if (!isReady || !mapRef.current || typeof window === 'undefined') return;

    const google = window.google;
    if (!google?.maps) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    const bounds = new google.maps.LatLngBounds();
    let addedMarker = false;

    locations.forEach((location) => {
      if (
        location.latitude === undefined ||
        location.latitude === null ||
        location.longitude === undefined ||
        location.longitude === null
      ) {
        return;
      }

      const position = { lat: location.latitude, lng: location.longitude };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapRef.current!,
        title: location.name,
        gmpDraggable: false,
      });

      marker.addListener('gmp-click', () => {
        onMarkerSelect?.(location.id);
      });

      markersRef.current.set(location.id, marker);
      bounds.extend(position);
      addedMarker = true;
    });

    if (addedMarker) {
      if (locations.length === 1 && userPosition) {
        mapRef.current.setZoom(8);
        mapRef.current.panTo(new google.maps.LatLng(locations[0].latitude!, locations[0].longitude!));
      } else if (locations.length === 1) {
        mapRef.current.setZoom(10);
        mapRef.current.panTo(new google.maps.LatLng(locations[0].latitude!, locations[0].longitude!));
      } else {
        mapRef.current.fitBounds(bounds, 60);
      }
    } else if (userPosition) {
      mapRef.current.setZoom(8);
      mapRef.current.panTo(new google.maps.LatLng(userPosition.lat, userPosition.lng));
    }
  }, [isReady, locations, onMarkerSelect, userPosition]);

  useEffect(() => {
    if (!selectedId || typeof window === 'undefined') return;
    const google = window.google;
    if (!google?.maps) return;

    const selectedMarker = markersRef.current.get(selectedId);
    if (selectedMarker && mapRef.current) {
      mapRef.current.panTo(selectedMarker.position as google.maps.LatLng);
      mapRef.current.setZoom(11);
      selectedMarker.scale = 1.3;

      // Reset other markers scale
      markersRef.current.forEach((marker, id) => {
        if (id !== selectedId) {
          marker.scale = 1;
        }
      });
    }
  }, [selectedId]);

  if (!apiKey) {
    return (
      <div className="h-full min-h-[360px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center px-6">
        <div>
          <p className="text-gray-700 dark:text-gray-200 font-semibold">
            Google Maps API key missing
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment to enable the interactive map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[360px] rounded-xl overflow-hidden"
      role="application"
      aria-label="Interactive map of FiltersFast store locations"
      tabIndex={0}
    />
  );
}

