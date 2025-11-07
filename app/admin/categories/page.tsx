'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  Package
} from 'lucide-react';
import Link from 'next/link';
import type { CategoryWithChildren } from '@/lib/types/category';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface CategoryListResponse {
  success: boolean;
  categories: CategoryWithChildren[];
  total: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('Failed to load categories');

      const data: CategoryListResponse = await response.json();
      
      // Build tree structure
      const categoryMap = new Map<number, CategoryWithChildren>();
      const rootCategories: CategoryWithChildren[] = [];
      
      // First pass: create all categories
      data.categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      // Second pass: build tree
      data.categories.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.idParentCategory === 0 || cat.idParentCategory === 1) {
          rootCategories.push(category);
        } else {
          const parent = categoryMap.get(cat.idParentCategory);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(category);
          } else {
            // Orphan category
            rootCategories.push(category);
          }
        }
      });
      
      // Sort by categoryType, then by categoryDesc
      function sortCategories(cats: CategoryWithChildren[]): CategoryWithChildren[] {
        return cats.sort((a, b) => {
          if (a.categoryType !== b.categoryType) {
            return (a.categoryType || '').localeCompare(b.categoryType || '');
          }
          return a.categoryDesc.localeCompare(b.categoryDesc);
        }).map(cat => ({
          ...cat,
          children: cat.children ? sortCategories(cat.children) : []
        }));
      }
      
      setCategories(sortCategories(rootCategories));
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    
    // Check for message in URL
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
      setMessage(decodeURIComponent(msg));
      // Clear from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    // Use accessible confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${categoryName}"? This will unlink all products from this category but will not delete the products themselves.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      // Reload categories
      loadCategories();
      const successMsg = 'Category deleted successfully';
      setMessage(successMsg);
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = successMsg;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete category';
      alert(errorMsg);
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
    }
  };

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = level * 24;

    // Group children by categoryType
    const childrenByType = new Map<string, CategoryWithChildren[]>();
    if (category.children) {
      category.children.forEach(child => {
        const type = child.categoryType || 'Uncategorized';
        if (!childrenByType.has(type)) {
          childrenByType.set(type, []);
        }
        childrenByType.get(type)!.push(child);
      });
    }

    return (
      <div key={category.id} className="border-b border-gray-200 dark:border-gray-700">
        <div 
          className="flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleCategory(category.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${category.categoryDesc}` : `Expand ${category.categoryDesc}`}
              aria-controls={`subcategories-${category.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          ) : (
            <div className="w-6" aria-hidden="true" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.categoryDesc}</span>
              {category.categoryType && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {category.categoryType}
                </span>
              )}
              {category.productCount !== undefined && category.productCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({category.productCount} products)
                </span>
              )}
            </div>
            {category.parentCategoryDesc && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Parent: {category.parentCategoryDesc}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ID: {category.id}
            </span>
            {category.sortOrder !== null && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Sort: {category.sortOrder}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {category.categoryFeatured === 'Y' ? '⭐' : ''}
            </span>
            
            <div className="flex items-center gap-1">
              <Link href={`/admin/categories/${category.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  aria-label={`Edit category ${category.categoryDesc}`}
                >
                  <Edit className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
              {category.pagname && (
                <a 
                  href={`/${category.pagname}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Preview category ${category.categoryDesc} in new tab`}
                >
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </a>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDelete(category.id, category.categoryDesc)}
                aria-label={`Delete category ${category.categoryDesc}`}
              >
                <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div id={`subcategories-${category.id}`} role="group" aria-label={`Subcategories of ${category.categoryDesc}`}>
            {Array.from(childrenByType.entries()).map(([type, children]) => (
              <div key={type}>
                <div 
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-medium text-sm"
                  style={{ paddingLeft: `${36 + indent}px` }}
                  role="heading"
                  aria-level={level + 2}
                >
                  {type}
                </div>
                {children.map(child => renderCategory(child, level + 1))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' }
        ]}
      />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-8 h-8" />
            Category Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage product categories and their hierarchy
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button aria-label="Create a new category">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add New Category
          </Button>
        </Link>
      </div>

      {message && (
        <div 
          className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-green-800 dark:text-green-200">{message}</p>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-8 text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="sr-only">Loading, please wait. </span>
              Loading categories...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center" role="status" aria-live="polite">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No categories found</p>
            <Link href="/admin/categories/new">
              <Button aria-label="Create the first category">Create First Category</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium" role="rowgroup">
              <div className="grid grid-cols-12 gap-4" role="row">
                <div className="col-span-5" role="columnheader">Category</div>
                <div className="col-span-2" role="columnheader">Type</div>
                <div className="col-span-2" role="columnheader">Products</div>
                <div className="col-span-3 text-right" role="columnheader">Actions</div>
              </div>
            </div>
            <div>
              {categories.map(category => renderCategory(category))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

