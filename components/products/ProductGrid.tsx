'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import { Grid, List } from 'lucide-react';

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
  maxCartQty?: number | null;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('bestseller');

  return (
    <div className="space-y-6">
      {/* Title */}
      {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{title}</h2>}
      
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div className="text-brand-gray-600 dark:text-gray-300 transition-colors">
          Showing <span className="font-semibold text-brand-gray-900 dark:text-gray-100 transition-colors">{products.length}</span> products
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          >
            <option value="bestseller">Best Sellers</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-brand-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-700 transition-colors">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-gray-600 dark:text-gray-400 hover:bg-brand-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-gray-600 dark:text-gray-400 hover:bg-brand-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'flex flex-col gap-4'
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} viewMode={viewMode} />
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex justify-center items-center gap-2 transition-colors">
        <button className="px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300" disabled>
          Previous
        </button>
        <button className="px-4 py-2 bg-brand-orange text-white rounded font-semibold">
          1
        </button>
        <button className="px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
          2
        </button>
        <button className="px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
          3
        </button>
        <button className="px-4 py-2 border border-brand-gray-300 dark:border-gray-600 rounded hover:bg-brand-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
          Next
        </button>
      </div>
    </div>
  );
}

