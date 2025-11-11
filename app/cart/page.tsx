'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem, type CartItemId } from '@/lib/cart-context';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IdMeVerificationButton from '@/components/idme/IdMeVerificationButton';
import SubscriptionWidget from '@/components/subscriptions/SubscriptionWidget';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Package, Gift, Tag } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const items = cart.items as Array<CartItem & {
    isReward?: boolean;
    maxCartQty?: number | null;
    blockedReason?: string | null;
    retExclude?: 0 | 1 | 2;
  }>;
  const appliedDeals = ((cart as any).appliedDeals ?? []) as Array<{ id: number; description: string }>;
  const { total, itemCount, updateQuantity, updateSubscription, removeItem, clearCart } = cart;
  const [removingId, setRemovingId] = useState<CartItemId | null>(null);
  const hasBlockedItems = items.some(item => item.blockedReason);

  const handleRemoveItem = (id: CartItemId) => {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingId(null);
    }, 300);
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (hasBlockedItems) {
      alert('Please remove unavailable items before proceeding to checkout.');
      return;
    }
    router.push('/checkout');
  };

  // Calculate subscription discounts
  const calculateTotals = () => {
    let subtotal = 0;
    let subscriptionDiscount = 0;

    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      // Apply 5% subscription discount if enabled
      if (item.subscription?.enabled) {
        subscriptionDiscount += itemTotal * 0.05;
      }
    });

    const total = subtotal - subscriptionDiscount;

    return { subtotal, subscriptionDiscount, total };
  };

  const { subtotal, subscriptionDiscount, total: calculatedTotal } = calculateTotals();
  const rewardItems = items.filter(item => item.isReward);
  const activeDeal = appliedDeals[0] ?? null;

  const hasSubscriptions = items.some(item => item.subscription?.enabled);

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 transition-colors">Shopping Cart</h1>
          
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 transition-colors">
              <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Your cart is empty
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto transition-colors">
              Looks like you haven't added any filters yet. Browse our products to find what you need!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/air-filters">
                <Button className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Shop Air Filters
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="secondary" className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Shopping Cart</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors">{itemCount} {itemCount === 1 ? 'item' : 'items'} in cart</p>
          </div>
          
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        {hasBlockedItems && (
          <Card className="mb-6 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 transition-colors" role="alert">
            <div className="p-4 text-sm">
              One or more items are temporarily unavailable and must be removed before checkout.
            </div>
          </Card>
        )}

        {/* Applicable Deal Banner */}
        {rewardItems.length > 0 && (
          <Card 
            className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-300 dark:border-orange-700"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0" aria-hidden="true">
                <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  {activeDeal ? 'Special Offer Applied!' : 'Free Gift Added!'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {activeDeal ? (
                    <>
                      Your cart qualifies for <strong>{activeDeal.description}</strong>.
                    </>
                  ) : (
                    <>You've unlocked a complimentary reward with your purchase.</>
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {rewardItems.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                </p>
                <Link href="/deals">
                  <Button variant="secondary" size="sm" className="flex items-center gap-2">
                    View All Special Offers
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Deal Notification - Close to qualifying */}
        {rewardItems.length === 0 && calculatedTotal > 0 && (
          <Card className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Check out our <Link href="/deals" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Special Offers</Link> to see if you qualify for free products!
                  </p>
                </div>
              </div>
              <Link href="/deals">
                <Button variant="ghost" size="sm">
                  View Offers
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const isReward = Boolean(item.isReward);
              const maxCartQty = item.maxCartQty && item.maxCartQty > 0 ? item.maxCartQty : null;
              const sanitizedItemId = String(item.id ?? item.sku ?? 'item').replace(/[^a-zA-Z0-9_-]/g, '');
              const quantityLimitMessageId = maxCartQty ? `cart-max-limit-${sanitizedItemId || 'item'}` : undefined;
              const retExcludeLevel = item.retExclude ?? 0;
              const returnPolicyMessage =
                retExcludeLevel === 2
                  ? 'All sales are final for this item.'
                  : retExcludeLevel === 1
                  ? 'This item is eligible for refunds only.'
                  : null;
              const blockedReasonText = item.blockedReason ?? null;
              return (
                <Card
                  key={item.id}
                  className={`p-6 transition-all duration-300 ${
                    removingId === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${isReward ? 'border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden transition-colors">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          role="img"
                          aria-label={`${item.name} product image not available`}
                          className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
                        >
                          <Package className="w-8 h-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-colors">{item.brand}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">SKU: {item.sku}</p>
                          {isReward && (
                            <>
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-300 text-xs font-semibold mt-2">
                                Free Gift
                              </span>
                              <p className="sr-only">
                                This promotional item is automatically added and will be removed if its qualifying product is removed.
                              </p>
                            </>
                          )}
                          {/* Display selected options */}
                          {item.options && Object.keys(item.options).length > 0 && !isReward && (
                            <div className="mt-2 space-y-1">
                              {Object.entries(item.options).map(([groupId, optionId]) => (
                                <p key={groupId} className="text-xs text-gray-500 dark:text-gray-400">
                                  Option: {optionId}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {!isReward && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        {isReward ? (
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            Quantity: {item.quantity}
                          </div>
                        ) : blockedReasonText ? (
                          <div className="text-sm font-medium text-red-600 dark:text-red-400" role="status" aria-live="assertive">
                            Temporarily unavailable
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium transition-colors">Qty:</span>
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              
                              <input
                                type="number"
                                min="1"
                                max={maxCartQty ?? 999}
                                value={item.quantity}
                                aria-describedby={quantityLimitMessageId}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (Number.isNaN(value) || value <= 0) return;
                                  const clampedValue = maxCartQty !== null
                                    ? Math.min(value, maxCartQty)
                                    : Math.min(value, 999);
                                  updateQuantity(item.id, clampedValue);
                                }}
                                className="w-16 text-center border-x border-gray-300 dark:border-gray-600 py-2 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
                              />
                              
                              <button
                                onClick={() => {
                                  const nextValue = maxCartQty !== null
                                    ? Math.min(item.quantity + 1, maxCartQty)
                                    : item.quantity + 1;
                                  updateQuantity(item.id, nextValue);
                                }}
                                disabled={maxCartQty !== null && item.quantity >= maxCartQty}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {(() => {
                              const limit = maxCartQty;
                              if (limit === null || item.quantity < limit) {
                                return null;
                              }
                              return (
                                <p
                                  id={quantityLimitMessageId}
                                  role="status"
                                  aria-live="polite"
                                  className="text-xs text-orange-600 dark:text-orange-400 mt-1"
                                >
                                  Maximum {limit} per order for this product.
                                </p>
                              );
                            })()}
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-right">
                          {isReward ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 transition-colors">
                              FREE
                            </p>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                                ${item.price.toFixed(2)} each
                              </p>
                              <p className="text-lg font-bold text-brand-orange">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subscribe & Save Section */}
                      {!isReward && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors">
                            Subscribe & Save
                          </h4>
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              id={`subscribe-${item.id}`}
                              checked={item.subscription?.enabled || false}
                              onChange={(e) => {
                                updateSubscription(item.id, e.target.checked ? {
                                  enabled: true,
                                  frequency: item.subscription?.frequency || 6
                                } : undefined);
                              }}
                              className="mt-1 w-4 h-4 text-brand-orange focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 border-gray-300 rounded"
                              aria-describedby={`subscribe-${item.id}-description`}
                            />
                            <label 
                              htmlFor={`subscribe-${item.id}`}
                              className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                            >
                              Subscribe to this product and get 5% off, plus FREE Shipping on all orders! (US Only)
                            </label>
                            <span id={`subscribe-${item.id}-description`} className="sr-only">
                              Enable subscription to save 5% and get free shipping on this item
                            </span>
                          </div>
                          
                          {/* Frequency Selector (shown if subscription enabled) */}
                          {item.subscription?.enabled && (
                            <div className="mt-3 flex items-center gap-2">
                              <label htmlFor={`frequency-${item.id}`} className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                                Ship Every
                              </label>
                              <select
                                id={`frequency-${item.id}`}
                                value={item.subscription.frequency}
                                onChange={(e) => {
                                  updateSubscription(item.id, {
                                    enabled: true,
                                    frequency: parseInt(e.target.value)
                                  });
                                }}
                                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                                aria-label="Select subscription delivery frequency"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(months => (
                                  <option key={months} value={months}>
                                    {months} month{months > 1 ? 's' : ''} {months === 6 ? '(recommended)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {!isReward && (blockedReasonText || returnPolicyMessage) && (
                        <div className="mt-4 space-y-2" role="status" aria-live="polite">
                          {blockedReasonText && (
                            <div className="rounded-md border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 px-3 py-2 transition-colors">
                              Temporarily unavailable{`: ${blockedReasonText}`}
                            </div>
                          )}
                          {returnPolicyMessage && (
                            <div className="rounded-md border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-2 transition-colors">
                              {returnPolicyMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              {/* Free Shipping Banner for Subscriptions */}
              {hasSubscriptions && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2 transition-colors">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    You've earned FREE shipping!
                  </p>
                </div>
              )}
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300 transition-colors">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {/* Subscription Discount */}
                {hasSubscriptions && subscriptionDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 transition-colors">
                    <span>Subscribe & Save Discount</span>
                    <span className="font-medium">-${subscriptionDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600 dark:text-gray-300 transition-colors">
                  <span>Shipping</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    {hasSubscriptions ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">FREE</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-300 transition-colors">
                  <span>Tax</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Calculated at checkout</span>
                </div>
              </div>

              {rewardItems.length > 0 && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg transition-colors">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 transition-colors">
                    Free gifts in your cart:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-200">
                    {rewardItems.map(item => (
                      <li key={`summary-${item.id}`}>
                        {item.name} <span className="text-xs">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {appliedDeals.length > 0 && (
                    <p className="mt-2 text-xs text-green-700 dark:text-green-300 transition-colors">
                      Triggered by: {appliedDeals.map(({ description }) => description).join(', ')}
                    </p>
                  )}
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Estimated Total</span>
                  <span className="text-2xl font-bold text-brand-orange">${calculatedTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                disabled={hasBlockedItems}
                className="w-full flex items-center justify-center gap-2 mb-4"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <Link href="/">
                <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Continue Shopping
                </Button>
              </Link>
              
              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3 transition-colors">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Free shipping on orders over $50</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30-day return policy</span>
                </div>
              </div>

              {/* ID.me Military & First Responder Discount */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors">
                <IdMeVerificationButton compact />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

