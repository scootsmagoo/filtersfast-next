import Link from 'next/link';
import { BlogPost } from '@/lib/types/blog';
import { Calendar, User, MessageSquare } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <Link href={`/blog/${post.slug}`}>
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <time dateTime={post.publishedAt}>{formattedDate}</time>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" aria-hidden="true" />
            <span>by {post.author.name}</span>
          </div>
          {post.commentsCount !== undefined && post.commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>{post.commentsCount} Comment{post.commentsCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-brand-orange transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center text-brand-orange hover:text-brand-orange-dark font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
          aria-label={`Read more about ${post.title}`}
        >
          Read more
          <span className="ml-2" aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

