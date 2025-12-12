'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save, Trash2, Eye, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import type { CategoryWithChildren, CategoryFormData, CategoryType } from '@/lib/types/category';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface CategoryResponse {
  success: boolean;
  category: CategoryWithChildren;
}

interface CategoryProductsResponse {
  success: boolean;
  products: Array<{
    idCatProd: number;
    idCategory: number;
    idProduct: number;
    product?: {
      id: string;
      sku: string;
      name: string;
      description: string | null;
      status: string;
    };
  }>;
  total: number;
}

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>('');
  const [category, setCategory] = useState<CategoryWithChildren | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [products, setProducts] = useState<CategoryProductsResponse['products']>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [parentCategories, setParentCategories] = useState<CategoryWithChildren[]>([]);
  const [addProductType, setAddProductType] = useState<'sku' | 'idProduct'>('sku');
  const [addProductIds, setAddProductIds] = useState('');
  
  const [formData, setFormData] = useState<CategoryFormData>({
    categoryDesc: '',
    idParentCategory: 0,
    categoryFeatured: 'N',
    categoryHTML: '',
    categoryHTMLLong: '',
    sortOrder: null,
    categoryGraphic: '',
    categoryImage: '',
    categoryContentLocation: 0,
    categoryType: '',
    hideFromListings: 0,
    metatitle: '',
    metadesc: '',
    metacat: ''
  });

  // Unwrap params
  useEffect(() => {
    params.then(p => setCategoryId(p.id));
  }, [params]);

  // Load category
  useEffect(() => {
    if (!categoryId) return;
    loadCategory();
    loadParentCategories();
  }, [categoryId]);

  // Load products when modal opens
  useEffect(() => {
    if (showProducts && categoryId) {
      loadProducts();
    }
  }, [showProducts, categoryId]);

  // Focus trap and keyboard navigation for modal
  useEffect(() => {
    if (!showProducts) return;

    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when modal opens
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 100);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProducts(false);
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProducts]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load category');
      }

      const data: CategoryResponse = await response.json();
      setCategory(data.category);

      // Populate form
      const c = data.category;
      setFormData({
        categoryDesc: c.categoryDesc,
        idParentCategory: c.idParentCategory,
        categoryFeatured: c.categoryFeatured,
        categoryHTML: c.categoryHTML || '',
        categoryHTMLLong: c.categoryHTMLLong || '',
        sortOrder: c.sortOrder,
        categoryGraphic: c.categoryGraphic || '',
        categoryImage: c.categoryImage || '',
        categoryContentLocation: c.categoryContentLocation,
        categoryType: c.categoryType,
        hideFromListings: c.hideFromListings,
        metatitle: c.metatitle || '',
        metadesc: c.metadesc || '',
        metacat: c.metacat || ''
      });

    } catch (error) {
      console.error('Error loading category:', error);
      alert('Failed to load category');
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const loadParentCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.categories) {
        // Filter out current category and its children
        const filtered = data.categories.filter((cat: CategoryWithChildren) => 
          cat.id !== parseInt(categoryId)
        );
        setParentCategories(filtered);
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/admin/categories/${categoryId}/products`);
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data: CategoryProductsResponse = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      // Announce success to screen readers
      const successMsg = 'Category updated successfully!';
      alert(successMsg);
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = successMsg;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
      
      loadCategory(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update category';
      alert(errorMsg);
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete category "${category?.categoryDesc}"? This will unlink all products from this category.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete category');

      alert('Category deleted successfully');
      router.push('/admin/categories');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const handleAddProducts = async () => {
    if (!addProductIds.trim()) {
      alert('Please enter product IDs or SKUs');
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: addProductType,
          ids: addProductIds.split('\n').filter(id => id.trim())
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add products');
      }

      alert('Products added successfully!');
      setAddProductIds('');
      loadProducts();
    } catch (error) {
      console.error('Error adding products:', error);
      alert(error instanceof Error ? error.message : 'Failed to add products');
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    const confirmed = window.confirm('Remove this product from the category?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/products?productId=${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove product');

      loadProducts();
    } catch (error) {
      console.error('Error removing product:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove product');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="sr-only">Loading, please wait. </span>
            Loading category...
          </p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Category not found</p>
            <Link href="/admin/categories">
              <Button>Back to Categories</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: category.categoryDesc, href: `/admin/categories/${categoryId}` }
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Category
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {category.categoryDesc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/categories">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          {category.pagname && (
            <a 
              href={`/${category.pagname}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </a>
          )}
          <Button variant="secondary" onClick={() => setShowProducts(true)}>
            <Package className="w-4 h-4 mr-2" />
            Manage Products
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
                <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="categoryDesc-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Name *
                  </label>
                  <input
                    id="categoryDesc-edit"
                    type="text"
                    required
                    value={formData.categoryDesc}
                    onChange={(e) => setFormData({ ...formData, categoryDesc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={100}
                    aria-required="true"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="idParentCategory-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Parent Category *
                  </label>
                  <select
                    id="idParentCategory-edit"
                    required
                    value={formData.idParentCategory}
                    onChange={(e) => setFormData({ ...formData, idParentCategory: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    aria-required="true"
                  >
                    <option value="0">Root Category</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.categoryDesc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="categoryType-edit"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Category Type
                    </label>
                    <select
                      id="categoryType-edit"
                      value={formData.categoryType}
                      onChange={(e) => setFormData({ ...formData, categoryType: e.target.value as CategoryType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    >
                      <option value="">None (Parent)</option>
                      <option value="Brands">Brands</option>
                      <option value="Size">Size</option>
                      <option value="Type">Type</option>
                      <option value="Filtration Level">Filtration Level</option>
                      <option value="Deal">Deal</option>
                      <option value="MarketingPromos">Marketing Promos</option>
                    </select>
                  </div>

                  <div>
                    <label 
                      htmlFor="categoryFeatured-edit"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Featured
                    </label>
                    <select
                      id="categoryFeatured-edit"
                      value={formData.categoryFeatured}
                      onChange={(e) => setFormData({ ...formData, categoryFeatured: e.target.value as 'Y' | 'N' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="sortOrder-edit"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Sort Order
                    </label>
                    <input
                      id="sortOrder-edit"
                      type="number"
                      min="0"
                      max="99999"
                      value={formData.sortOrder || ''}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      aria-label="Sort order for category display"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="hideFromListings-edit"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Show in Listings
                    </label>
                    <select
                      id="hideFromListings-edit"
                      value={formData.hideFromListings}
                      onChange={(e) => setFormData({ ...formData, hideFromListings: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    >
                      <option value="0">Yes</option>
                      <option value="1">No</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="pagname-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category URL
                  </label>
                  <input
                    id="pagname-edit"
                    type="text"
                    value={category.pagname || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{ cursor: 'not-allowed' }}
                    aria-readonly="true"
                    aria-label="Category URL (read-only)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    URL cannot be changed after creation
                  </p>
                </div>
              </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">SEO & Meta</h2>
                <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="metatitle-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Title
                  </label>
                  <input
                    id="metatitle-edit"
                    type="text"
                    value={formData.metatitle || ''}
                    onChange={(e) => setFormData({ ...formData, metatitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={255}
                    aria-label="SEO page title"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="metadesc-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Description
                  </label>
                  <input
                    id="metadesc-edit"
                    type="text"
                    value={formData.metadesc || ''}
                    onChange={(e) => setFormData({ ...formData, metadesc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={500}
                    aria-label="SEO page description"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="metacat-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Keywords
                  </label>
                  <input
                    id="metacat-edit"
                    type="text"
                    value={formData.metacat || ''}
                    onChange={(e) => setFormData({ ...formData, metacat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={500}
                    aria-label="SEO page keywords"
                  />
                </div>
              </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Content</h2>
                <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="categoryHTML-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category HTML (Short)
                  </label>
                  <input
                    id="categoryHTML-edit"
                    type="text"
                    value={formData.categoryHTML || ''}
                    onChange={(e) => setFormData({ ...formData, categoryHTML: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={255}
                    aria-describedby="categoryHTML-help-edit"
                  />
                  <p id="categoryHTML-help-edit" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max 255 characters
                  </p>
                </div>

                <div>
                  <label 
                    htmlFor="categoryHTMLLong-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category HTML (Long)
                  </label>
                  <textarea
                    id="categoryHTMLLong-edit"
                    value={formData.categoryHTMLLong || ''}
                    onChange={(e) => setFormData({ ...formData, categoryHTMLLong: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    rows={6}
                    aria-label="Long HTML content for category page"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="categoryContentLocation-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Content Location
                  </label>
                  <select
                    id="categoryContentLocation-edit"
                    value={formData.categoryContentLocation}
                    onChange={(e) => setFormData({ ...formData, categoryContentLocation: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    <option value="0">Above Product Listings</option>
                    <option value="1">Below Product Listings</option>
                  </select>
                </div>
              </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Images</h2>
                <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="categoryGraphic-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Splash Image
                  </label>
                  <input
                    id="categoryGraphic-edit"
                    type="text"
                    value={formData.categoryGraphic || ''}
                    onChange={(e) => setFormData({ ...formData, categoryGraphic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="/ProdImages/image.jpg"
                    aria-label="Path to category splash image"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="categoryImage-edit"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Graphic
                  </label>
                  <input
                    id="categoryImage-edit"
                    type="text"
                    value={formData.categoryImage || ''}
                    onChange={(e) => setFormData({ ...formData, categoryImage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="/ProdImages/image.jpg"
                    aria-label="Path to category graphic image"
                  />
                </div>
              </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <div className="p-6 space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saving}
                  aria-label={saving ? 'Saving category changes, please wait' : 'Save category changes'}
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Save Changes'}
                  {saving && <span className="sr-only">Please wait, saving changes</span>}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Products Modal */}
      {showProducts && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="products-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProducts(false);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            role="document"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="products-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                  Category Products
                </h2>
                <button
                  onClick={() => setShowProducts(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded p-1"
                  aria-label="Close products modal"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Add Products</h3>
                <div className="space-y-2">
                  <fieldset>
                    <legend className="sr-only">Product identification method</legend>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="addProductType"
                          value="sku"
                          checked={addProductType === 'sku'}
                          onChange={() => setAddProductType('sku')}
                          className="focus:ring-2 focus:ring-brand-orange"
                        />
                        <span className="text-gray-900 dark:text-white">SKU</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="addProductType"
                          value="idProduct"
                          checked={addProductType === 'idProduct'}
                          onChange={() => setAddProductType('idProduct')}
                          className="focus:ring-2 focus:ring-brand-orange"
                        />
                        <span className="text-gray-900 dark:text-white">Product ID</span>
                      </label>
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor="addProductIds" className="sr-only">
                      Enter product SKUs or IDs, one per line
                    </label>
                    <textarea
                      id="addProductIds"
                      value={addProductIds}
                      onChange={(e) => setAddProductIds(e.target.value)}
                      placeholder="Enter one SKU or product ID per line"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      rows={4}
                      aria-label="Enter product SKUs or IDs, one per line"
                    />
                  </div>
                  <Button 
                    onClick={handleAddProducts} 
                    size="sm"
                    aria-label="Add products to category"
                  >
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Add Products
                  </Button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="text-center py-8" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="sr-only">Loading, please wait. </span>
                    Loading products...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" role="table" aria-label="Products in category">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 text-gray-900 dark:text-white" scope="col">Entry ID</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white" scope="col">Product ID</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white" scope="col">Description</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white" scope="col">SKU</th>
                        <th className="text-left p-2 text-gray-900 dark:text-white" scope="col">Status</th>
                        <th className="text-right p-2 text-gray-900 dark:text-white" scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => (
                        <tr key={item.idCatProd} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2 text-gray-900 dark:text-white">{item.idCatProd}</td>
                          <td className="p-2 text-gray-900 dark:text-white">{item.idProduct}</td>
                          <td className="p-2">
                            {item.product ? (
                              <a
                                href={`/admin/products/${item.product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
                                aria-label={`View product ${item.product.name} in new tab`}
                              >
                                {item.product.name}
                              </a>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-2 text-gray-900 dark:text-white">{item.product?.sku || <span className="text-gray-500 dark:text-gray-400">N/A</span>}</td>
                          <td className="p-2 text-gray-900 dark:text-white">{item.product?.status || <span className="text-gray-500 dark:text-gray-400">N/A</span>}</td>
                          <td className="p-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.idProduct)}
                              aria-label={`Remove product ${item.product?.name || item.idProduct} from category`}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400" role="status">
                            No products in this category
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

