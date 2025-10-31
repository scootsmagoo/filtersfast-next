'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, HelpCircle, BookOpen, ArrowRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category_name: string;
  category_slug: string;
  views: number;
}

export default function SupportPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [categoriesRes, articlesRes] = await Promise.all([
        fetch('/api/support/categories?active=true'),
        fetch('/api/support/articles?type=featured&limit=5'),
      ]);

      const categoriesData = await categoriesRes.json();
      const articlesData = await articlesRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }

      if (articlesData.success) {
        setFeaturedArticles(articlesData.articles);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/support/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-orange-100 mb-8">
              Search our knowledge base or browse categories below
            </p>

            {/* Search Bar */}
            <div className="relative">
              <label htmlFor="support-search" className="sr-only">
                Search support articles
              </label>
              <input
                id="support-search"
                type="search"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search support articles"
                aria-describedby="search-help"
                className="w-full px-6 py-4 pr-12 text-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" aria-hidden="true" />
              <span id="search-help" className="sr-only">
                Type at least 2 characters to search
              </span>
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.length >= 2 && (
              <div 
                className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-96 overflow-y-auto text-left transition-colors"
                role="region"
                aria-live="polite"
                aria-label="Search results"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 transition-colors" role="status">
                    <span className="sr-only">Searching...</span>
                    <span aria-hidden="true">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div role="list">
                    {searchResults.map((article) => (
                      <Link
                        key={article.id}
                        href={`/support/${article.category_slug}/${article.slug}`}
                        className="block p-4 hover:bg-orange-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
                        role="listitem"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors">{article.title}</h3>
                            {article.excerpt && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 transition-colors">{article.excerpt}</p>
                            )}
                            <span className="text-xs text-orange-600 mt-1 inline-block">
                              {article.category_name}
                            </span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 transition-colors" role="status">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100 transition-colors">Browse by Category</h2>
        
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <span className="sr-only">Loading categories...</span>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" aria-hidden="true"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {categories.map((category) => (
            <Link
              key={category.id}
              href={`/support/${category.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 group focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label={`${category.name} - ${category.description || 'View articles'}`}
              >
                <div className="text-4xl mb-4" aria-hidden="true">{category.icon || '📁'}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <BookOpen className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Popular Articles</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-100 dark:divide-gray-700 transition-colors">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/support/${article.category_slug}/${article.slug}`}
                  className="block p-6 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
                  aria-label={`Read article: ${article.title}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 transition-colors">{article.excerpt}</p>
                      )}
                      <span className="text-xs text-orange-600">{article.category_name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 ml-4 flex-shrink-0 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 transition-colors">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors">Still need help?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">Our support team is here to assist you</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@filtersfast.com"
              className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Email our support team"
            >
              Email Support
            </a>
            <a
              href="tel:1-888-992-8786"
              className="inline-block bg-white dark:bg-gray-800 text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Call us at 1-888-992-8786"
            >
              Call 1-888-992-8786
            </a>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 transition-colors">
            Monday - Friday: 8 AM - 6 PM EST
          </p>
        </div>
      </div>
    </div>
  );
}

