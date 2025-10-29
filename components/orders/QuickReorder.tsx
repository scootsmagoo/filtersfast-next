/**
 * QuickReorder Component
 * 
 * Shows recent orders with quick reorder buttons for logged-in users
 * Perfect for homepage/dashboard placement
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import ReorderButton from './ReorderButton';
import { Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecentOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  itemCount: number;
  items: Array<{
    name: string;
    image: string;
  }>;
}

export default function QuickReorder() {
  const { data: session } = useSession();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      // TODO: Replace with actual API call
      // Simulate fetching recent orders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      setRecentOrders([
        {
          id: '1',
          orderNumber: 'FF-2025-001',
          date: '2025-01-15',
          total: 89.99,
          itemCount: 2,
          items: [
            {
              name: 'GE MWF Refrigerator Water Filter',
              image: '/products/ge-mwf.jpg',
            },
          ],
        },
        {
          id: '2',
          orderNumber: 'FF-2024-950',
          date: '2024-12-20',
          total: 159.98,
          itemCount: 4,
          items: [
            {
              name: 'Filtrete 16x25x1 Air Filter 4-Pack',
              image: '/images/air-filter-1.jpg',
            },
          ],
        },
      ]);
      setLoading(false);
    };

    fetchRecentOrders();
  }, [session]);

  // Don't show if not logged in
  if (!session) {
    return null;
  }

  // Don't show if no orders
  if (!loading && recentOrders.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Reorder</h2>
            <p className="text-sm text-gray-600">Reorder from your recent purchases</p>
          </div>
        </div>
        
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-orange-dark font-medium"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0"
            >
              {/* Product Image */}
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img
                  src={order.items[0]?.image}
                  alt={order.items[0]?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Order Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="font-medium text-gray-900 hover:text-brand-orange line-clamp-1 block"
                >
                  Order #{order.orderNumber}
                </Link>
                <p className="text-sm text-gray-600">
                  {new Date(order.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' • '}
                  {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  {' • '}
                  ${order.total.toFixed(2)}
                </p>
              </div>

              {/* Reorder Button */}
              <div className="flex-shrink-0">
                <ReorderButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  itemCount={order.itemCount}
                  variant="outline"
                  size="sm"
                  showText={false}
                  navigateToCart={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

