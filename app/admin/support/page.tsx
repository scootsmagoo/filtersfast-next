'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FolderOpen, 
  Eye, 
  ThumbsUp, 
  TrendingUp,
  Plus,
  Settings
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface Analytics {
  total_articles: number;
  total_categories: number;
  total_views: number;
  views_last_30_days: number;
  helpful_percentage: number;
  total_feedback: number;
}

interface CategoryAnalytics {
  id: number;
  name: string;
  slug: string;
  article_count: number;
  total_views: number | null;
  helpful_count: number | null;
}

export default function AdminSupportPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/support/stats');
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.analytics);
        setCategoryAnalytics(data.categoryAnalytics);
      }
    } catch (error) {
      console.error('Error fetching support stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <AdminBreadcrumb />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Support Portal Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors">Manage knowledge base articles and categories</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Portal
            </Link>
            <Link
              href="/admin/support/articles/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Article
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Total Articles</h3>
                <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{analytics.total_articles}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Published articles</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Categories</h3>
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{analytics.total_categories}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Active categories</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Total Views</h3>
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                {analytics.total_views.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                {analytics.views_last_30_days.toLocaleString()} in last 30 days
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">Helpful Rating</h3>
                <ThumbsUp className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{analytics.helpful_percentage}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                From {analytics.total_feedback.toLocaleString()} responses
              </p>
            </div>
          </div>
        )}

        {/* Category Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Category Performance</h2>
            <Link
              href="/admin/support/categories"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium transition-colors"
            >
              Manage Categories →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 transition-colors">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">Articles</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">Total Views</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">Helpful Votes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalytics.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4">
                      <Link
                        href={`/support/${category.slug}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        {category.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400 transition-colors">
                      {category.article_count}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400 transition-colors">
                      {(category.total_views || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400 transition-colors">
                      {(category.helpful_count || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/support/categories/${category.slug}`}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg transition-colors">
                <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Manage Articles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Create, edit, and organize support articles</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/support/articles"
                className="block text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium transition-colors"
              >
                View All Articles →
              </Link>
              <Link
                href="/admin/support/articles/new"
                className="block text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Create New Article →
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors">
                <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors">Manage Categories</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Organize articles into categories</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/support/categories"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All Categories →
              </Link>
              <Link
                href="/admin/support/categories/new"
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Create New Category →
              </Link>
            </div>
          </div>
        </div>

        {/* Note about full admin implementation */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 transition-colors">Admin Dashboard</h4>
          <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
            This is the support portal analytics dashboard. Full CRUD interfaces for articles and categories 
            can be added based on your needs. The database schema and API routes are fully functional.
            You can create articles via the seed script or by building out the full admin UI.
          </p>
        </div>
      </div>
    </div>
  );
}

