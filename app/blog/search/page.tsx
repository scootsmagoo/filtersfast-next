import { Metadata } from 'next';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import { searchPosts } from '@/lib/data/blog-posts';
import { Search, BookOpen } from 'lucide-react';
import { sanitizeText } from '@/lib/sanitize-html';

export const metadata: Metadata = {
  title: 'Search Blog - FiltersFast',
  description: 'Search our blog for articles about air and water filtration.',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default function BlogSearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams.q || '';
  const query = sanitizeText(rawQuery);
  const results = query ? searchPosts(query) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Search className="w-16 h-16" aria-hidden="true" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Search Results
            </h1>
            {query && (
              <p className="text-xl text-white/90">
                Showing results for &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <nav className="flex flex-wrap gap-2 md:gap-4 py-4 overflow-x-auto" aria-label="Blog categories">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Home
            </Link>
            <Link
              href="/blog/category/water"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Water
            </Link>
            <Link
              href="/blog/category/air"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Air
            </Link>
            <Link
              href="/blog/category/buyers-guides"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Buyer&apos;s Guides
            </Link>
            <Link
              href="/blog/category/business"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Business
            </Link>
            <Link
              href="/blog/category/just-for-you"
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Just For You
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-2 space-y-8">
            {!query ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Enter a search query
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the search box in the sidebar to find articles.
                </p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Found <strong>{results.length}</strong> article{results.length !== 1 ? 's' : ''} matching your search.
                  </p>
                </div>
                {results.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No results found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn&apos;t find any articles matching &quot;{query}&quot;. Try different keywords or browse our categories.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/blog"
                    className="px-6 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange"
                  >
                    View All Posts
                  </Link>
                  <Link
                    href="/blog/category/buyers-guides"
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Browse Buyer&apos;s Guides
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1" aria-label="Blog navigation and resources">
            <BlogSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}

