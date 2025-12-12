'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import ReorderButton from '@/components/orders/ReorderButton';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const orderId = params.id as string;
  const [loading, setLoading] = useState(true);

  // Mock order data
  const order = {
    id: orderId,
    orderNumber: 'FF-2025-001',
    date: '2025-01-15T10:30:00',
    status: 'delivered',
    total: 89.99,
    subtotal: 89.98,
    shipping: 0,
    tax: 7.20,
    items: [
      {
        id: 1,
        name: 'GE MWF Refrigerator Water Filter',
        brand: 'GE',
        sku: 'MWF',
        quantity: 2,
        price: 44.99,
        image: '/products/ge-mwf.jpg'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'United States'
    },
    paymentMethod: {
      type: 'Credit Card',
      last4: '4242'
    },
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
    deliveryDate: '2025-01-18',
    timeline: [
      { status: 'Order Placed', date: '2025-01-15T10:30:00', completed: true },
      { status: 'Processing', date: '2025-01-15T14:00:00', completed: true },
      { status: 'Shipped', date: '2025-01-16T08:00:00', completed: true },
      { status: 'Out for Delivery', date: '2025-01-18T06:00:00', completed: true },
      { status: 'Delivered', date: '2025-01-18T14:30:00', completed: true }
    ]
  };

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in?redirect=/account/orders');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // Simulate API call
    const fetchOrder = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    };

    if (session) {
      fetchOrder();
    }
  }, [session]);

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 transition-colors">Loading order details...</p>
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
              href="/account/orders"
              className="inline-flex items-center gap-2 text-brand-orange hover:underline mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors">
                  Placed on {new Date(order.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Invoice
                </Button>
                <ReorderButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  itemCount={order.items.length}
                  variant="primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Order Timeline</h2>
                
                <div className="relative">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 pb-8 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.completed ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {event.completed ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        {index < order.timeline.length - 1 && (
                          <div className={`w-0.5 h-full mt-2 ${
                            event.completed ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <h3 className={`font-semibold transition-colors ${
                          event.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {event.status}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.trackingNumber && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors">
                            Tracking Information
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 transition-colors">
                            Carrier: {order.carrier}
                          </p>
                          <p className="text-sm font-mono text-gray-900 dark:text-white mb-3 transition-colors">
                            {order.trackingNumber}
                          </p>
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-orange hover:underline font-medium transition-colors"
                          >
                            Track on {order.carrier} →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Order Items */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Order Items</h2>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">{item.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">{item.brand} • SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">Quantity: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white transition-colors">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 transition-colors">Order Summary</h3>
                
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Subtotal</span>
                    <span className="text-gray-900 dark:text-white transition-colors">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Shipping</span>
                    <span className="text-gray-900 dark:text-white transition-colors">
                      {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Tax</span>
                    <span className="text-gray-900 dark:text-white transition-colors">${order.tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900 dark:text-white transition-colors">Total</span>
                  <span className="text-brand-orange">${order.total.toFixed(2)}</span>
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-bold text-gray-900 dark:text-white transition-colors">Shipping Address</h3>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 transition-colors">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-bold text-gray-900 dark:text-white transition-colors">Payment Method</h3>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                  <p className="font-medium">{order.paymentMethod.type}</p>
                  <p className="text-gray-600 dark:text-gray-400 transition-colors">**** **** **** {order.paymentMethod.last4}</p>
                </div>
              </Card>

              {/* Need Help */}
              <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 transition-colors">Need Help?</h3>
                
                <div className="space-y-3 text-sm">
                  <a href="mailto:support@filtersfast.com" className="flex items-center gap-2 text-brand-orange hover:underline transition-colors">
                    <Mail className="w-4 h-4" />
                    support@filtersfast.com
                  </a>
                  <a href="tel:1-800-555-0123" className="flex items-center gap-2 text-brand-orange hover:underline transition-colors">
                    <Phone className="w-4 h-4" />
                    1-800-555-0123
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

