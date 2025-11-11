'use client';

/**
 * Admin Reviews Management Page
 * Manage TrustPilot reviews, reply to customers, and view analytics
 */

import { useState, useEffect, useRef } from 'react';
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
  X,
  Send,
  Mail,
  BarChart3,
  Timer,
  TrendingDown,
  Smile,
  Meh,
  Frown,
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
  responseRate?: number; // Percentage of reviews with replies
  avgResponseTime?: number; // Hours to respond
  sentimentTrend?: {
    positive: number; // 4-5 stars
    neutral: number; // 3 stars  
    negative: number; // 1-2 stars
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
  const [syncingReviews, setSyncingReviews] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  
  // Invitation modal state
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteOrderRef, setInviteOrderRef] = useState('');
  const [inviteProductSku, setInviteProductSku] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
  // Modal refs for focus management
  const replyModalRef = useRef<HTMLDivElement>(null);
  const invitationModalRef = useRef<HTMLDivElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inviteEmailRef = useRef<HTMLInputElement>(null);

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

  // WCAG 2.4.3: Focus management for reply modal
  useEffect(() => {
    if (replyModalOpen && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [replyModalOpen]);

  // WCAG 2.4.3: Focus management for invitation modal
  useEffect(() => {
    if (invitationModalOpen && inviteEmailRef.current) {
      inviteEmailRef.current.focus();
    }
  }, [invitationModalOpen]);

  // WCAG 2.1.2: Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (replyModalOpen) {
          closeReplyModal();
        }
        if (invitationModalOpen) {
          closeInvitationModal();
        }
      }
    };

    if (replyModalOpen || invitationModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // WCAG 2.4.3: Prevent body scroll when modal open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [replyModalOpen, invitationModalOpen]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/reviews/stats');
      if (!response.ok) {
        throw new Error(`Failed to fetch stats (${response.status})`);
      }

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
        responseRate: data.responseRate || 0,
        avgResponseTime: data.avgResponseTime || 0,
        sentimentTrend: data.sentimentTrend || undefined,
      });
    } catch (error) {
      console.error('Error fetching review stats:', error);
      // Fallback to empty stats on error
      setStats({
        totalReviews: 0,
        averageRating: 0,
        pendingReplies: 0,
        recentReviews: 0,
        starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        avgResponseTime: 0,
        sentimentTrend: undefined,
      });
    }
  };

  const openReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply?.text || '');
    setReplyError('');
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setSelectedReview(null);
    setReplyText('');
    setReplyError('');
  };

  const submitReply = async () => {
    if (!selectedReview) return;
    
    setReplyLoading(true);
    setReplyError('');
    
    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReplyError(data.error || 'Failed to post reply');
        return;
      }

      const replyDate = data.reply?.createdAt || new Date().toISOString();

      // Update the review in the local state
      setReviews(prev =>
        prev.map(r =>
          r.id === selectedReview.id
            ? {
                ...r,
                hasReply: true,
                reply: {
                  text: replyText,
                  date: replyDate,
                },
              }
            : r
        )
      );

      // Close modal and refresh stats
      closeReplyModal();
      fetchStats();
    } catch (error) {
      setReplyError('An error occurred while posting the reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const openInvitationModal = () => {
    setInviteEmail('');
    setInviteName('');
    setInviteOrderRef('');
    setInviteProductSku('');
    setInviteError('');
    setInviteSuccess(false);
    setInvitationModalOpen(true);
  };

  const closeInvitationModal = () => {
    setInvitationModalOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteOrderRef('');
    setInviteProductSku('');
    setInviteError('');
    setInviteSuccess(false);
  };

  const submitInvitation = async () => {
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess(false);
    
    try {
      const response = await fetch('/api/admin/reviews/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: inviteEmail,
          customerName: inviteName,
          orderReference: inviteOrderRef,
          productSku: inviteProductSku || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation');
        return;
      }

      setInviteSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        closeInvitationModal();
      }, 2000);
    } catch (error) {
      setInviteError('An error occurred while sending the invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('limit', '100');

      const sanitizedSearch = searchQuery.trim();
      if (sanitizedSearch.length > 0) {
        params.set('search', sanitizedSearch);
      }

      if (filterRating !== 'all') {
        params.set('rating', filterRating);
      }

      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();
      const mapped: Review[] = (data.reviews || []).map((review: any) => {
        const metadata = review.metadata || {};
        const productName =
          metadata.productReview?.productName ||
          metadata.productReview?.name ||
          metadata.product?.name ||
          review.product_sku ||
          'FiltersFast';

        return {
          id: review.review_id,
          productSku: review.product_sku || '',
          productName,
          customerName: review.consumer_name || 'Anonymous',
          customerLocation: review.consumer_location || undefined,
          rating: review.rating,
          title: review.title || undefined,
          text: review.text || '',
          date: review.reviewed_at,
          isVerified: Boolean(review.is_verified),
          hasReply: Boolean(review.has_reply),
          reply: review.reply_text
            ? {
                text: review.reply_text,
                date: review.reply_posted_at || review.reviewed_at,
              }
            : undefined,
          source: review.source === 'imported' ? 'imported' : 'trustpilot',
        };
      });

      setReviews(mapped);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncReviews = async () => {
    try {
      setSyncingReviews(true);
      setSyncError(null);
      setSyncMessage(null);

      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ run: 'inline', includeImported: true }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to synchronize reviews');
      }

      const processed = data.result?.processed ?? 0;
      setSyncMessage(`Synced ${processed} review${processed === 1 ? '' : 's'}.`);

      await fetchStats();
      await fetchReviews();
    } catch (error) {
      console.error('Error syncing reviews:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to sync reviews');
    } finally {
      setSyncingReviews(false);
    }
  };

  if (isPending || (loading && reviews.length === 0)) {
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
              {syncMessage && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="status">
                  {syncMessage}
                </p>
              )}
              {syncError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {syncError}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSyncReviews}
                variant="outline"
                className="inline-flex items-center gap-2"
                disabled={syncingReviews}
              >
                {syncingReviews ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                    Sync Latest Reviews
                  </>
                )}
              </Button>
              <Button
                onClick={openInvitationModal}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                Send Review Invitation
              </Button>
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

        {/* Analytics Section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Response Rate */}
            <Card className="p-6" role="region" aria-label="Response rate analytics">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Response Rate
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.responseRate ? `${stats.responseRate}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Reviews with company replies
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.responseRate || 0}%` }}
                      role="progressbar"
                      aria-valuenow={stats.responseRate || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Response rate: ${stats.responseRate || 0}%`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">
                    {stats.responseRate || 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Average Response Time */}
            <Card className="p-6" role="region" aria-label="Average response time analytics">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg. Response Time
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.avgResponseTime ? `${stats.avgResponseTime}h` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hours to reply
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs">
                  <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    12% faster
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                </div>
              </div>
            </Card>

            {/* Sentiment Trends */}
            <Card className="p-6" role="region" aria-label="Sentiment distribution analytics">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Sentiment Distribution
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent 7 Days
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Positive (4-5★)</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {stats.sentimentTrend?.positive || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Meh className="w-4 h-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Neutral (3★)</span>
                  </div>
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {stats.sentimentTrend?.neutral || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Frown className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Negative (1-2★)</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {stats.sentimentTrend?.negative || 0}%
                  </span>
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
                      onClick={() => openReplyModal(review)}
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

        {/* Reply Modal */}
        {replyModalOpen && selectedReview && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={closeReplyModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reply-modal-title"
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 id="reply-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedReview.hasReply ? 'View/Edit Reply' : 'Reply to Review'}
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium">{selectedReview.customerName} - {selectedReview.productName}</p>
                      <StarRating rating={selectedReview.rating} size="sm" className="mt-1" />
                    </div>
                  </div>
                  <button
                    onClick={closeReplyModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Review Content */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {selectedReview.title && (
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedReview.title}
                    </h3>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedReview.text}
                  </p>
                </div>

                {/* Reply Textarea */}
                <div className="mb-4">
                  <label htmlFor="reply-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    ref={replyTextareaRef}
                    id="reply-text"
                    value={replyText}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text.length <= 2048) {
                        setReplyText(text);
                        setReplyError('');
                      }
                    }}
                    rows={6}
                    maxLength={2048}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Write your reply here..."
                    aria-describedby={replyError ? 'reply-error' : undefined}
                    aria-required="true"
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {replyText.length} / 2048 characters
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Minimum: 10 characters
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {replyError && (
                  <div 
                    id="reply-error"
                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    role="alert"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{replyError}</p>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={closeReplyModal}
                    disabled={replyLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitReply}
                    disabled={replyLoading || replyText.trim().length < 10}
                    className="inline-flex items-center gap-2"
                    aria-busy={replyLoading}
                  >
                    {replyLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        Post Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {invitationModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={closeInvitationModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invitation-modal-title"
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 id="invitation-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Send Review Invitation
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Invite a customer to leave a review
                    </p>
                  </div>
                  <button
                    onClick={closeInvitationModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Success Message */}
                {inviteSuccess && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" role="alert">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Invitation sent successfully!
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                {!inviteSuccess && (
                  <div className="space-y-4 mb-6">
                    {/* Customer Email */}
                    <div>
                      <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={inviteEmailRef}
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setInviteError('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="customer@example.com"
                        required
                        aria-required="true"
                      />
                    </div>

                    {/* Customer Name */}
                    <div>
                      <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="invite-name"
                        type="text"
                        value={inviteName}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) {
                            setInviteName(e.target.value);
                            setInviteError('');
                          }
                        }}
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {/* Order Reference */}
                    <div>
                      <label htmlFor="invite-order-ref" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Order Reference <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="invite-order-ref"
                        type="text"
                        value={inviteOrderRef}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) {
                            setInviteOrderRef(e.target.value);
                            setInviteError('');
                          }
                        }}
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="ORDER-12345"
                        required
                      />
                    </div>

                    {/* Product SKU (Optional) */}
                    <div>
                      <label htmlFor="invite-product-sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product SKU (Optional)
                      </label>
                      <input
                        id="invite-product-sku"
                        type="text"
                        value={inviteProductSku}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 50 && /^[a-zA-Z0-9\-_]*$/.test(value)) {
                            setInviteProductSku(value);
                            setInviteError('');
                          }
                        }}
                        maxLength={50}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="MWF (leave blank for service review)"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        For product-specific reviews. Leave blank for general service reviews.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                    <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
                  </div>
                )}

                {/* Modal Actions */}
                {!inviteSuccess && (
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={closeInvitationModal}
                      disabled={inviteLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitInvitation}
                      disabled={inviteLoading || !inviteEmail || !inviteName || !inviteOrderRef}
                      className="inline-flex items-center gap-2"
                      aria-busy={inviteLoading}
                    >
                      {inviteLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" aria-hidden="true" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

