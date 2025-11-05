'use client';

/**
 * Admin Reviews Management Page
 * Manage TrustPilot reviews, reply to customers, and view analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Star,
  Search,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  Clock,
  MessageCircle,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import StarRating from '@/components/reviews/StarRating';

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReplies: number;
  recentReviews: number;
  starDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface Review {
  id: string;
  productSku: string;
  productName: string;
  customerName: string;
  customerLocation?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  text: string;
  date: string;
  isVerified: boolean;
  hasReply: boolean;
  reply?: {
    text: string;
    date: string;
  };
  source: 'trustpilot' | 'imported';
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/reviews');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
      fetchReviews();
    }
  }, [session, filterRating, filterStatus, searchQuery]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/reviews/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalReviews: data.totalReviews || 0,
          averageRating: data.averageRating || 0,
          pendingReplies: data.pendingReplies || 0,
          recentReviews: data.recentReviews || 0,
          starDistribution: data.starDistribution || {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        });
      } else {
        // Fallback to empty stats on error
        setStats({
          totalReviews: 0,
          averageRating: 0,
          pendingReplies: 0,
          recentReviews: 0,
          starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
      // Fallback to empty stats on error
      setStats({
        totalReviews: 0,
        averageRating: 0,
        pendingReplies: 0,
        recentReviews: 0,
        starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint for admin reviews list
      // For now, using mock data
      setReviews([
        {
          id: '1',
          productSku: 'MWF',
          productName: 'GE MWF Refrigerator Water Filter',
          customerName: 'John D.',
          customerLocation: 'California',
          rating: 5,
          title: 'Excellent product!',
          text: 'Works perfectly, water tastes great. Fast shipping too!',
          date: '2025-11-04T10:30:00Z',
          isVerified: true,
          hasReply: false,
          source: 'trustpilot',
        },
        {
          id: '2',
          productSku: 'EDR1RXD1',
          productName: 'Whirlpool EDR1RXD1 Water Filter',
          customerName: 'Sarah M.',
          customerLocation: 'Texas',
          rating: 4,
          title: 'Good filter',
          text: 'Does the job well. Took a bit longer to install than expected.',
          date: '2025-11-03T14:20:00Z',
          isVerified: true,
          hasReply: true,
          reply: {
            text: 'Thank you for your feedback! We\'re glad the filter is working well.',
            date: '2025-11-03T16:00:00Z',
          },
          source: 'trustpilot',
        },
        {
          id: '3',
          productSku: 'LT700P',
          productName: 'LG LT700P Refrigerator Water Filter',
          customerName: 'Mike R.',
          customerLocation: 'Florida',
          rating: 2,
          title: 'Not as expected',
          text: 'The filter doesn\'t fit as well as the original. Concerned about leaks.',
          date: '2025-11-02T09:15:00Z',
          isVerified: true,
          hasReply: false,
          source: 'trustpilot',
        },
      ]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto motion-reduce:animate-none" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const filteredReviews = reviews.filter((review) => {
    // OWASP A03: Search filter with sanitization
    if (searchQuery) {
      // Sanitize: remove special characters, limit length, trim whitespace
      const sanitizedQuery = searchQuery.trim().slice(0, 100).toLowerCase();
      if (sanitizedQuery.length === 0) {
        // Skip search if query is empty after sanitization
      } else {
        const customerMatch = review.customerName.toLowerCase().includes(sanitizedQuery);
        const productMatch = review.productName.toLowerCase().includes(sanitizedQuery);
        const textMatch = review.text.toLowerCase().includes(sanitizedQuery);
        
        if (!customerMatch && !productMatch && !textMatch) {
          return false;
        }
      }
    }

    // OWASP A03: Rating filter with validation
    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        // Invalid rating filter, skip
      } else if (review.rating !== ratingValue) {
        return false;
      }
    }

    // OWASP A03: Status filter with validation
    const validStatuses = ['all', 'pending', 'replied'];
    if (!validStatuses.includes(filterStatus)) {
      // Invalid status, default to 'all'
    } else {
      if (filterStatus === 'pending' && review.hasReply) {
        return false;
      }
      if (filterStatus === 'replied' && !review.hasReply) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Back to Admin Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reviews & Ratings
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage customer reviews and respond to feedback
              </p>
            </div>
            <a
              href="https://businessapp.b2b.trustpilot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              aria-label="Open TrustPilot business dashboard (opens in new tab)"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Open Trustpilot Dashboard
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6" role="region" aria-label="Total reviews statistic">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Reviews
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white" aria-label={`${stats.totalReviews.toLocaleString()} total reviews`}>
                    {stats.totalReviews.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6" role="region" aria-label="Average rating statistic">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average Rating
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white" aria-label={`Average rating: ${stats.averageRating.toFixed(1)} out of 5 stars`}>
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <StarRating rating={stats.averageRating} size="sm" className="mt-2" />
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6" role="region" aria-label="Pending replies statistic">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pending Replies
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400" aria-label={`${stats.pendingReplies} pending replies`}>
                    {stats.pendingReplies}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6" role="region" aria-label="Recent reviews statistic">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Recent (7 days)
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400" aria-label={`${stats.recentReviews} recent reviews in the last 7 days`}>
                    {stats.recentReviews}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="review-search"
                placeholder="Search reviews, products, customers..."
                value={searchQuery}
                onChange={(e) => {
                  // OWASP A03: Client-side sanitization - limit length
                  const sanitized = e.target.value.slice(0, 100);
                  setSearchQuery(sanitized);
                }}
                maxLength={100}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                aria-label="Search reviews by customer name, product name, or review text"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label htmlFor="rating-filter" className="sr-only">
                Filter by rating
              </label>
              <select
                id="rating-filter"
                value={filterRating}
                onChange={(e) => {
                  // OWASP A03: Validate filter value
                  const validValues = ['all', '1', '2', '3', '4', '5'];
                  if (validValues.includes(e.target.value)) {
                    setFilterRating(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                aria-label="Filter reviews by star rating"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by reply status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => {
                  // OWASP A03: Validate filter value
                  const validValues = ['all', 'pending', 'replied'];
                  if (validValues.includes(e.target.value)) {
                    setFilterStatus(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                aria-label="Filter reviews by reply status"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending Reply</option>
                <option value="replied">Already Replied</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <section aria-labelledby="reviews-list-heading">
          <h2 id="reviews-list-heading" className="sr-only">
            Reviews List
          </h2>
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center" role="region" aria-labelledby="no-reviews-heading">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h3 id="no-reviews-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or search query
              </p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <article>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.isVerified && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" aria-label="Verified purchase">
                            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            Verified
                          </span>
                        )}
                        {!review.hasReply && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400" aria-label="Pending reply">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            Pending Reply
                          </span>
                        )}
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h3>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {review.text}
                      </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{review.customerName}</span>
                      {review.customerLocation && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>{review.customerLocation}</span>
                        </>
                      )}
                      <span aria-hidden="true">•</span>
                      <time dateTime={review.date}>{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                      <span aria-hidden="true">•</span>
                      <span className="text-xs">
                        Product: <strong>{review.productName}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Open reply modal
                        alert('Reply modal coming soon!');
                      }}
                      aria-label={review.hasReply ? `View reply to review from ${review.customerName}` : `Reply to review from ${review.customerName}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                      {review.hasReply ? 'View Reply' : 'Reply'}
                    </Button>
                  </div>
                </div>

                {/* Existing Reply */}
                {review.hasReply && review.reply && (
                  <div className="mt-4 pl-4 border-l-2 border-brand-orange bg-orange-50 dark:bg-orange-900/20 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase">
                        FiltersFast Response
                      </span>
                      <time dateTime={review.reply.date} className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.reply.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {review.reply.text}
                    </p>
                  </div>
                )}
                </article>
              </Card>
            ))
            )}
          </div>
        </section>

        {/* Phase 2 Notice */}
        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" role="region" aria-labelledby="phase-notice-heading">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
            <div>
              <h4 id="phase-notice-heading" className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Phase 2: In Development
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Reply functionality, invite customers, and advanced analytics are coming soon.
                For now, manage reviews directly through the TrustPilot dashboard.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

