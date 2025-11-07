'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save, Trash2, Eye, History, Link2 } from 'lucide-react';
import Link from 'next/link';
import type { Product, ProductFormData, ProductHistoryEntry, ProductType, ProductStatus } from '@/lib/types/product';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import SKUCompatibilityModal from '@/components/admin/SKUCompatibilityModal';

interface ProductResponse {
  success: boolean;
  product: Product;
  history?: ProductHistoryEntry[];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    brand: '',
    description: '',
    shortDescription: '',
    type: 'air-filter',
    status: 'draft',
    price: 0,
    compareAtPrice: null,
    costPrice: null,
    trackInventory: true,
    inventoryQuantity: 0,
    lowStockThreshold: 10,
    allowBackorder: false,
    height: null,
    width: null,
    depth: null,
    weight: 0,
    mervRating: null,
    features: '',
    specifications: '',
    compatibleModels: '',
    primaryImage: '',
    additionalImages: '',
    categoryIds: [],
    tags: [],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    madeInUSA: false,
    freeShipping: false,
    subscriptionEligible: true,
    subscriptionDiscount: 5
  });

  // Unwrap params
  useEffect(() => {
    params.then(p => setProductId(p.id));
  }, [params]);

  // Load product
  useEffect(() => {
    if (!productId) return;
    loadProduct();
  }, [productId]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}?includeHistory=true`);
      
      if (!response.ok) {
        throw new Error('Failed to load product');
      }

      const data: ProductResponse = await response.json();
      setProduct(data.product);
      if (data.history) setHistory(data.history);

      // Populate form
      const p = data.product;
      setFormData({
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        type: p.type,
        status: p.status,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        trackInventory: p.trackInventory,
        inventoryQuantity: p.inventoryQuantity,
        lowStockThreshold: p.lowStockThreshold,
        allowBackorder: p.allowBackorder,
        height: p.dimensions?.height || null,
        width: p.dimensions?.width || null,
        depth: p.dimensions?.depth || null,
        weight: p.weight,
        mervRating: p.mervRating,
        features: p.features.join('\n'),
        specifications: Object.entries(p.specifications).map(([k, v]) => `${k}: ${v}`).join('\n'),
        compatibleModels: p.compatibleModels.join('\n'),
        primaryImage: p.primaryImage || '',
        additionalImages: '',
        categoryIds: p.categoryIds,
        tags: p.tags,
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        metaKeywords: p.metaKeywords || '',
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
        madeInUSA: p.madeInUSA,
        freeShipping: p.freeShipping,
        subscriptionEligible: p.subscriptionEligible,
        subscriptionDiscount: p.subscriptionDiscount
      });

    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/products/stats');
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      alert('Product updated successfully!');
      loadProduct(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!confirm(`Archive product "${product?.name}"? This will hide it from the store but can be restored later.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert('Product archived successfully');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  // Update form field
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
          <span className="sr-only">Loading, please wait. Fetching product details.</span>
          <p className="text-gray-600 dark:text-gray-400 transition-colors" aria-hidden="true">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
            Product Not Found
          </h2>
          <Link href="/admin/products">
            <Button>Back to Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-orange-600 mb-4"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Back to Products
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Edit Product
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                {product.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCompatibilityModal(true)}
                className="flex items-center gap-2"
                aria-label="Manage SKU compatibility"
              >
                <Link2 className="w-5 h-5" aria-hidden="true" />
                Compatibility
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2"
                aria-label={showHistory ? "Hide product history" : "Show product history"}
                aria-expanded={showHistory}
              >
                <History className="w-5 h-5" aria-hidden="true" />
                {showHistory ? 'Hide' : 'Show'} History
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                className="flex items-center gap-2"
                aria-label="Archive this product"
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
                Archive
              </Button>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        {showHistory && history.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              Product History
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="text-gray-500 dark:text-gray-400 min-w-[140px]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">
                      {entry.action.replace('-', ' ').toUpperCase()}
                    </span>
                    {' by '}
                    <span className="text-gray-700 dark:text-gray-300 transition-colors">
                      {entry.performedByName}
                    </span>
                    {entry.notes && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2 transition-colors">
                        - {entry.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Form - Same as new product page */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => updateField('sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) => updateField('brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => updateField('shortDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Features (one per line)
                    </label>
                    <textarea
                      value={formData.features}
                      onChange={(e) => updateField('features', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Specifications (key: value, one per line)
                    </label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => updateField('specifications', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono text-sm"
                    />
                  </div>
                </div>
              </Card>

              {/* Images */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Product Images
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Primary Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.primaryImage}
                      onChange={(e) => updateField('primaryImage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="https://example.com/image.jpg or /images/product.jpg"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter a full URL or relative path to the product image
                    </p>
                    {formData.primaryImage && (
                      <div className="mt-2">
                        <img
                          src={formData.primaryImage}
                          alt="Preview"
                          className="max-w-xs h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Additional Images (URLs, one per line)
                    </label>
                    <textarea
                      value={formData.additionalImages}
                      onChange={(e) => updateField('additionalImages', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors font-mono text-sm"
                      placeholder="https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter one image URL per line
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pricing */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Pricing
                </h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => updateField('price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Compare at Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.compareAtPrice || ''}
                      onChange={(e) => updateField('compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice || ''}
                      onChange={(e) => updateField('costPrice', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                </div>
              </Card>

              {/* Inventory */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Inventory
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onChange={(e) => updateField('trackInventory', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <label htmlFor="trackInventory" className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                      Track inventory for this product
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inventoryQuantity}
                        onChange={(e) => updateField('inventoryQuantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lowStockThreshold}
                        onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowBackorder"
                          checked={formData.allowBackorder}
                          onChange={(e) => updateField('allowBackorder', e.target.checked)}
                          className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                        />
                        <label htmlFor="allowBackorder" className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                          Allow backorder
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dimensions */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Dimensions & Specifications
                </h2>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Height (inches)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={formData.height || ''}
                      onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Width (inches)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={formData.width || ''}
                      onChange={(e) => updateField('width', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Depth (inches)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={formData.depth || ''}
                      onChange={(e) => updateField('depth', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                    MERV Rating (for air filters)
                  </label>
                  <select
                    value={formData.mervRating || ''}
                    onChange={(e) => updateField('mervRating', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <option value="">None / N/A</option>
                    <option value="1-4">MERV 1-4 (Basic)</option>
                    <option value="5-7">MERV 5-7 (Better)</option>
                    <option value="8">MERV 8 (Good)</option>
                    <option value="9-12">MERV 9-12 (Superior)</option>
                    <option value="13">MERV 13 (Superior +)</option>
                    <option value="14-16">MERV 14-16 (Hospital Grade)</option>
                    <option value="17-20">MERV 17-20 (HEPA)</option>
                  </select>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Type */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Status & Type
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField('status', e.target.value as ProductStatus)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="out-of-stock">Out of Stock</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Product Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => updateField('type', e.target.value as ProductType)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="air-filter">Air Filter</option>
                      <option value="water-filter">Water Filter</option>
                      <option value="refrigerator-filter">Refrigerator Filter</option>
                      <option value="humidifier-filter">Humidifier Filter</option>
                      <option value="pool-filter">Pool Filter</option>
                      <option value="custom">Custom</option>
                      <option value="accessory">Accessory</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Categories */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Categories
                </h2>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateField('categoryIds', [...formData.categoryIds, category.id]);
                          } else {
                            updateField('categoryIds', formData.categoryIds.filter(id => id !== category.id));
                          }
                        }}
                        className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Flags */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Product Flags
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => updateField('isFeatured', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Featured</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => updateField('isNew', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">New Product</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => updateField('isBestSeller', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.madeInUSA}
                      onChange={(e) => updateField('madeInUSA', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Made in USA</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.freeShipping}
                      onChange={(e) => updateField('freeShipping', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Free Shipping</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subscriptionEligible}
                      onChange={(e) => updateField('subscriptionEligible', e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">Subscribe & Save</span>
                  </label>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2"
                    aria-label="Save product changes"
                  >
                    <Save className="w-5 h-5" aria-hidden="true" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>

                  <Link href="/admin/products" className="block">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      aria-label="Cancel and return to products list"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </form>

        {/* SKU Compatibility Modal */}
        {productId && (
          <SKUCompatibilityModal
            isOpen={showCompatibilityModal}
            onClose={() => setShowCompatibilityModal(false)}
            productId={parseInt(productId)}
            productName={product?.name}
            onSave={() => {
              // Optionally reload product data if needed
              loadProduct();
            }}
          />
        )}
      </div>
    </div>
  );
}

