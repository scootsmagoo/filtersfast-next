'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Box,
  Archive,
  PackageOpen,
  Edit3
} from 'lucide-react';
import Link from 'next/link';
import type { Product, ProductStats, ProductFilters as ProductFiltersType } from '@/lib/types/product';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  stats?: ProductStats;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ProductFiltersType>({
    status: undefined,
    type: undefined,
    brand: undefined,
    stockStatus: undefined,
    sortBy: 'updated',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());
      if (search) params.set('search', search);
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.stockStatus) params.set('stockStatus', filters.stockStatus);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (page === 1) params.set('includeStats', 'true');

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error('Failed to load products');

      const data: ProductListResponse = await response.json();
      setProducts(data.products);
      setTotal(data.total);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load brands and categories
  const loadMetadata = async () => {
    try {
      const response = await fetch('/api/admin/products/stats');
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.brands) setBrands(data.brands);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search, filters]);

  useEffect(() => {
    loadMetadata();
  }, []);

  // Delete product
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive product "${name}"? This will hide it from the store but can be restored later.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert('Product archived successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  // Status badge
  const StatusBadge = ({ status }: { status: Product['status'] }) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'out-of-stock': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Product Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage your product catalog
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/products/shipments">
                <Button variant="secondary" className="flex items-center gap-2">
                  <PackageOpen className="w-5 h-5" />
                  Inbound Shipments
                </Button>
              </Link>
              <Link href="/admin/products/new">
                <Button className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                    Total Products
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                    Active Products
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-colors">
                    {stats.activeProducts}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                    Low Stock
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-colors">
                    {stats.lowStockProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                    Low Stock
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-colors">
                    {stats.lowStockProducts}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                    Avg Price
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                    ${stats.averagePrice.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-colors">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                aria-label="Search products"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              aria-label={showFilters ? "Hide filters" : "Show filters"}
              aria-expanded={showFilters}
            >
              <Filter className="w-5 h-5" aria-hidden="true" />
              Filters
            </Button>

            {/* Refresh */}
            <Button
              variant="secondary"
              onClick={() => loadProducts()}
              className="flex items-center gap-2"
              aria-label="Refresh products list"
            >
              <RefreshCw className="w-5 h-5" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filters.status || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value as any || undefined });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Filter products by status"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Type
                </label>
                <select
                  id="filter-type"
                  value={filters.type || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, type: e.target.value as any || undefined });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Filter products by type"
                >
                  <option value="">All Types</option>
                  <option value="air-filter">Air Filter</option>
                  <option value="water-filter">Water Filter</option>
                  <option value="refrigerator-filter">Refrigerator Filter</option>
                  <option value="humidifier-filter">Humidifier Filter</option>
                  <option value="pool-filter">Pool Filter</option>
                  <option value="accessory">Accessory</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label htmlFor="filter-brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Brand
                </label>
                <select
                  id="filter-brand"
                  value={filters.brand || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, brand: e.target.value || undefined });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Filter products by brand"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label htmlFor="filter-stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Stock Status
                </label>
                <select
                  id="filter-stock"
                  value={filters.stockStatus || ''}
                  onChange={(e) => {
                    setFilters({ ...filters, stockStatus: e.target.value || undefined });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Filter products by stock status"
                >
                  <option value="">All Stock Levels</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="filter-sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Sort By
                </label>
                <select
                  id="filter-sort"
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Sort products"
                >
                  <option value="updated-desc">Recently Updated</option>
                  <option value="created-desc">Recently Created</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
              <span className="sr-only">Loading, please wait. Fetching products.</span>
              <p className="text-gray-600 dark:text-gray-400 transition-colors" aria-hidden="true">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center" role="status">
              <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                {search || filters.status || filters.type || filters.brand
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first product'}
              </p>
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Products list">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            {product.primaryImage ? (
                              <img src={product.primaryImage} alt={product.name} className="h-10 w-10 object-cover rounded" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" aria-hidden="true" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                              {product.brand}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            product.inventoryQuantity === 0
                              ? 'text-red-600 dark:text-red-400'
                              : product.inventoryQuantity <= (product.lowStockThreshold || 10) * 0.5
                              ? 'text-orange-600 dark:text-orange-400'
                              : product.inventoryQuantity <= (product.lowStockThreshold || 10)
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {product.inventoryQuantity}
                          </span>
                          {product.inventoryQuantity === 0 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Out
                            </span>
                          ) : product.inventoryQuantity <= (product.lowStockThreshold || 10) * 0.5 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              Critical
                            </span>
                          ) : product.inventoryQuantity <= (product.lowStockThreshold || 10) ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/${product.id}`}>
                            <Button variant="secondary" size="sm" aria-label={`Edit ${product.name}`}>
                              <Edit className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(product.id, product.name)}
                            aria-label={`Archive ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav 
              className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
              aria-label="Product pagination"
            >
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Go to previous page"
                  aria-disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Go to next page"
                  aria-disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </Card>
      </div>
    </div>
  );
}

