'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag as TagIcon,
  Filter,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import type { BlogPost, BlogCategory } from '@/lib/types/blog';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface BlogListResponse {
  success: boolean;
  posts: BlogPost[];
  counts: {
    total: number;
    published: number;
    drafts: number;
  };
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [counts, setCounts] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Load blog posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      params.set('includeDrafts', includeDrafts.toString());

      const response = await fetch(`/api/admin/blog?${params}`);
      if (!response.ok) throw new Error('Failed to load blog posts');

      const data: BlogListResponse = await response.json();
      setPosts(data.posts);
      setCounts(data.counts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      alert('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [search, category, includeDrafts]);

  // Delete post
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete blog post "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete blog post');

      alert('Blog post deleted successfully');
      loadPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    }
  };

  // Status badge
  const StatusBadge = ({ isPublished }: { isPublished: boolean }) => {
    if (isPublished) {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Published
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Draft
      </span>
    );
  };

  // Category badge
  const CategoryBadge = ({ category }: { category: BlogCategory }) => {
    const colors: Record<BlogCategory, string> = {
      water: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      air: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'buyers-guides': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      business: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'just-for-you': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category]}`}>
        {category.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Blog Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage blog posts and content
              </p>
            </div>
            <Link href="/admin/blog/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                  Total Posts
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {counts.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                  Published
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {counts.published}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-colors">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">
                  Drafts
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                  {counts.drafts}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="blog-search" className="sr-only">
                Search blog posts
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="blog-search"
                  type="text"
                  placeholder="Search posts"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex flex-col">
                <label htmlFor="blog-category-filter" className="sr-only">
                  Filter by category
                </label>
                <select
                  id="blog-category-filter"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                >
                <option value="all">All Categories</option>
                <option value="water">Water</option>
                <option value="air">Air</option>
                <option value="buyers-guides">Buyer's Guides</option>
                <option value="business">Business</option>
                <option value="just-for-you">Just For You</option>
                <option value="general">General</option>
                </select>
              </div>
              <label htmlFor="blog-include-drafts" className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer">
                <input
                  id="blog-include-drafts"
                  type="checkbox"
                  checked={includeDrafts}
                  onChange={(e) => setIncludeDrafts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Drafts</span>
              </label>
              <Button
                variant="secondary"
                onClick={loadPosts}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Posts Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {search || category !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating your first blog post'}
              </p>
              {!search && category === 'all' && (
                <Link href="/admin/blog/new">
                  <Button>Create Your First Post</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Published</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {post.excerpt.substring(0, 80)}...
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <CategoryBadge category={post.category} />
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {post.author.name}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge isPublished={post.publishedAt ? true : false} />
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        {post.publishedAt ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button variant="secondary" size="sm" className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/admin/blog/${post.id}`}>
                            <Button variant="secondary" size="sm" className="flex items-center gap-1">
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDelete(post.id, post.title)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

