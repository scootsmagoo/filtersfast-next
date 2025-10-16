'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { dispatch } = useCart();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentMethodParam = searchParams.get('payment_method');
    const orderId = searchParams.get('order_id');
    
    if (sessionId || orderId) {
      // Clear the cart on successful payment
      dispatch({ type: 'CLEAR_CART' });
      
      // Set payment method
      if (paymentMethodParam) {
        setPaymentMethod(paymentMethodParam);
      }
      
      // In a real app, you might want to fetch session details from your backend
      // For now, we'll just show a success message
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [searchParams, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-brand-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-brand-gray-900 mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-brand-gray-600 mb-6">
              Thank you for your purchase. Your order has been successfully processed via {paymentMethod === 'paypal' ? 'PayPal' : 'Stripe'} and you will receive a confirmation email shortly.
            </p>

            <div className="bg-brand-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-brand-gray-900 mb-2">What's Next?</h2>
              <ul className="text-sm text-brand-gray-600 space-y-1 text-left">
                <li>• You'll receive an order confirmation email</li>
                <li>• Your order will be processed within 1-2 business days</li>
                <li>• You'll get a tracking number once shipped</li>
                <li>• Expected delivery: 3-5 business days</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="primary">
                <a href="/">Continue Shopping</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/refrigerator-filters">Shop More Filters</a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
