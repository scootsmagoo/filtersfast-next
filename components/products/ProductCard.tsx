'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { useState } from 'react';

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
  const { dispatch } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        image: product.image,
      },
    });
    
    setIsAdding(false);
  };

  if (viewMode === 'list') {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Image */}
          <div className="md:col-span-3">
            <div className="aspect-square bg-brand-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
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
              <div className="text-brand-gray-400 text-sm hidden">Product Image</div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-6 flex flex-col justify-center">
            <div className="text-sm text-brand-gray-600 mb-1">{product.brand} • SKU: {product.sku}</div>
            <h3 className="text-lg font-bold text-brand-gray-900 mb-2 hover:text-brand-orange transition-colors cursor-pointer">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="flex items-center"
                role="img"
                aria-label={`${product.rating} out of 5 stars`}
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-brand-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm text-brand-gray-600">
                {product.rating} out of 5 stars ({product.reviewCount} reviews)
              </span>
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
              {product.originalPrice && (
                <div className="text-sm text-brand-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
              <div className="text-2xl font-bold text-brand-orange">
                {formatPrice(product.price)}
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Availability: </span>In Stock
              </div>
            </div>
            <Button 
              onClick={handleAddToCart}
              disabled={isAdding || !product.inStock}
              className="w-full flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-brand-gray-100 relative overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center text-brand-gray-400">
          Product Image
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all"></div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="text-sm text-brand-gray-600">{product.brand} • {product.sku}</div>
        <h3 className="text-base font-bold text-brand-gray-900 line-clamp-2 group-hover:text-brand-orange transition-colors cursor-pointer min-h-[3rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-brand-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-brand-gray-600">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="pt-2">
          {product.originalPrice && (
            <div className="text-sm text-brand-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </div>
          )}
          <div className="text-2xl font-bold text-brand-orange">
            {formatPrice(product.price)}
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
            <Check className="w-4 h-4" />
            In Stock
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          disabled={isAdding || !product.inStock}
          className="w-full flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
      </div>
    </Card>
  );
}

