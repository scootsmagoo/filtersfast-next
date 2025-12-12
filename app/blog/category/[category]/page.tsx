import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import BlogSidebar from '@/components/blog/BlogSidebar';
import Pagination from '@/components/blog/Pagination';
import { getPostsByCategory } from '@/lib/data/blog-posts';
import { blogCategories, BlogCategory } from '@/lib/types/blog';
import { BookOpen } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = blogCategories[category as BlogCategory];
  
  if (!categoryInfo) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${categoryInfo.title} - FiltersFast Blog`,
    description: categoryInfo.description,
    openGraph: {
      title: `${categoryInfo.title} - FiltersFast Blog`,
      description: categoryInfo.description,
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return Object.keys(blogCategories).map((category) => ({
    category,
  }));
}

const POSTS_PER_PAGE = 5;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryInfo = blogCategories[category as BlogCategory];

  if (!categoryInfo) {
    notFound();
  }

  const allCategoryPosts = getPostsByCategory(category);
  const totalPages = Math.ceil(allCategoryPosts.length / POSTS_PER_PAGE);
  const currentPage = 1;
  const posts = allCategoryPosts.slice(0, POSTS_PER_PAGE);

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
              {categoryInfo.title}
            </h1>
            <p className="text-xl text-white/90">
              {categoryInfo.description}
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
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              Home
            </Link>
            <Link
              href="/blog/category/water"
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                category === 'water'
                  ? 'bg-brand-orange text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-current={category === 'water' ? 'page' : undefined}
            >
              Water
            </Link>
            <Link
              href="/blog/category/air"
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                category === 'air'
                  ? 'bg-brand-orange text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-current={category === 'air' ? 'page' : undefined}
            >
              Air
            </Link>
            <Link
              href="/blog/category/buyers-guides"
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                category === 'buyers-guides'
                  ? 'bg-brand-orange text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-current={category === 'buyers-guides' ? 'page' : undefined}
            >
              Buyer&apos;s Guides
            </Link>
            <Link
              href="/blog/category/business"
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                category === 'business'
                  ? 'bg-brand-orange text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-current={category === 'business' ? 'page' : undefined}
            >
              Business
            </Link>
            <Link
              href="/blog/category/just-for-you"
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                category === 'just-for-you'
                  ? 'bg-brand-orange text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-current={category === 'just-for-you' ? 'page' : undefined}
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
                    baseUrl={`/blog/category/${category}`}
                  />
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No posts in this category yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for new articles!
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlogSidebar currentCategory={category as BlogCategory} />
          </div>
        </div>
      </div>
    </div>
  );
}

