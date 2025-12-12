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
    const carriers: Record<string, string> = {
      'ups': '📦',
      'fedex': '📮',
      'usps': '✉️',
      'dhl': '🚚',
      'canada post': '📫',
      'canada_post': '📫',
      'canadapost': '📫',
    };
    const key = carrier.toLowerCase();
    return carriers[key] || carriers[key.replace('_', ' ')] || '📦';
  };

  const formatCarrierName = (carrier: string) =>
    carrier
      .replace(/[_-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center transition-colors">
          <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Shipping Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Track your package</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Carrier */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <span className="text-3xl">{getCarrierLogo(trackingInfo.carrier)}</span>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Carrier</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
              {formatCarrierName(trackingInfo.carrier)}
            </p>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Tracking Number</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-gray-100 transition-colors">
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
              Track on {formatCarrierName(trackingInfo.carrier)}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>

        {/* Estimated Delivery */}
        {trackingInfo.estimatedDelivery && (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Estimated Delivery</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
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
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Current Status</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{trackingInfo.currentLocation}</p>
            </div>
          </div>
        )}

        {/* Last Update */}
        {trackingInfo.lastUpdate && (
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Last Update</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
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

