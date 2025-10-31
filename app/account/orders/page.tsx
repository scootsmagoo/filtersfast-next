'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import ReorderButton from '@/components/orders/ReorderButton';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  itemCount: number;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// Mock order data (would come from API in production)
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'FF-2025-001',
    date: '2025-01-15',
    status: 'delivered',
    total: 89.99,
    itemCount: 2,
    trackingNumber: '1Z999AA10123456784',
    items: [
      {
        id: 1,
        name: 'GE MWF Refrigerator Water Filter',
        quantity: 2,
        price: 44.99,
        image: '/products/ge-mwf.jpg'
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'FF-2025-002',
    date: '2025-01-20',
    status: 'shipped',
    total: 159.98,
    itemCount: 4,
    trackingNumber: '1Z999AA10123456785',
    estimatedDelivery: '2025-01-25',
    items: [
      {
        id: 2,
        name: 'Filtrete 16x25x1 Air Filter 4-Pack',
        quantity: 4,
        price: 39.99,
        image: '/images/air-filter-1.jpg'
      }
    ]
  },
  {
    id: '3',
    orderNumber: 'FF-2025-003',
    date: '2025-01-22',
    status: 'processing',
    total: 49.99,
    itemCount: 1,
    items: [
      {
        id: 3,
        name: 'LG LT700P Refrigerator Water Filter',
        quantity: 1,
        price: 49.99,
        image: '/products/lg-lt700p.jpg'
      }
    ]
  }
];

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in?redirect=/account/orders');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
      setLoading(false);
    };

    if (session) {
      fetchOrders();
    }
  }, [session]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 transition-colors" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 transition-colors">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/account"
              className="inline-flex items-center gap-2 text-brand-orange hover:underline mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Order History</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors">
              View and track all your orders
            </p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange dark:focus:ring-offset-gray-900 ${
                  filter === 'all'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={filter === 'all'}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange dark:focus:ring-offset-gray-900 ${
                  filter === 'pending'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={filter === 'pending'}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('shipped')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange dark:focus:ring-offset-gray-900 ${
                  filter === 'shipped'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={filter === 'shipped'}
              >
                Shipped ({orders.filter(o => o.status === 'shipped').length})
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange dark:focus:ring-offset-gray-900 ${
                  filter === 'delivered'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={filter === 'delivered'}
              >
                Delivered ({orders.filter(o => o.status === 'delivered').length})
              </button>
            </div>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4 transition-colors" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">No orders found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                {filter === 'all' 
                  ? "You haven't placed any orders yet" 
                  : `No ${filter} orders`}
              </p>
              <Link href="/">
                <Button>Start Shopping</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 transition-colors">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                          Placed on {new Date(order.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-lg font-bold text-brand-orange">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden transition-colors">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Tracking Number</p>
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-mono transition-colors">{order.trackingNumber}</p>
                        </div>
                        {order.estimatedDelivery && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Estimated Delivery</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100 transition-colors">
                              {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="secondary" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>

                    {order.status === 'delivered' && (
                      <ReorderButton
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                        itemCount={order.itemCount}
                        variant="primary"
                      />
                    )}

                    {order.trackingNumber && (
                      <a
                        href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                      >
                        <Truck className="w-4 h-4" />
                        Track Package
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

