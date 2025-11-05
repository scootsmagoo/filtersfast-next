'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';
import ReviewStars from './ReviewStars';
import { useState } from 'react';
import { Price, Savings } from './Price';
import SubscriptionWidget from '@/components/subscriptions/SubscriptionWidget';

interface Product {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  badges?: string[];
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addItem } = useCart();
  const { announceSuccess } = useStatusAnnouncement();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState(6);
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: product.price,
      image: product.image,
      ...(subscriptionEnabled && {
        subscription: {
          enabled: true,
          frequency: subscriptionFrequency
        }
      })
    });
    
    // Announce to screen readers
    const message = subscriptionEnabled 
      ? `${product.name} added to cart with ${subscriptionFrequency}-month subscription`
      : `${product.name} added to cart`;
    announceSuccess(message);
    
    setIsAdding(false);
    setJustAdded(true);
    
    // Reset "just added" state after 2 seconds
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleSubscriptionChange = (enabled: boolean, frequency: number) => {
    setSubscriptionEnabled(enabled);
    setSubscriptionFrequency(frequency);
  };

  // Check if product is FiltersFast branded
  const isPrivateLabel = product.brand?.toLowerCase().includes('filtersfast') ||
                        product.brand?.toLowerCase().includes('filters fast');

  if (viewMode === 'list') {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Image */}
          <div className="md:col-span-3">
            <div className="aspect-square bg-brand-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors">
              {discount > 0 && (
                <div 
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded font-bold text-sm z-10"
                  aria-label={`${discount} percent discount`}
                >
                  -{discount}%
                </div>
              )}
              <img
                src={product.image}
                alt={`${product.name} - ${product.brand} filter`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="text-brand-gray-400 dark:text-gray-500 text-sm hidden transition-colors">Product Image</div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-6 flex flex-col justify-center">
            <div className="text-sm text-brand-gray-600 dark:text-gray-300 mb-1 transition-colors">{product.brand} • SKU: {product.sku}</div>
            <a 
              href={`/products/${product.id}`}
              className="text-lg font-bold text-brand-gray-900 dark:text-gray-100 mb-2 hover:text-brand-orange transition-colors cursor-pointer block"
            >
              {product.name}
            </a>
            <div className="flex items-center gap-2 mb-2">
              <ReviewStars rating={product.rating} size="sm" />
              <a
                href={`/products/${product.id}#reviews`}
                className="text-sm text-brand-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors"
              >
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </a>
            </div>
            {product.badges && (
              <div className="flex gap-2 flex-wrap" role="list" aria-label="Product badges">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-1 bg-brand-blue/10 text-brand-blue text-xs font-semibold rounded"
                    role="listitem"
                    aria-label={`${badge} product`}
                  >
                    {badge.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price & Actions */}
          <div className="md:col-span-3 flex flex-col justify-center items-end">
            <div className="text-right mb-4">
              <div className="text-2xl font-bold text-brand-orange">
                <Price 
                  amountUSD={product.price}
                  originalPrice={product.originalPrice}
                  showCurrency
                />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Availability: </span>In Stock
              </div>
            </div>
            
            {/* Subscription Widget - Compact */}
            <div className="w-full mb-3">
              <SubscriptionWidget
                productId={product.id.toString()}
                productName={product.name}
                productPrice={product.price}
                isPrivateLabel={isPrivateLabel}
                defaultFrequency={6}
                onSubscriptionChange={handleSubscriptionChange}
                style="compact"
              />
            </div>
            
            <Button 
              onClick={handleAddToCart}
              disabled={isAdding || !product.inStock}
              className={`w-full flex items-center justify-center gap-2 ${justAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {isAdding ? 'Adding...' : subscriptionEnabled ? 'Add & Subscribe' : 'Add to Cart'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="aspect-square bg-brand-gray-100 dark:bg-gray-700 relative overflow-hidden flex-shrink-0 transition-colors">
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm z-10">
            -{discount}%
          </div>
        )}
        {product.badges && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="px-2 py-1 bg-brand-blue text-white text-xs font-semibold rounded"
              >
                {badge.toUpperCase()}
              </span>
            ))}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center text-brand-gray-400 dark:text-gray-500 transition-colors">
          Product Image
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all"></div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-sm text-brand-gray-600 dark:text-gray-300 mb-3 transition-colors">{product.brand} • {product.sku}</div>
        <a 
          href={`/products/${product.id}`}
          className="text-base font-bold text-brand-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-brand-orange transition-colors cursor-pointer min-h-[3rem] block mb-3"
        >
          {product.name}
        </a>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <ReviewStars rating={product.rating} size="sm" />
          <a
            href={`/products/${product.id}#reviews`}
            className="text-sm text-brand-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors"
          >
            ({product.reviewCount})
          </a>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-brand-orange">
            <Price 
              amountUSD={product.price}
              originalPrice={product.originalPrice}
              showCurrency
            />
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
            <Check className="w-4 h-4" />
            In Stock
          </div>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-grow"></div>

        {/* Subscription Widget - Compact */}
        <div className="mb-3">
          <SubscriptionWidget
            productId={product.id.toString()}
            productName={product.name}
            productPrice={product.price}
            isPrivateLabel={isPrivateLabel}
            defaultFrequency={6}
            onSubscriptionChange={handleSubscriptionChange}
            style="compact"
          />
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          disabled={isAdding || !product.inStock}
          className={`w-full flex items-center justify-center gap-2 mt-auto ${justAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {justAdded ? (
            <>
              <Check className="w-5 h-5" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              {isAdding ? 'Adding...' : subscriptionEnabled ? 'Add & Subscribe' : 'Add to Cart'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

