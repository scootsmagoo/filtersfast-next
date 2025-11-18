'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { Price } from './Price';
import ReviewStars from './ReviewStars';

interface RecommendedProduct {
  product: {
    id: string;
    name: string;
    brand: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    badges?: string[];
    slug: string;
  };
  recommendationType: string;
  score: number;
  reason: string;
}

interface FrequentlyBoughtTogetherProps {
  productId: string;
  className?: string;
}

export default function FrequentlyBoughtTogether({
  productId,
  className = '',
}: FrequentlyBoughtTogetherProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    loadRecommendations();
  }, [productId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/products/${productId}/recommendations?types=frequently_bought_together&limit=4`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Error loading frequently bought together:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: RecommendedProduct['product']) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: product.price,
      image: product.image,
    });
  };

  const handleAddAllToCart = () => {
    recommendations.forEach((rec) => {
      if (rec.product.inStock) {
        handleAddToCart(rec.product);
      }
    });
  };

  const handleRecommendationClick = async (recommendation: RecommendedProduct) => {
    try {
      await fetch('/api/recommendations/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          recommendedProductId: recommendation.product.id,
          recommendationType: 'frequently_bought_together',
          position: recommendations.indexOf(recommendation) + 1,
        }),
      });
    } catch (err) {
      console.error('Error tracking recommendation click:', err);
    }
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  const totalPrice = recommendations.reduce((sum, rec) => sum + rec.product.price, 0);

  return (
    <Card className={`p-6 ${className}`} role="region" aria-label="Frequently bought together products">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-brand-orange" aria-hidden="true" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Frequently Bought Together
        </h3>
      </div>

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        role="list"
        aria-label="Products frequently bought together"
      >
        {recommendations.map((recommendation, index) => {
          const { product } = recommendation;
          return (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              onClick={() => handleRecommendationClick(recommendation)}
              className="block group focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-lg"
              role="listitem"
              aria-label={`${product.name} by ${product.brand}, ${product.reviewCount} reviews`}
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2 relative">
                <Image
                  src={product.image || '/images/product-placeholder.jpg'}
                  alt={`${product.name} product image`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {product.brand}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-brand-orange transition-colors mb-2">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <ReviewStars rating={product.rating} size="sm" />
                <span className="text-xs text-gray-600 dark:text-gray-400" aria-label={`${product.reviewCount} reviews`}>
                  ({product.reviewCount})
                </span>
              </div>
              <Price
                amountUSD={product.price}
                originalPrice={product.compareAtPrice || undefined}
                showCurrency
              />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Price:</div>
          <div className="text-xl font-bold text-brand-orange" aria-label={`Total price: ${totalPrice.toFixed(2)} dollars`}>
            <Price amountUSD={totalPrice} showCurrency />
          </div>
        </div>
        <Button
          onClick={handleAddAllToCart}
          className="flex items-center gap-2"
          disabled={recommendations.some((rec) => !rec.product.inStock)}
          aria-label={`Add all ${recommendations.length} products to cart`}
          aria-disabled={recommendations.some((rec) => !rec.product.inStock)}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          <span>Add All to Cart</span>
        </Button>
      </div>
    </Card>
  );
}

