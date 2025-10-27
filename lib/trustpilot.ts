/**
 * Trustpilot API Client
 * 
 * Handles all communication with Trustpilot API
 */

import { trustpilotConfig, isTrustpilotConfigured } from './trustpilot-config';
import type {
  TrustpilotReview,
  TrustpilotReviewsResponse,
  TrustpilotProductSummary,
  ProductReview,
  ProductReviewsData,
  ReviewSummary,
} from './types/reviews';

/**
 * Fetch product reviews from Trustpilot
 */
export async function fetchProductReviews(
  productSku: string,
  page: number = 1
): Promise<ProductReviewsData | null> {
  if (!isTrustpilotConfigured()) {
    console.warn('Trustpilot is not configured. Returning null.');
    return null;
  }

  try {
    // Fetch both regular reviews and imported reviews
    const [regularReviews, importedReviews, summary] = await Promise.all([
      fetchReviewsFromEndpoint(
        `${trustpilotConfig.baseUrl}/product-reviews/business-units/${trustpilotConfig.businessUnitId}/reviews`,
        productSku,
        page
      ),
      fetchReviewsFromEndpoint(
        `${trustpilotConfig.baseUrl}/product-reviews/business-units/${trustpilotConfig.businessUnitId}/imported-reviews`,
        productSku,
        page
      ),
      fetchProductSummary(productSku),
    ]);

    // Combine reviews
    const allReviews = [...regularReviews, ...importedReviews];

    // Transform to our format
    const transformedReviews = allReviews.map(transformReview);

    return {
      reviews: transformedReviews.slice(0, trustpilotConfig.maxReviewsPerPage),
      summary: summary || createEmptySummary(),
      hasMore: allReviews.length > trustpilotConfig.maxReviewsPerPage,
    };
  } catch (error) {
    console.error('Error fetching Trustpilot reviews:', error);
    return null;
  }
}

/**
 * Fetch reviews from a specific Trustpilot endpoint
 */
async function fetchReviewsFromEndpoint(
  endpoint: string,
  sku: string,
  page: number
): Promise<TrustpilotReview[]> {
  const url = `${endpoint}?apikey=${trustpilotConfig.apiKey}&sku=${encodeURIComponent(sku)}&page=${page}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    next: { revalidate: trustpilotConfig.cacheTTL }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Trustpilot API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Handle different response formats
  return data.productReviews || data.reviews || [];
}

/**
 * Fetch product review summary
 */
async function fetchProductSummary(sku: string): Promise<ReviewSummary | null> {
  try {
    const url = `${trustpilotConfig.baseUrl}/product-reviews/business-units/${trustpilotConfig.businessUnitId}?apikey=${trustpilotConfig.apiKey}&sku=${encodeURIComponent(sku)}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      next: { revalidate: trustpilotConfig.cacheTTL },
    });

    if (!response.ok) {
      return null;
    }

    const data: TrustpilotProductSummary = await response.json();

    return {
      averageRating: data.starsAverage || 0,
      totalReviews: data.numberOfReviews?.total || 0,
      distribution: {
        1: data.numberOfReviews?.oneStar || 0,
        2: data.numberOfReviews?.twoStars || 0,
        3: data.numberOfReviews?.threeStars || 0,
        4: data.numberOfReviews?.fourStars || 0,
        5: data.numberOfReviews?.fiveStars || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching product summary:', error);
    return null;
  }
}

/**
 * Transform Trustpilot review to our format
 */
function transformReview(review: TrustpilotReview): ProductReview {
  const customerName =
    review.consumer?.name ||
    review.consumer?.displayName ||
    'Anonymous';

  const companyResponse = review.companyReply || (
    review.businessResponseText
      ? {
          message: review.businessResponseText,
          date: review.businessResponseDate || '',
        }
      : undefined
  );

  return {
    id: review.id,
    rating: review.stars,
    title: review.title,
    comment: review.text || review.content || '',
    date: review.createdAt,
    customerName,
    isVerified: true, // Trustpilot reviews are verified
    companyResponse: companyResponse
      ? {
          message: companyResponse.message,
          date: companyResponse.createdAt || companyResponse.date || '',
        }
      : undefined,
  };
}

/**
 * Create empty summary for products with no reviews
 */
function createEmptySummary(): ReviewSummary {
  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
}

/**
 * Calculate rounded rating (for star display)
 */
export function getRoundedRating(averageRating: number): number {
  if (averageRating === 0) return 0;
  if (averageRating < 1.5) return 1;
  if (averageRating < 2.5) return 2;
  if (averageRating < 3.5) return 3;
  if (averageRating < 4.5) return 4;
  return 5;
}

/**
 * Format review date for display
 */
export function formatReviewDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

