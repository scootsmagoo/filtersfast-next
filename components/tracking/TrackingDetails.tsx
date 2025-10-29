/**
 * TrackingDetails Component
 * 
 * Display carrier tracking information with external links
 */

import { Truck, ExternalLink, MapPin, Calendar, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery?: string;
  lastUpdate?: string;
  currentLocation?: string;
}

interface TrackingDetailsProps {
  trackingInfo: TrackingInfo;
}

export default function TrackingDetails({ trackingInfo }: TrackingDetailsProps) {
  const getCarrierLogo = (carrier: string) => {
    // You can add actual carrier logos later
    const carriers: Record<string, string> = {
      'UPS': '📦',
      'FedEx': '📮',
      'USPS': '✉️',
      'DHL': '🚚',
    };
    return carriers[carrier] || '📦';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Truck className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
          <p className="text-sm text-gray-600">Track your package</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Carrier */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <span className="text-3xl">{getCarrierLogo(trackingInfo.carrier)}</span>
          <div>
            <p className="text-sm text-gray-600">Carrier</p>
            <p className="font-semibold text-gray-900">{trackingInfo.carrier}</p>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
            <p className="font-mono font-semibold text-gray-900">
              {trackingInfo.trackingNumber}
            </p>
          </div>
          <a
            href={trackingInfo.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              Track on {trackingInfo.carrier}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>

        {/* Estimated Delivery */}
        {trackingInfo.estimatedDelivery && (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Estimated Delivery</p>
              <p className="font-semibold text-gray-900">
                {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Current Location */}
        {trackingInfo.currentLocation && (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="font-semibold text-gray-900">{trackingInfo.currentLocation}</p>
            </div>
          </div>
        )}

        {/* Last Update */}
        {trackingInfo.lastUpdate && (
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-sm text-gray-900">
                {new Date(trackingInfo.lastUpdate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

