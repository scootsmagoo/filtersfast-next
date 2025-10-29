/**
 * Trustpilot Review System Types
 * 
 * Based on Trustpilot API v1 structure
 * https://documentation-apidocumentation.trustpilot.com/
 */

export interface TrustpilotConsumer {
  id: string;
  displayName: string;
  name?: string;
}

export interface TrustpilotCompanyReply {
  message: string;
  createdAt: string;
}

export interface TrustpilotReview {
  id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  title?: string;
  text: string;
  createdAt: string;
  consumer: TrustpilotConsumer;
  companyReply?: TrustpilotCompanyReply;
  // API returns these with different field names sometimes
  content?: string;
  businessResponseText?: string;
  businessResponseDate?: string;
}

export interface TrustpilotReviewsResponse {
  reviews: TrustpilotReview[];
  links: Array<{
    href: string;
    method: string;
    rel: string;
  }>;
}

export interface TrustpilotProductSummary {
  numberOfReviews: {
    total: number;
    oneStar: number;
    twoStars: number;
    threeStars: number;
    fourStars: number;
    fiveStars: number;
  };
  starsAverage: number;
  sku: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProductReview {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  customerName: string;
  isVerified: boolean;
  companyResponse?: {
    message: string;
    date: string;
  };
}

export interface ProductReviewsData {
  reviews: ProductReview[];
  summary: ReviewSummary;
  hasMore: boolean;
}

