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
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/account"
              className="inline-flex items-center gap-2 text-brand-orange hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
            <p className="text-gray-600 mt-2">
              View and track all your orders
            </p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('shipped')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'shipped'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Shipped ({orders.filter(o => o.status === 'shipped').length})
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'delivered'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivered ({orders.filter(o => o.status === 'delivered').length})
              </button>
            </div>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
              <p className="text-gray-600 mb-6">
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
                        <h3 className="font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-lg font-bold text-brand-orange">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
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
                      <p className="text-sm text-gray-600">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                          <p className="text-sm text-gray-900 font-mono">{order.trackingNumber}</p>
                        </div>
                        {order.estimatedDelivery && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                            <p className="text-sm text-gray-900">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
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

