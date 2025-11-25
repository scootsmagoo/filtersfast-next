'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useComparison } from '@/lib/comparison-context';
import { getComparisonAttributes, formatComparisonValue, areAllValuesEqual, findBestValue } from '@/lib/comparison-utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { X, ShoppingCart, ArrowLeft, Scale, Star, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { Price } from '@/components/products/Price';
import ReviewStars from '@/components/products/ReviewStars';
import ComparisonButton from '@/components/products/ComparisonButton';

export default function ComparePage() {
  const router = useRouter();
  const { comparisonProducts, removeFromComparison, clearComparison } = useComparison();
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if no products to compare
    if (comparisonProducts.length === 0) {
      router.push('/');
    }
  }, [comparisonProducts.length, router]);

  if (comparisonProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
            No Products to Compare
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
            Add products to comparison to see them side by side.
          </p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const attributes = getComparisonAttributes(comparisonProducts);

  const handleAddToCart = async (product: typeof comparisonProducts[0]) => {
    setIsAddingToCart(product.id || product.productId || '');
    try {
      addItem({
        id: product.id || product.productId || '',
        productId: product.productId || product.id || '',
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        image: product.image,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shopping
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                Product Comparison
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                Compare {comparisonProducts.length} product{comparisonProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={clearComparison}
            className="flex items-center gap-2"
            aria-label="Clear all products from comparison"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear All
          </Button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="table" aria-label="Product comparison table">
                <caption className="sr-only">
                  Side-by-side comparison of {comparisonProducts.length} product{comparisonProducts.length !== 1 ? 's' : ''}
                </caption>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-gray-800 p-4 text-left font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] border-r border-gray-200 dark:border-gray-700 transition-colors">
                      Attribute
                    </th>
                    {comparisonProducts.map((product, index) => (
                      <th
                        key={product.id || product.productId || index}
                        scope="col"
                        className="p-4 text-center min-w-[250px] bg-gray-50 dark:bg-gray-800 transition-colors"
                        aria-label={`Product ${index + 1}: ${product.name}`}
                      >
                        <div className="flex flex-col items-center space-y-3">
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromComparison(product.id || product.productId || '')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                removeFromComparison(product.id || product.productId || '');
                              }
                            }}
                            className="ml-auto p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                            aria-label={`Remove ${product.name} from comparison`}
                          >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                          </button>

                          {/* Product Image */}
                          <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                              No Image
                            </div>
                          </div>

                          {/* Product Name */}
                          <Link
                            href={`/products/${encodeURIComponent(product.id || product.productId || '')}`}
                            className="font-bold text-gray-900 dark:text-gray-100 hover:text-brand-orange transition-colors text-center line-clamp-2 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
                            aria-label={`View details for ${product.name}`}
                          >
                            {product.name}
                          </Link>

                          {/* Brand & SKU */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            {product.brand} • {product.sku}
                          </div>

                          {/* Price */}
                          <div className="text-2xl font-bold text-brand-orange">
                            <Price amountUSD={product.price} originalPrice={product.originalPrice} showCurrency />
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <ReviewStars rating={product.rating} size="sm" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              ({product.reviewCount})
                            </span>
                          </div>

                          {/* Stock Status */}
                          <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
                            {product.inStock ? (
                              <>
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                                <span className="text-green-600 dark:text-green-400">In Stock</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                                <span className="text-red-600 dark:text-red-400">Out of Stock</span>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              onClick={() => handleAddToCart(product)}
                              disabled={!product.inStock || isAddingToCart === (product.id || product.productId || '')}
                              variant="primary"
                              size="sm"
                              className="w-full"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {isAddingToCart === (product.id || product.productId || '') ? 'Adding...' : 'Add to Cart'}
                            </Button>
                            <ComparisonButton
                              product={product}
                              variant="compact"
                              size="sm"
                            />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attribute, attrIndex) => {
                    const allEqual = areAllValuesEqual(comparisonProducts, attribute);
                    const bestProduct = attribute.key === 'price' || attribute.key === 'originalPrice'
                      ? findBestValue(comparisonProducts, attribute, 'lowest')
                      : attribute.key === 'rating' || attribute.key === 'reviewCount'
                      ? findBestValue(comparisonProducts, attribute, 'highest')
                      : null;

                    return (
                      <tr
                        key={attribute.key}
                        className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                          attrIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <th scope="row" className="sticky left-0 z-10 p-4 font-semibold text-gray-900 dark:text-gray-100 bg-inherit border-r border-gray-200 dark:border-gray-700 min-w-[200px] transition-colors">
                          {attribute.label}
                        </th>
                        {comparisonProducts.map((product, prodIndex) => {
                          const value = attribute.getValue(product);
                          const formattedValue = formatComparisonValue(value, attribute.formatValue);
                          const isBest = bestProduct && (product.id || product.productId) === (bestProduct.id || bestProduct.productId);

                          return (
                            <td
                              key={product.id || product.productId || prodIndex}
                              className={`p-4 text-center transition-colors ${
                                isBest && !allEqual
                                  ? 'bg-green-50 dark:bg-green-900/20 font-semibold'
                                  : ''
                              }`}
                              aria-label={`${attribute.label}: ${formattedValue}`}
                            >
                              <span 
                                className={isBest && !allEqual ? 'text-green-700 dark:text-green-400' : ''}
                                aria-label={isBest && !allEqual ? `Best value: ${formattedValue}` : undefined}
                              >
                                {formattedValue}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Empty State Helper */}
        {comparisonProducts.length < 2 && (
          <Card className="mt-6 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">
              Add more products to compare them side by side. You can compare up to 4 products.
            </p>
            <Link href="/">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

