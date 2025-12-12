/**
 * Track Order Page
 * 
 * Guest and logged-in users can track orders
 */

'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle, Package, Mail, Hash } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import TrackingDetails from '@/components/tracking/TrackingDetails';

interface OrderTracking {
  orderNumber: string;
  orderDate: string;
  status: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  total: number;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery?: string;
    lastUpdate?: string;
    currentLocation?: string;
  };
  timeline: Array<{
    status: string;
    date: string;
    completed: boolean;
    description?: string;
  }>;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderTracking | null>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both order number and email address');
      return;
    }

    setTracking(true);
    setError(null);
    setOrderData(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to track order');
      }

      if (data.success && data.order) {
        setOrderData(data.order);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track order';
      setError(errorMessage);
    } finally {
      setTracking(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (statusLower.includes('shipped') || statusLower.includes('transit')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    if (statusLower.includes('processing')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    if (statusLower.includes('pending')) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    if (statusLower.includes('cancelled')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Track Your Order
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors">
              Enter your order number and email to see the latest status
            </p>
          </div>

          {/* Tracking Form */}
          {!orderData && (
            <Card className="p-8 mb-8">
              <form onSubmit={handleTrackOrder} className="space-y-6">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Order Number
                    </div>
                  </label>
                  <input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g., FF-2025-001"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    Found in your confirmation email
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </div>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    Used when placing the order
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={tracking}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {tracking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Tracking Order...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}

          {/* Order Results */}
          {orderData && (
            <div className="space-y-8">
              {/* Order Header */}
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                      Order #{orderData.orderNumber}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors">
                      Placed on {new Date(orderData.orderDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full font-medium ${getStatusColor(orderData.status)}`}>
                      {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                    </span>
                    <span className="text-2xl font-bold text-brand-orange">
                      ${orderData.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Order Items</h3>
                  <div className="space-y-3">
                    {orderData.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0 transition-colors">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Order Timeline</h2>
                  <TrackingTimeline events={orderData.timeline} />
                </Card>

                {/* Shipping Details */}
                <div className="space-y-6">
                  {orderData.trackingInfo && (
                    <TrackingDetails trackingInfo={orderData.trackingInfo} />
                  )}

                  {/* Shipping Address */}
                  <Card className="p-6">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Shipping Address</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 transition-colors">
                      <p className="font-semibold">{orderData.shippingAddress.name}</p>
                      <p>{orderData.shippingAddress.address1}</p>
                      {orderData.shippingAddress.address2 && (
                        <p>{orderData.shippingAddress.address2}</p>
                      )}
                      <p>
                        {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Track Another Order */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    setOrderData(null);
                    setOrderNumber('');
                    setEmail('');
                    setError(null);
                  }}
                  variant="secondary"
                >
                  Track Another Order
                </Button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors">Need Help?</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 transition-colors">
              <p>
                <strong>Can't find your order number?</strong> Check your confirmation email or{' '}
                <a href="/sign-in" className="text-brand-orange hover:underline">sign in</a> to view your order history.
              </p>
              <p>
                <strong>Questions about your order?</strong> Contact us at{' '}
                <a href="tel:1-866-438-3458" className="text-brand-orange hover:underline">1-866-438-3458</a>
                {' '}or{' '}
                <a href="mailto:support@filtersfast.com" className="text-brand-orange hover:underline">support@filtersfast.com</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

