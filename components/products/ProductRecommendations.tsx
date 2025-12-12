'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { Price } from './Price';
import ReviewStars from './ReviewStars';
import type { RecommendationType } from '@/lib/db/product-recommendations';

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
  recommendationType: RecommendationType;
  score: number;
  reason: string;
}

interface ProductRecommendationsProps {
  productId: string;
  title?: string;
  limit?: number;
  types?: RecommendationType[];
  showReason?: boolean;
  layout?: 'grid' | 'carousel';
  className?: string;
}

export default function ProductRecommendations({
  productId,
  title = 'You May Also Like',
  limit = 8,
  types,
  showReason = false,
  layout = 'grid',
  className = '',
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadRecommendations();
  }, [productId, limit, types]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (types) params.set('types', types.join(','));
      
      const response = await fetch(`/api/products/${productId}/recommendations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
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

  const handleRecommendationClick = async (recommendation: RecommendedProduct) => {
    // Track recommendation click
    try {
      await fetch('/api/recommendations/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          recommendedProductId: recommendation.product.id,
          recommendationType: recommendation.recommendationType,
          position: recommendations.indexOf(recommendation) + 1,
        }),
      });
    } catch (err) {
      console.error('Error tracking recommendation click:', err);
    }
  };

  if (loading) {
    return (
      <section className={`${className}`} aria-label={title}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h2>
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          role="status"
          aria-live="polite"
          aria-label="Loading recommendations"
        >
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse" aria-hidden="true">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show anything if no recommendations
  }

  if (layout === 'carousel') {
    return (
      <section className={`${className}`} aria-label={title}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button 
            className="text-sm text-brand-orange hover:text-brand-orange-dark flex items-center gap-1 focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
            aria-label={`View all ${title.toLowerCase()}`}
          >
            View All <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div 
          className="overflow-x-auto -mx-4 px-4 pb-4"
          role="region"
          aria-label="Product recommendations carousel"
        >
          <div 
            className="flex gap-4" 
            style={{ width: 'max-content' }}
            role="list"
            aria-label="Recommended products"
          >
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.product.id}
                recommendation={recommendation}
                onAddToCart={handleAddToCart}
                onClick={handleRecommendationClick}
                showReason={showReason}
                className="w-64 flex-shrink-0"
                position={index + 1}
                total={recommendations.length}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${className}`} aria-label={title}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h2>
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        role="list"
        aria-label="Recommended products"
      >
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.product.id}
            recommendation={recommendation}
            onAddToCart={handleAddToCart}
            onClick={handleRecommendationClick}
            showReason={showReason}
            position={index + 1}
            total={recommendations.length}
          />
        ))}
      </div>
    </section>
  );
}

interface RecommendationCardProps {
  recommendation: RecommendedProduct;
  onAddToCart: (product: RecommendedProduct['product']) => void;
  onClick: (recommendation: RecommendedProduct) => void;
  showReason?: boolean;
  className?: string;
  position?: number;
  total?: number;
}

function RecommendationCard({
  recommendation,
  onAddToCart,
  onClick,
  showReason = false,
  className = '',
  position,
  total,
}: RecommendationCardProps) {
  const { product } = recommendation;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const positionLabel = position && total 
    ? `, ${position} of ${total}`
    : '';

  return (
    <Card className={`group overflow-hidden flex flex-col h-full ${className}`} role="listitem">
      <Link
        href={`/products/${product.slug || product.id}`}
        onClick={() => onClick(recommendation)}
        className="block focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded-lg"
        aria-label={`${product.name} by ${product.brand}${positionLabel}`}
      >
        {/* Image */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden flex-shrink-0">
          {discount > 0 && (
            <div 
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full font-bold text-xs z-10"
              aria-label={`${discount} percent discount`}
            >
              -{discount}%
            </div>
          )}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10" role="list" aria-label="Product badges">
              {product.badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-1 bg-brand-blue text-white text-xs font-semibold rounded"
                  role="listitem"
                  aria-label={`${badge} product`}
                >
                  {badge.toUpperCase()}
                </span>
              ))}
            </div>
          )}
          <Image
            src={product.image || '/images/product-placeholder.jpg'}
            alt={`${product.name} product image`}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {product.brand} • {product.sku}
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-brand-orange transition-colors mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <ReviewStars rating={product.rating} size="sm" />
            <span className="text-xs text-gray-600 dark:text-gray-400" aria-label={`${product.reviewCount} reviews`}>
              ({product.reviewCount})
            </span>
          </div>

          {/* Reason */}
          {showReason && (
            <div className="text-xs text-brand-orange mb-2 font-medium">
              {recommendation.reason}
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <Price
              amountUSD={product.price}
              originalPrice={product.compareAtPrice || undefined}
              showCurrency
            />
          </div>

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* Add to Cart */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!product.inStock}
            className="w-full flex items-center justify-center gap-2 mt-auto"
            size="sm"
            aria-label={`Add ${product.name} to cart`}
            aria-disabled={!product.inStock}
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </Button>
        </div>
      </Link>
    </Card>
  );
}

