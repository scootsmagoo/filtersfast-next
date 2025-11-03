import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogSidebar from '@/components/blog/BlogSidebar';
import { getPostBySlug, getAllPosts } from '@/lib/data/blog-posts';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import { blogCategories } from '@/lib/types/blog';
import { sanitizeHtml } from '@/lib/sanitize-html';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - FiltersFast Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const categoryInfo = blogCategories[post.category];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container-custom py-8">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Blog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="relative h-96 w-full overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8">
                {/* Category Badge */}
                <Link
                  href={`/blog/category/${post.category}`}
                  className="inline-block px-3 py-1 text-sm font-semibold bg-brand-orange text-white rounded-full mb-4 hover:bg-brand-orange-dark transition-colors"
                >
                  {categoryInfo.title}
                </Link>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {post.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>{formattedDate}</time>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" aria-hidden="true" />
                    <span>by {post.author.name}</span>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="prose prose-lg dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-a:text-brand-orange hover:prose-a:text-brand-orange-dark
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                    prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300
                    prose-table:text-gray-700 dark:prose-table:text-gray-300
                    prose-th:bg-gray-100 dark:prose-th:bg-gray-800
                    prose-td:border-gray-300 dark:prose-td:border-gray-700"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" aria-hidden="true" />
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Found this article helpful? Share it with others!
                  </p>
                  <div className="flex flex-wrap gap-3" role="group" aria-label="Social media sharing options">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.filtersfast.com/blog/${post.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877f2]"
                      aria-label={`Share "${post.title}" on Facebook`}
                    >
                      Share on Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.filtersfast.com/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#1da1f2] text-white rounded-lg hover:bg-[#1a91da] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1da1f2]"
                      aria-label={`Share "${post.title}" on Twitter`}
                    >
                      Share on Twitter
                    </a>
                  </div>
                </div>

                {/* Related Products CTA */}
                <aside className="mt-8 p-6 bg-gradient-to-r from-brand-orange to-brand-orange-dark rounded-lg text-white" aria-label="Related products and support">
                  <h2 className="text-2xl font-bold mb-2">
                    Shop Related Filters
                  </h2>
                  <p className="mb-4 text-white/90">
                    Find the perfect filtration solution for your home.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {post.category === 'air' && (
                      <Link
                        href="/air-filters"
                        className="px-6 py-3 bg-white text-brand-orange font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                      >
                        Shop Air Filters
                      </Link>
                    )}
                    {post.category === 'water' && (
                      <>
                        <Link
                          href="/refrigerator-filters"
                          className="px-6 py-3 bg-white text-brand-orange font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                        >
                          Shop Refrigerator Filters
                        </Link>
                        <Link
                          href="/water-filters"
                          className="px-6 py-3 bg-white text-brand-orange font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                        >
                          Shop Water Filters
                        </Link>
                      </>
                    )}
                    {post.category === 'buyers-guides' && (
                      <Link
                        href="/products"
                        className="px-6 py-3 bg-white text-brand-orange font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                      >
                        Browse All Products
                      </Link>
                    )}
                    <Link
                      href="/support"
                      className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-brand-orange transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                    >
                      Need Help? Contact Us
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1" aria-label="Blog navigation and resources">
            <div className="sticky top-8">
              <BlogSidebar currentCategory={post.category} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

