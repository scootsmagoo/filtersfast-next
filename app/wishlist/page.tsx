'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useWishlist } from '@/lib/wishlist-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { HeroPrice, Savings } from '@/components/products/Price';
import WishlistButton from '@/components/wishlist/WishlistButton';

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { wishlistProducts, isLoading, removeFromWishlist, refreshWishlist } = useWishlist();
  const { addItem } = useCart();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.id && !isLoading) {
      router.push('/sign-in?redirect=' + encodeURIComponent('/wishlist'));
    }
  }, [session, isLoading, router]);

  const handleRemove = async (productId: string) => {
    setRemovingIds(prev => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId);
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleAddToCart = (product: typeof wishlistProducts[0]) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: product.price,
      image: product.primaryImage,
    });
  };

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your wishlist</p>
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <header className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            My Wishlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors" role="status" aria-live="polite">
            {wishlistProducts.length === 0
              ? 'Your wishlist is empty'
              : `${wishlistProducts.length} ${wishlistProducts.length === 1 ? 'item' : 'items'} saved`
            }
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-16" role="status" aria-live="polite" aria-busy="true">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading wishlist...</p>
            </div>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
              Start adding products to your wishlist to save them for later
            </p>
            <Link href="/">
              <Button>Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <section aria-label="Wishlist items">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => {
                const isRemoving = removingIds.has(product.id);
                const productUrl = product.slug 
                  ? `/products/${product.slug}` 
                  : `/products/${product.id}`;

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                    <div className="relative">
                    <Link href={productUrl}>
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                        <Image
                          src={product.primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2">
                      <WishlistButton
                        productId={product.id}
                        variant="icon"
                        size="md"
                      />
                    </div>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                          Sale
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <Link href={productUrl}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 hover:text-brand-orange transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {product.brand} • {product.sku}
                    </p>

                    <div className="mb-3">
                      <HeroPrice 
                        amountUSD={product.price}
                        originalPrice={product.compareAtPrice || undefined}
                      />
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="text-sm font-semibold mt-1">
                          <Savings amountUSD={product.compareAtPrice - product.price} />
                        </div>
                      )}
                    </div>

                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-4">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className="flex-1 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                        variant="primary"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                        <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                      </Button>
                      <button
                        onClick={() => handleRemove(product.id)}
                        disabled={isRemoving}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Remove ${product.name} from wishlist`}
                        aria-busy={isRemoving}
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                        {isRemoving && <span className="sr-only">Removing...</span>}
                      </button>
                    </div>
                  </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

