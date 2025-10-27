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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
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
              href="/account/orders"
              className="inline-flex items-center gap-2 text-brand-orange hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-600 mt-2">
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>
                
                <div className="relative">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 pb-8 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.completed ? 'bg-green-600' : 'bg-gray-300'
                        }`}>
                          {event.completed ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        {index < order.timeline.length - 1 && (
                          <div className={`w-0.5 h-full mt-2 ${
                            event.completed ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <h3 className={`font-semibold ${
                          event.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {event.status}
                        </h3>
                        <p className="text-sm text-gray-600">
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
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Tracking Information
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Carrier: {order.carrier}
                          </p>
                          <p className="text-sm font-mono text-gray-900 mb-3">
                            {order.trackingNumber}
                          </p>
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-orange hover:underline font-medium"
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.brand} • SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
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
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-brand-orange">${order.total.toFixed(2)}</span>
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-bold text-gray-900">Shipping Address</h3>
                </div>
                
                <div className="text-sm text-gray-700 space-y-1">
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
                  <h3 className="font-bold text-gray-900">Payment Method</h3>
                </div>
                
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{order.paymentMethod.type}</p>
                  <p className="text-gray-600">**** **** **** {order.paymentMethod.last4}</p>
                </div>
              </Card>

              {/* Need Help */}
              <Card className="p-6 bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-4">Need Help?</h3>
                
                <div className="space-y-3 text-sm">
                  <a href="mailto:support@filtersfast.com" className="flex items-center gap-2 text-brand-orange hover:underline">
                    <Mail className="w-4 h-4" />
                    support@filtersfast.com
                  </a>
                  <a href="tel:1-800-555-0123" className="flex items-center gap-2 text-brand-orange hover:underline">
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

