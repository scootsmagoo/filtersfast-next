/**
 * One-Click Checkout Component
 * 
 * Streamlined checkout button for returning customers with saved payment methods
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useCart } from '@/lib/cart-context';
import { CreditCard, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface OneClickCheckoutProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

interface EligibilityCheck {
  eligible: boolean;
  hasPaymentMethod: boolean;
  hasShippingAddress: boolean;
  paymentMethodCount: number;
  addressCount: number;
}

export default function OneClickCheckout({
  className = '',
  variant = 'primary' as const,
  size = 'md',
  showIcon = true,
}: OneClickCheckoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Check eligibility for one-click checkout with debouncing
  useEffect(() => {
    if (!session?.user) {
      setEligibility({
        eligible: false,
        hasPaymentMethod: false,
        hasShippingAddress: false,
        paymentMethodCount: 0,
        addressCount: 0,
      });
      setCheckingEligibility(false);
      return;
    }

    // Debounce eligibility check to prevent rapid requests during development
    const timeoutId = setTimeout(async () => {
      try {
        setCheckingEligibility(true);
        const [paymentMethodsRes, addressesRes] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/addresses'),
        ]);

        // Handle rate limit errors gracefully
        if (paymentMethodsRes.status === 429 || addressesRes.status === 429) {
          console.warn('Rate limited - eligibility check will retry later');
          setEligibility({
            eligible: false,
            hasPaymentMethod: false,
            hasShippingAddress: false,
            paymentMethodCount: 0,
            addressCount: 0,
          });
          setCheckingEligibility(false);
          return;
        }

        const paymentMethods = paymentMethodsRes.ok ? await paymentMethodsRes.json() : [];
        const addresses = addressesRes.ok ? await addressesRes.json() : [];

        const hasValidPaymentMethod = paymentMethods.some(
          (pm: any) => !pm.is_expired && pm.is_default
        );
        const hasDefaultAddress = addresses.some((addr: any) => addr.is_default === 1);

        setEligibility({
          eligible: hasValidPaymentMethod && hasDefaultAddress && items.length > 0,
          hasPaymentMethod: paymentMethods.length > 0,
          hasShippingAddress: addresses.length > 0,
          paymentMethodCount: paymentMethods.length,
          addressCount: addresses.length,
        });
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setEligibility({
          eligible: false,
          hasPaymentMethod: false,
          hasShippingAddress: false,
          paymentMethodCount: 0,
          addressCount: 0,
        });
      } finally {
        setCheckingEligibility(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [session?.user?.id, items.length]); // Only depend on user ID, not entire session object

  const handleOneClickCheckout = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    // WCAG 2.1.1 Keyboard - Support keyboard activation
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
    
    if (e) {
      e.preventDefault();
    }

    if (!session?.user) {
      router.push('/sign-in?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/one-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            productId: item.productId || item.id,
            name: item.name,
            brand: item.brand,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            productType: item.productType,
            metadata: item.metadata,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error_code === 'NO_PAYMENT_METHOD' || data.error_code === 'NO_SHIPPING_ADDRESS') {
          // Redirect to standard checkout with helpful message
          router.push('/checkout?setup=required');
          return;
        }

        if (data.requires_action) {
          // Payment requires 3D Secure or other action
          // Redirect to Stripe's hosted page
          router.push(`/checkout/payment-action?client_secret=${data.client_secret}`);
          return;
        }

        throw new Error(data.error || 'Failed to process checkout');
      }

      // Success - clear cart and redirect to success page
      clearCart();
      router.push(`/checkout/success?orderId=${data.order_id}&orderNumber=${data.order_number}&oneClick=true`);
    } catch (err: any) {
      console.error('One-click checkout error:', err);
      setError(err.message || 'Failed to process checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  // Don't show if not logged in or cart is empty
  if (!session?.user || items.length === 0) {
    return null;
  }

  // Show loading state while checking eligibility
  if (checkingEligibility) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
        aria-label="Checking one-click checkout eligibility"
        aria-busy="true"
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
        <span>Checking...</span>
      </Button>
    );
  }

  // Not eligible - show setup prompt
  if (!eligibility?.eligible) {
    const missingItems: string[] = [];
    if (!eligibility?.hasPaymentMethod) {
      missingItems.push('payment method');
    }
    if (!eligibility?.hasShippingAddress) {
      missingItems.push('shipping address');
    }

    if (missingItems.length === 0) {
      return null; // Shouldn't happen, but just in case
    }

    return (
      <div className={className}>
        <Button
          onClick={() => window.location.href = '/account/settings'}
          variant="secondary"
          size={size}
          className="w-full"
          aria-label={`Set up one-click checkout by adding ${missingItems.join(' and ')}`}
        >
          <CreditCard className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>Set Up One-Click Checkout</span>
        </Button>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center transition-colors">
          Add a {missingItems.join(' and ')} to enable one-click checkout
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div 
          className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start transition-colors"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="ml-3 text-sm text-red-800 dark:text-red-300 transition-colors">{error}</p>
        </div>
      )}

      <Button
        onClick={handleOneClickCheckout}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOneClickCheckout(e);
          }
        }}
        disabled={isProcessing}
        variant={variant}
        size={size}
        className="w-full"
        aria-label={isProcessing ? 'Processing your order' : 'Complete purchase with one-click checkout'}
        aria-busy={isProcessing}
        aria-describedby="one-click-description"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {showIcon && <Zap className="w-4 h-4 mr-2" aria-hidden="true" />}
            <span>Buy Now with One-Click</span>
          </>
        )}
      </Button>

      <p id="one-click-description" className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center transition-colors">
        Using your saved payment method and default address
      </p>
    </div>
  );
}

/**
 * One-Click Checkout Eligibility Badge
 * Shows eligibility status and setup prompts
 */
