/**
 * Product Quick View Modal
 * Shows product details in a modal without leaving the listing page
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ShoppingCart, Check, AlertTriangle, Star, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Price } from './Price';
import ReviewStars from './ReviewStars';
import { useCart } from '@/lib/cart-context';
import { useStatusAnnouncement } from '@/components/ui/StatusAnnouncementProvider';
import Link from 'next/link';

interface QuickViewProduct {
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
  description?: string;
  specifications?: Record<string, string>;
  badges?: string[];
  maxCartQty?: number | null;
  retExclude?: 0 | 1 | 2;
  blockedReason?: string | null;
  isBlocked?: boolean;
}

interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | number;
  product?: QuickViewProduct; // Optional: pass product data directly to avoid API call
}

export default function ProductQuickView({
  isOpen,
  onClose,
  productId,
  product: initialProduct
}: ProductQuickViewProps) {
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();
  const { announceSuccess } = useStatusAnnouncement();

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen) {
      // If product data is provided directly, use it
      if (initialProduct) {
        setProduct(initialProduct);
        setLoading(false);
      } else if (productId) {
        // Otherwise, fetch from API
        loadProduct();
      }
    } else {
      // Reset state when modal closes
      setProduct(null);
      setQuantity(1);
      setIsAdding(false);
      setJustAdded(false);
    }
  }, [isOpen, productId, initialProduct]);

  // Focus management and accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button when modal opens
    // WCAG: Ensure element exists before focusing
    setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 100);

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAdding) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Focus trap: keep focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isAdding, onClose]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // OWASP: Sanitize and validate productId before using in URL
      if (!productId) {
        setProduct(null);
        setLoading(false);
        return;
      }
      
      // Sanitize productId - only allow alphanumeric, hyphens, underscores
      const sanitizedId = productId.toString().replace(/[^a-zA-Z0-9_-]/g, '');
      if (!sanitizedId || sanitizedId.length > 100) {
        setProduct(null);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/products/${encodeURIComponent(sanitizedId)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          // Convert database product to QuickViewProduct format
          const categoryMap: Record<string, string> = {
            'air-filter': 'air',
            'water-filter': 'water',
            'refrigerator-filter': 'refrigerator',
            'humidifier-filter': 'humidifier',
            'pool-filter': 'pool',
            'gift-card': 'sale',
          };

          // Use product ID from database, or fallback to parsed numeric ID
          const productDbId = data.product.id || parseInt(sanitizedId.replace(/\D/g, '') || '0') || 0;
          const retExcludeRaw = Number(data.product.retExclude);
          const retExclude = [0, 1, 2].includes(retExcludeRaw) ? (retExcludeRaw as 0 | 1 | 2) : 0;
          const blockedReason = data.product.blockedReason?.trim()
            ? data.product.blockedReason.trim()
            : null;
          const isBlocked = Boolean(blockedReason);

          const quickViewProduct: QuickViewProduct = {
            id: typeof productDbId === 'string' ? parseInt(productDbId) || 0 : productDbId,
            name: data.product.name,
            brand: data.product.brand,
            sku: data.product.sku,
            price: data.product.price,
            originalPrice: data.product.compareAtPrice || undefined,
            rating: data.product.rating || 0,
            reviewCount: data.product.reviewCount || 0,
            image: data.product.primaryImage || '/images/product-placeholder.jpg',
            inStock: (data.product.inventoryQuantity > 0 || !data.product.trackInventory) && !isBlocked,
            description: data.product.description || '',
            specifications: data.product.specifications || {},
            badges: [
              ...(data.product.isBestSeller ? ['bestseller'] : []),
              ...(data.product.isFeatured ? ['featured'] : []),
              ...(data.product.isNew ? ['new'] : []),
            ],
            maxCartQty: data.product.maxCartQty ?? null,
            retExclude,
            blockedReason,
            isBlocked,
          };

          setProduct(quickViewProduct);
        } else {
          // Product not found or invalid response
          setProduct(null);
        }
      } else {
        // API returned an error (404, 500, etc.)
        setProduct(null);
      }
    } catch (error) {
      // OWASP: Don't expose detailed error information
      console.error('Error loading product for quick view');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const productBlocked = Boolean(product.isBlocked || product.blockedReason);
    if (productBlocked) {
      announceSuccess('This item is temporarily unavailable and cannot be added to the cart.');
      return;
    }

    setIsAdding(true);
    
    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const resolvedMaxCartQty = product.maxCartQty && product.maxCartQty > 0
      ? Math.min(product.maxCartQty, 999)
      : null;
    const requestedQuantity = resolvedMaxCartQty
      ? Math.min(quantity, resolvedMaxCartQty)
      : quantity;

    // OWASP: Validate quantity before adding to cart
    const safeQuantity = Math.max(1, Math.min(requestedQuantity, 999));
    
    addItem({
      id: product.id.toString(),
      productId: product.id.toString(),
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: product.price,
      image: product.image,
      retExclude: product.retExclude ?? 0,
      blockedReason: product.blockedReason ?? null,
      maxCartQty: resolvedMaxCartQty ?? null,
      ...(safeQuantity > 1 && { quantity: safeQuantity }),
    });
    
    // WCAG: Announce success to screen readers
    announceSuccess(`${product.name} added to cart`);
    
    setIsAdding(false);
    setJustAdded(true);
    
    // Reset "just added" state after 2 seconds
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (!isOpen) return null;

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - (product.price || 0)) / product.originalPrice) * 100)
    : 0;
  const productBlocked = Boolean(product?.isBlocked || product?.blockedReason);
  const retExcludeLevel = product?.retExclude ?? 0;
  const returnPolicyLabel =
    retExcludeLevel === 2
      ? 'All sales final'
      : retExcludeLevel === 1
      ? 'Refund only'
      : null;

  const quantityOptions = product?.maxCartQty && product.maxCartQty > 0
    ? Array.from({ length: Math.min(product.maxCartQty, 10) }, (_, idx) => idx + 1)
    : Array.from({ length: 10 }, (_, idx) => idx + 1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      aria-describedby={product ? "quick-view-product-info" : "quick-view-description"}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12" role="status" aria-live="polite">
            <div className="text-center">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"
                aria-label="Loading product details"
                role="img"
              ></div>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading product...</p>
            </div>
          </div>
        ) : product ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 
                id="quick-view-title"
                className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors"
              >
                Quick View
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded transition-colors"
                aria-label="Close quick view dialog"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Image */}
                <div className="space-y-4">
                  <div className="aspect-square bg-brand-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative transition-colors">
                    {discount > 0 && (
                      <div 
                        className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm z-10"
                        aria-label={`${discount} percent discount`}
                      >
                        -{discount}%
                      </div>
                    )}
                    {product.badges && product.badges.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
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
                    <img
                      src={product.image}
                      alt={`${product.name} - ${product.brand} filter`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                      Product Image
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="space-y-4">
                  <div id="quick-view-product-info">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                      {product.brand} • SKU: {product.sku}
                    </div>
                    <h3 
                      className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors"
                    >
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <ReviewStars rating={product.rating} size="sm" />
                      <a
                        href={`/products/${encodeURIComponent(product.id.toString())}#reviews`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-orange transition-colors"
                        onClick={onClose}
                        aria-label={`View ${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'} for ${product.name}`}
                      >
                        ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                      </a>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-brand-orange">
                      <Price 
                        amountUSD={product.price}
                        originalPrice={product.originalPrice}
                        showCurrency
                      />
                    </div>
                    {returnPolicyLabel && (
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 transition-colors">
                        {returnPolicyLabel}
                      </div>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2" role="status" aria-live="polite">
                    {productBlocked ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                        <span className="text-red-600 font-semibold">Temporarily Unavailable</span>
                      </>
                    ) : product.inStock ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                        <span className="text-green-600 font-semibold">In Stock</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                        <span className="text-red-600 font-semibold">Out of Stock</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div>
                      <p 
                        id="quick-view-description"
                        className="text-gray-700 dark:text-gray-300 line-clamp-3 transition-colors"
                      >
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Key Specifications */}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <Card className="p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                        Key Specifications
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(product.specifications)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 transition-colors">{key}:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{value}</span>
                            </div>
                          ))}
                      </div>
                    </Card>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <label htmlFor="quick-view-quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity:
                    </label>
                    <select
                      id="quick-view-quantity"
                      value={quantity}
                      onChange={(e) => {
                        // OWASP: Validate and sanitize quantity input
                        const value = parseInt(e.target.value, 10);
                        if (!Number.isNaN(value) && value > 0 && value <= 999) {
                          const maxQty = product?.maxCartQty && product.maxCartQty > 0
                            ? Math.min(product.maxCartQty, 999)
                            : 999;
                          setQuantity(Math.min(value, maxQty));
                        }
                      }}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors"
                      aria-label="Select quantity"
                    >
                      {quantityOptions.map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0 transition-colors">
              <Button
                variant="primary"
                onClick={handleAddToCart}
                disabled={isAdding || !product.inStock || productBlocked}
                className={`flex-1 flex items-center justify-center gap-2 ${justAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                  </>
                )}
              </Button>
              <Link 
                href={`/products/${encodeURIComponent(product.id.toString())}`} 
                onClick={onClose}
                aria-label={`View full details for ${product.name}`}
              >
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  View Full Details
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Product Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                Unable to load product details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

