import { Metadata } from 'next';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import Pagination from '@/components/blog/Pagination';
import { getAllPosts } from '@/lib/data/blog-posts';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Filtered Files - FiltersFast Blog',
  description: 'Your #1 resource for air and water filtration related information. Expert guides, tips, and insights on maintaining clean air and water in your home.',
  openGraph: {
    title: 'The Filtered Files - FiltersFast Blog',
    description: 'Your #1 resource for air and water filtration related information.',
    type: 'website',
  },
};

const POSTS_PER_PAGE = 5;

export default function BlogPage() {
  const allPosts = getAllPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const currentPage = 1;
  const posts = allPosts.slice(0, POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="w-16 h-16" aria-hidden="true" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              The Filtered Files
            </h1>
            <p className="text-xl text-white/90">
              Your #1 Resource for Air and Water Filtration Information
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <nav className="flex flex-wrap gap-2 md:gap-4 py-4 overflow-x-auto" aria-label="Blog categories">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-lg bg-brand-orange text-white font-semibold whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              aria-current="page"
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
          {/* Blog Posts */}
          <div className="lg:col-span-2 space-y-8">
            {posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl="/blog"
                  />
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No posts found
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for new articles!
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