export function OneClickCheckoutEligibility() {
  const { data: session } = useSession();
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Debounce eligibility check to prevent rapid requests
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const [paymentMethodsRes, addressesRes] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/addresses'),
        ]);

        // Handle rate limit errors gracefully
        if (paymentMethodsRes.status === 429 || addressesRes.status === 429) {
          // Don't show error, just don't display eligibility banner
          setLoading(false);
          return;
        }

        const paymentMethods = paymentMethodsRes.ok ? await paymentMethodsRes.json() : [];
        const addresses = addressesRes.ok ? await addressesRes.json() : [];

        const hasValidPaymentMethod = paymentMethods.some(
          (pm: any) => !pm.is_expired && pm.is_default
        );
        const hasDefaultAddress = addresses.some((addr: any) => addr.is_default === 1);

        setEligibility({
          eligible: hasValidPaymentMethod && hasDefaultAddress,
          hasPaymentMethod: paymentMethods.length > 0,
          hasShippingAddress: addresses.length > 0,
          paymentMethodCount: paymentMethods.length,
          addressCount: addresses.length,
        });
      } catch (error) {
        console.error('Error checking eligibility:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [session?.user?.id]); // Only depend on user ID

  if (!session?.user || loading) {
    return null;
  }

  if (eligibility?.eligible) {
    return (
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" role="status" aria-live="polite">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-300">
              One-Click Checkout Available
            </h3>
            <p className="text-sm text-green-700 dark:text-green-200 mt-1">
              You can use one-click checkout on your next purchase for faster checkout.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const missingItems: string[] = [];
  if (!eligibility?.hasPaymentMethod) {
    missingItems.push('payment method');
  }
  if (!eligibility?.hasShippingAddress) {
    missingItems.push('shipping address');
  }

  if (missingItems.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" role="region" aria-labelledby="one-click-setup-heading">
      <div className="flex items-start">
        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="ml-3">
          <h3 id="one-click-setup-heading" className="text-sm font-medium text-blue-900 dark:text-blue-300">
            Enable One-Click Checkout
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
            Add a {missingItems.join(' and ')} to enable one-click checkout for faster purchases.
          </p>
          <a
            href="/account/payment-methods"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
            aria-label={`Set up ${missingItems.join(' and ')} for one-click checkout`}
          >
            Set up now →
          </a>
        </div>
      </div>
    </Card>
  );
}

