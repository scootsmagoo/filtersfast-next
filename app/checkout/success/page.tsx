'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, Package, Mail, Home, Printer } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'UNKNOWN';
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from localStorage or session
    const savedEmail = localStorage.getItem('checkout-email');
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem('checkout-email');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-4">
              Thank you for your purchase
            </p>
            
            <div className="inline-flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-lg">
              <span className="text-sm text-gray-600">Order Number:</span>
              <span className="text-lg font-bold text-brand-orange">#{orderNumber}</span>
            </div>
          </div>

          {/* Order Details Card */}
          <Card className="p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              What's Next?
            </h2>
            
            <div className="space-y-6">
              {/* Email Confirmation */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-gray-600">
                    We've sent an order confirmation to {email || 'your email address'}. 
                    You'll receive shipping updates as your order progresses.
                  </p>
                </div>
              </div>

              {/* Processing */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-brand-orange" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Order Processing
                  </h3>
                  <p className="text-sm text-gray-600">
                    We're preparing your order for shipment. Most orders ship within 1-2 business days.
                  </p>
                </div>
              </div>

              {/* Tracking */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Track Your Order
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    You'll receive tracking information once your order ships. 
                    Expected delivery: 3-5 business days.
                  </p>
                  <Link 
                    href="/account/orders" 
                    className="text-sm text-brand-orange hover:underline font-medium"
                  >
                    View order status →
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-sm text-brand-orange hover:underline"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">#{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">Credit Card</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Continue Shopping
              </Button>
            </Link>
            
            <Link href="/account/orders" className="flex-1">
              <Button className="w-full flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                View Order Status
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Need help with your order?
            </p>
            <Link 
              href="/support" 
              className="text-sm text-brand-orange hover:underline font-medium"
            >
              Contact Customer Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
