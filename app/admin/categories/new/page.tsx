'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { CategoryWithChildren, CategoryFormData, CategoryType } from '@/lib/types/category';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [parentCategories, setParentCategories] = useState<CategoryWithChildren[]>([]);
  
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
    pagname: '',
    metatitle: '',
    metadesc: '',
    metacat: ''
  });

  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.categories) {
        setParentCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryDesc.trim()) {
      // Use accessible error notification
      const errorMsg = 'Category name is required';
      alert(errorMsg);
      // Focus on the field
      const field = document.getElementById('categoryDesc');
      if (field) field.focus();
      return;
    }

    if (!formData.pagname || !formData.pagname.includes('-cat')) {
      const errorMsg = 'Category URL must contain "-cat" and end with ".asp"';
      alert(errorMsg);
      const field = document.getElementById('pagname');
      if (field) field.focus();
      return;
    }
    
    setSaving(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      const data = await response.json();
      router.push(`/admin/categories/${data.category.id}?msg=${encodeURIComponent('Category created successfully')}`);
    } catch (error) {
      console.error('Error creating category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create category';
      alert(errorMsg);
      // Announce error to screen readers
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

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'New Category', href: '/admin/categories/new' }
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Category
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add a new product category to your store
          </p>
        </div>
        <Link href="/admin/categories">
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
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
                    htmlFor="categoryDesc"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Name *
                  </label>
                  <input
                    id="categoryDesc"
                    type="text"
                    required
                    value={formData.categoryDesc}
                    onChange={(e) => setFormData({ ...formData, categoryDesc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={100}
                    aria-required="true"
                    aria-describedby="categoryDesc-help"
                  />
                  <p id="categoryDesc-help" className="sr-only">Enter a category name up to 100 characters</p>
                </div>

                <div>
                  <label 
                    htmlFor="idParentCategory"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Parent Category *
                  </label>
                  <select
                    id="idParentCategory"
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
                      htmlFor="categoryType"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Category Type
                    </label>
                    <select
                      id="categoryType"
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
                      htmlFor="categoryFeatured"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Featured
                    </label>
                    <select
                      id="categoryFeatured"
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
                      htmlFor="sortOrder"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Sort Order
                    </label>
                    <input
                      id="sortOrder"
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
                      htmlFor="hideFromListings"
                      className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                    >
                      Show in Listings
                    </label>
                    <select
                      id="hideFromListings"
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
                    htmlFor="pagname"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category URL *
                  </label>
                  <input
                    id="pagname"
                    type="text"
                    required
                    value={formData.pagname || ''}
                    onChange={(e) => setFormData({ ...formData, pagname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="example-cat.asp"
                    maxLength={100}
                    aria-required="true"
                    aria-describedby="pagname-help"
                  />
                  <p id="pagname-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must contain '-cat' and end with '.asp'
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
                    htmlFor="metatitle"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Title
                  </label>
                  <input
                    id="metatitle"
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
                    htmlFor="metadesc"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Description
                  </label>
                  <input
                    id="metadesc"
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
                    htmlFor="metacat"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Page Keywords
                  </label>
                  <input
                    id="metacat"
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
                    htmlFor="categoryHTML"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category HTML (Short)
                  </label>
                  <input
                    id="categoryHTML"
                    type="text"
                    value={formData.categoryHTML || ''}
                    onChange={(e) => setFormData({ ...formData, categoryHTML: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    maxLength={255}
                    aria-describedby="categoryHTML-help"
                  />
                  <p id="categoryHTML-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max 255 characters
                  </p>
                </div>

                <div>
                  <label 
                    htmlFor="categoryHTMLLong"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category HTML (Long)
                  </label>
                  <textarea
                    id="categoryHTMLLong"
                    value={formData.categoryHTMLLong || ''}
                    onChange={(e) => setFormData({ ...formData, categoryHTMLLong: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    rows={6}
                    aria-label="Long HTML content for category page"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="categoryContentLocation"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Content Location
                  </label>
                  <select
                    id="categoryContentLocation"
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
                    htmlFor="categoryGraphic"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Splash Image
                  </label>
                  <input
                    id="categoryGraphic"
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
                    htmlFor="categoryImage"
                    className="block text-sm font-medium mb-1 text-gray-900 dark:text-white"
                  >
                    Category Graphic
                  </label>
                  <input
                    id="categoryImage"
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
                  aria-label={saving ? 'Creating category, please wait' : 'Create new category'}
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  {saving ? 'Creating...' : 'Create Category'}
                  {saving && <span className="sr-only">Please wait, creating category</span>}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

