'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { loadStripe } from '@stripe/stripe-js';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PayPalButton from '@/components/payments/PayPalButton';

export default function CheckoutPage() {
  const { state: cart, dispatch } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items,
        }),
      });

      const { sessionId } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      } as any);

      if (error) {
        setError(error.message || 'An error occurred during checkout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalSuccess = (orderId: string) => {
    // Clear the cart on successful payment
    dispatch({ type: 'CLEAR_CART' });
    
    // Redirect to success page
    window.location.href = `/checkout/success?payment_method=paypal&order_id=${orderId}`;
  };

  const handlePayPalError = (error: string) => {
    setError(`PayPal Error: ${error}`);
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-brand-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-brand-gray-600 mb-6">Add some filters to your cart to get started!</p>
          <Button asChild variant="primary">
            <a href="/refrigerator-filters">Shop Filters</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-brand-gray-900 mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-brand-gray-200 last:border-b-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-gray-900">{item.name}</h3>
                        <p className="text-sm text-brand-gray-600">{item.brand} - {item.sku}</p>
                        <p className="text-sm text-brand-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-brand-gray-600">
                    <span>Subtotal</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-brand-gray-600">
                    <span>Shipping</span>
                    <span>{cart.total >= 99 ? 'FREE' : '$9.99'}</span>
                  </div>
                  <div className="flex justify-between text-brand-gray-600">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-brand-gray-900 pt-2 border-t border-brand-gray-200">
                    <span>Total</span>
                    <span>${(cart.total + (cart.total >= 99 ? 0 : 9.99)).toFixed(2)}</span>
                  </div>
                </div>

                {cart.total < 99 && (
                  <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-brand-orange-800">
                      Add ${(99 - cart.total).toFixed(2)} more for free shipping!
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-4">Choose Payment Method</h3>
                  
                  <div className="space-y-4">
                    {/* Stripe Payment */}
                    <div className="border-2 border-brand-gray-200 rounded-lg p-4 hover:border-brand-orange transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="stripe"
                            name="payment"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                            className="text-brand-orange focus:ring-brand-orange"
                          />
                          <label htmlFor="stripe" className="font-medium text-brand-gray-900 cursor-pointer">
                            Credit/Debit Card
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                            S
                          </div>
                          <span className="text-sm text-brand-gray-600">Stripe</span>
                        </div>
                      </div>
                      
                      {paymentMethod === 'stripe' && (
                        <Button
                          onClick={handleCheckout}
                          disabled={isLoading}
                          className="w-full"
                          variant="primary"
                        >
                          {isLoading ? 'Processing...' : 'Pay with Card'}
                        </Button>
                      )}
                    </div>

                    {/* PayPal Payment */}
                    <div className="border-2 border-brand-gray-200 rounded-lg p-4 hover:border-brand-orange transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="paypal"
                            name="payment"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                            className="text-brand-orange focus:ring-brand-orange"
                          />
                          <label htmlFor="paypal" className="font-medium text-brand-gray-900 cursor-pointer">
                            PayPal Express Checkout
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                            P
                          </div>
                          <span className="text-sm text-brand-gray-600">PayPal</span>
                        </div>
                      </div>
                      
                      {paymentMethod === 'paypal' && (
                        <PayPalButton
                          onSuccess={handlePayPalSuccess}
                          onError={handlePayPalError}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Info */}
            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">Payment Information</h2>
                
                <div className="space-y-4">
                  <div className="bg-brand-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-brand-gray-900 mb-2">Secure Payment</h3>
                    <p className="text-sm text-brand-gray-600 mb-3">
                      Your payment information is encrypted and secure. We use industry-leading payment processors.
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          S
                        </div>
                        <span className="text-sm text-brand-gray-600">Stripe</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                          P
                        </div>
                        <span className="text-sm text-brand-gray-600">PayPal</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-brand-gray-900 mb-2">Accepted Payment Methods</h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                        <span>• Credit Cards (Visa, Mastercard, American Express)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                        <span>• Debit Cards</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                        <span>• PayPal Express Checkout</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-brand-gray-600">
                        <span>• Digital Wallets (Apple Pay, Google Pay)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-brand-gray-900 mb-2">Order Protection</h3>
                    <ul className="text-sm text-brand-gray-600 space-y-1">
                      <li>• 30-day money-back guarantee</li>
                      <li>• Free returns on all orders</li>
                      <li>• Secure SSL encryption</li>
                      <li>• PCI DSS compliant</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
