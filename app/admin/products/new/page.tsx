'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import type { ProductFormData, ProductType, ProductStatus, MervRating } from '@/lib/types/product';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.type === 'gift-card') {
      setFormData(prev => ({
        ...prev,
        trackInventory: false,
        allowBackorder: false,
        subscriptionEligible: false,
        weight: 0,
      }));
    }
  }, [formData.type]);

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
    
    if (!formData.name || !formData.sku || !formData.brand) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      const { product } = await response.json();
      alert('Product created successfully!');
      router.push(`/admin/products/${product.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Update form field
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
            Add New Product
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Create a new product in your catalog
          </p>
        </div>

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
                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                      Product Name <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      required
                      aria-required="true"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      placeholder="e.g., FiltersFast® MERV 13 Air Filter 16x25x1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        SKU <span className="text-red-500" aria-label="required">*</span>
                      </label>
                      <input
                        id="product-sku"
                        type="text"
                        required
                        aria-required="true"
                        value={formData.sku}
                        onChange={(e) => updateField('sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="FF-M13-16251-6PK"
                      />
                    </div>

                    <div>
                      <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Brand <span className="text-red-500" aria-label="required">*</span>
                      </label>
                      <input
                        id="product-brand"
                        type="text"
                        required
                        aria-required="true"
                        value={formData.brand}
                        onChange={(e) => updateField('brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                        placeholder="FiltersFast"
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
                      placeholder="Brief one-line description"
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
                      placeholder="Full product description..."
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
                      placeholder="98% particle capture efficiency&#10;MERV 13 rated filtration&#10;Made in USA"
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
                      placeholder="Actual Size: 15.5&quot; x 24.5&quot; x 0.75&quot;&#10;MERV Rating: 13&#10;Material: 100% Synthetic"
                    />
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

              {/* Dimensions */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                  Dimensions & Specifications
                </h2>
                
                <div className="grid grid-cols-4 gap-4">
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

                <div className="mt-4">
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
                      <option value="gift-card">Gift Card</option>
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
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                    aria-label="Create new product"
                  >
                    <Save className="w-5 h-5" aria-hidden="true" />
                    {loading ? 'Creating...' : 'Create Product'}
                  </Button>

                  <Link href="/admin/products" className="block">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2"
                      aria-label="Cancel and return to products list"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                      Cancel
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

