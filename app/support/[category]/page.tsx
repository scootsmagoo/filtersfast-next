'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ArrowRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  views: number;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryData();
    }
  }, [categorySlug]);

  const fetchCategoryData = async () => {
    try {
      const res = await fetch(`/api/support/categories/${categorySlug}`);
      const data = await res.json();

      if (data.success) {
        setCategory(data.category);
        setArticles(data.articles);
      } else {
        setError('Category not found');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">Loading category...</span>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" aria-hidden="true"></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/support"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Return to support homepage"
            >
              Back to Support
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/support"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Link>
          <div className="flex items-center mb-4">
            <span className="text-5xl mr-4">{category.icon || '📁'}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-gray-600 mt-2">{category.description}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500">{articles.length} articles in this category</p>
        </div>
      </div>

      {/* Articles List */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {articles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Articles Yet</h2>
              <p className="text-gray-600 mb-6">
                Articles for this category are coming soon.
              </p>
              <Link
                href="/support"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label="Browse other support categories"
              >
                Browse Other Categories
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/support/${categorySlug}/${article.slug}`}
                  className="block p-6 hover:bg-orange-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
                  aria-label={`Read article: ${article.title}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600">{article.excerpt}</p>
                      )}
                      <div className="flex items-center mt-3 text-sm text-gray-500">
                        <span>{article.views} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-orange-600 ml-4 flex-shrink-0 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

