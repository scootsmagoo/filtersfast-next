/**
 * Cart Recovery Page
 * Restore abandoned cart via recovery link from email
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface RecoveredCart {
  id: number;
  email: string;
  cart_items: CartItem[];
  cart_value: number;
  abandoned_at: string;
}

export default function CartRecoveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [cart, setCart] = useState<RecoveredCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [token]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/abandoned-carts/recover/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to recover cart');
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverCart = async () => {
    if (!cart) return;

    setRecovering(true);
    try {
      // TODO: Restore cart to localStorage/session
      // This would integrate with your cart system
      
      // For now, just redirect to cart with items
      // In production, you'd add items to the cart first
      
      localStorage.setItem('recovered_cart', JSON.stringify(cart.cart_items));
      
      // Show success message
      router.push('/cart?recovered=true');
    } catch (err: any) {
      setError('Failed to restore cart');
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"
            role="img"
            aria-label="Loading spinner"
          />
          <p className="mt-4 text-gray-600">Loading your cart...</p>
          <span className="sr-only">Please wait while we load your cart information</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4" role="img" aria-label="Sad emoji">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart Not Found</h1>
          <div role="alert" aria-live="assertive">
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          <Button 
            onClick={() => router.push('/')} 
            variant="primary"
            aria-label="Continue shopping on homepage"
          >
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back! 👋
          </h1>
          <p className="text-gray-600">
            We saved your cart for you. Ready to complete your purchase?
          </p>
        </div>

        {/* Cart Items Card */}
        <Card className="p-6 mb-6" role="region" aria-labelledby="cart-items-heading">
          <h2 id="cart-items-heading" className="text-xl font-semibold text-gray-900 mb-4">Your Cart Items</h2>
          
          <ul className="space-y-4" role="list" aria-label="Cart items">
            {cart.cart_items.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="sr-only">Quantity:</span>
                    {item.quantity}
                    <span className="sr-only"> item{item.quantity !== 1 ? 's' : ''}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    <span className="sr-only">Total price:</span>
                    ${item.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="sr-only">Unit price:</span>
                    ${(item.price / item.quantity).toFixed(2)} each
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${cart.cart_value.toFixed(2)}
              </span>
            </div>
            {cart.cart_value >= 50 && (
              <p className="text-sm text-green-600 font-medium mt-2">
                ✓ FREE SHIPPING included!
              </p>
            )}
          </div>
        </Card>

        {/* CTA Buttons */}
        <div className="space-y-4" role="navigation" aria-label="Cart actions">
          <Button
            onClick={handleRecoverCart}
            variant="primary"
            className="w-full text-lg py-4"
            disabled={recovering}
            aria-disabled={recovering}
            aria-label={recovering ? 'Restoring your cart, please wait' : 'Complete purchase and proceed to checkout'}
          >
            {recovering ? (
              <>
                <span aria-hidden="true">Restoring Cart...</span>
                <span className="sr-only">Restoring your cart, please wait</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">Complete My Purchase →</span>
                <span className="sr-only">Complete purchase and proceed to checkout</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
            aria-label="Continue shopping without restoring cart"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center" role="region" aria-label="Trust indicators and guarantees">
          <div className="p-4">
            <div className="text-3xl mb-2" role="img" aria-label="Delivery truck">🚚</div>
            <p className="text-sm font-medium text-gray-900">Free Shipping</p>
            <p className="text-xs text-gray-500">On orders $50+</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2" role="img" aria-label="Returns">↩️</div>
            <p className="text-sm font-medium text-gray-900">365-Day Returns</p>
            <p className="text-xs text-gray-500">Risk-free</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2" role="img" aria-label="United States flag">🇺🇸</div>
            <p className="text-sm font-medium text-gray-900">Made in USA</p>
            <p className="text-xs text-gray-500">Premium quality</p>
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200 text-center" role="complementary" aria-label="Customer support information">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800 mb-3">
            Our filter experts are here to assist you!
          </p>
          <p className="text-lg font-bold text-blue-900">
            <span className="text-3xl" role="img" aria-label="Phone">📞</span>
            <a href="tel:1-866-301-3905" className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded">
              1-866-301-3905
            </a>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            <time>Monday-Friday, 8am-6pm EST</time>
          </p>
        </Card>
      </div>
    </div>
  );
}

