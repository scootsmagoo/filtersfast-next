/**
 * TrustPilot API Client
 * Official TrustPilot API v1 Integration
 * 
 * Business Unit ID: 47783f490000640005020cf6
 * API Documentation: https://documentation-apidocumentation.trustpilot.com/
 */

const TRUSTPILOT_API_BASE = 'https://api.trustpilot.com/v1';
const BUSINESS_UNIT_ID = '47783f490000640005020cf6';

// TrustPilot API Key should be stored in environment variables
const API_KEY = process.env.TRUSTPILOT_API_KEY || '';

export interface TrustPilotReview {
  id: string;
  consumer: {
    displayName: string;
    displayLocation?: string;
  };
  stars: 1 | 2 | 3 | 4 | 5;
  title?: string;
  text?: string;
  createdAt: string;
  isVerified?: boolean;
  companyReply?: {
    text: string;
    createdAt: string;
  };
}

export interface TrustPilotReviewsResponse {
  reviews: TrustPilotReview[];
  links: Array<{
    href: string;
    method: string;
    rel: string;
  }>;
}

export interface TrustPilotProductSummary {
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

export interface TrustPilotBusinessSummary {
  numberOfReviews: {
    total: number;
    oneStar: number;
    twoStars: number;
    threeStars: number;
    fourStars: number;
    fiveStars: number;
  };
  stars: number;
  trustScore: number;
}

/**
 * Fetch product reviews by SKU
 * @param sku Product SKU
 * @param page Page number (default: 1)
 * @param perPage Items per page (default: 20, max: 100)
 */
export async function getProductReviews(
  sku: string,
  page: number = 1,
  perPage: number = 20
): Promise<TrustPilotReviewsResponse> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/product-reviews/business-units/${BUSINESS_UNIT_ID}/reviews?apikey=${API_KEY}&sku=${encodeURIComponent(sku)}&page=${page}&perPage=${perPage}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotReviewsResponse;
  } catch (error) {
    console.error('Error fetching TrustPilot product reviews:', error);
    return { reviews: [], links: [] };
  }
}

/**
 * Fetch imported product reviews by SKU
 * These are reviews that were originally collected by FiltersFast and imported to TrustPilot
 */
export async function getImportedProductReviews(
  sku: string,
  page: number = 1,
  perPage: number = 20
): Promise<TrustPilotReviewsResponse> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/product-reviews/business-units/${BUSINESS_UNIT_ID}/imported-reviews?apikey=${API_KEY}&sku=${encodeURIComponent(sku)}&page=${page}&perPage=${perPage}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotReviewsResponse;
  } catch (error) {
    console.error('Error fetching TrustPilot imported reviews:', error);
    return { reviews: [], links: [] };
  }
}

/**
 * Fetch product review summary (star distribution, average)
 */
export async function getProductReviewSummary(
  sku: string
): Promise<TrustPilotProductSummary | null> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/product-reviews/business-units/${BUSINESS_UNIT_ID}?apikey=${API_KEY}&sku=${encodeURIComponent(sku)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotProductSummary;
  } catch (error) {
    console.error('Error fetching TrustPilot product summary:', error);
    return null;
  }
}

/**
 * Fetch imported product review summary
 */
export async function getImportedProductReviewSummary(
  sku: string
): Promise<TrustPilotProductSummary | null> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/product-reviews/business-units/${BUSINESS_UNIT_ID}/imported-reviews-summaries?apikey=${API_KEY}&sku=${encodeURIComponent(sku)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotProductSummary;
  } catch (error) {
    console.error('Error fetching TrustPilot imported summary:', error);
    return null;
  }
}

/**
 * Fetch business unit reviews (overall company reviews)
 */
export async function getBusinessReviews(
  page: number = 1,
  perPage: number = 20
): Promise<TrustPilotReviewsResponse> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/business-units/${BUSINESS_UNIT_ID}/reviews?apikey=${API_KEY}&page=${page}&perPage=${perPage}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotReviewsResponse;
  } catch (error) {
    console.error('Error fetching TrustPilot business reviews:', error);
    return { reviews: [], links: [] };
  }
}

/**
 * Fetch business unit summary (overall company rating)
 */
export async function getBusinessSummary(): Promise<TrustPilotBusinessSummary | null> {
  try {
    const url = `${TRUSTPILOT_API_BASE}/business-units/${BUSINESS_UNIT_ID}?apikey=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`TrustPilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TrustPilotBusinessSummary;
  } catch (error) {
    console.error('Error fetching TrustPilot business summary:', error);
    return null;
  }
}

/**
 * Combine product reviews and imported reviews into a single array
 */
export async function getAllProductReviews(
  sku: string,
  maxReviews: number = 20
): Promise<TrustPilotReview[]> {
  try {
    // Fetch both regular and imported reviews
    const [regular, imported] = await Promise.all([
      getProductReviews(sku, 1, Math.ceil(maxReviews / 2)),
      getImportedProductReviews(sku, 1, Math.ceil(maxReviews / 2)),
    ]);

    // Combine and sort by date (newest first)
    const allReviews = [...regular.reviews, ...imported.reviews];
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return limited number
    return allReviews.slice(0, maxReviews);
  } catch (error) {
    console.error('Error fetching all product reviews:', error);
    return [];
  }
}

/**
 * Get combined product review summary (regular + imported)
 */
export async function getCombinedProductSummary(sku: string): Promise<{
  totalReviews: number;
  averageRating: number;
  starDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}> {
  try {
    const [regular, imported] = await Promise.all([
      getProductReviewSummary(sku),
      getImportedProductReviewSummary(sku),
    ]);

    const totalReviews = 
      (regular?.numberOfReviews.total || 0) + 
      (imported?.numberOfReviews.total || 0);

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calculate weighted average
    const regularWeight = regular?.numberOfReviews.total || 0;
    const importedWeight = imported?.numberOfReviews.total || 0;
    
    const averageRating = 
      ((regular?.starsAverage || 0) * regularWeight + 
       (imported?.starsAverage || 0) * importedWeight) / 
      totalReviews;

    // Combine star distributions
    const starDistribution = {
      1: (regular?.numberOfReviews.oneStar || 0) + (imported?.numberOfReviews.oneStar || 0),
      2: (regular?.numberOfReviews.twoStars || 0) + (imported?.numberOfReviews.twoStars || 0),
      3: (regular?.numberOfReviews.threeStars || 0) + (imported?.numberOfReviews.threeStars || 0),
      4: (regular?.numberOfReviews.fourStars || 0) + (imported?.numberOfReviews.fourStars || 0),
      5: (regular?.numberOfReviews.fiveStars || 0) + (imported?.numberOfReviews.fiveStars || 0),
    };

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      starDistribution,
    };
  } catch (error) {
    console.error('Error fetching combined product summary:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * Post a reply to a review
 * @param reviewId The TrustPilot review ID
 * @param replyText The reply text (max 2048 characters)
 * @returns Success status and the reply data
 */
export async function postReviewReply(
  reviewId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; reply?: { text: string; createdAt: string } }> {
  try {
    // Validate input
    if (!reviewId || reviewId.trim().length === 0) {
      return { success: false, error: 'Review ID is required' };
    }
    
    if (!replyText || replyText.trim().length === 0) {
      return { success: false, error: 'Reply text is required' };
    }
    
    if (replyText.length > 2048) {
      return { success: false, error: 'Reply text must be 2048 characters or less' };
    }
    
    if (!API_KEY) {
      return { success: false, error: 'TrustPilot API key not configured' };
    }

    // TrustPilot API endpoint for posting replies
    // Note: This requires a Business API key with write permissions
    const url = `${TRUSTPILOT_API_BASE}/business-units/${BUSINESS_UNIT_ID}/reviews/${reviewId}/reply`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        message: replyText.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TrustPilot API error:', response.status, errorData);
      
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized - Invalid API key' };
      } else if (response.status === 404) {
        return { success: false, error: 'Review not found' };
      } else if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded' };
      } else {
        return { success: false, error: `API error: ${response.status}` };
      }
    }

    const data = await response.json();
    
    return {
      success: true,
      reply: {
        text: replyText.trim(),
        createdAt: data.createdAt || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error posting review reply:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post reply',
    };
  }
}

/**
 * Send a review invitation to a customer
 * @param customerEmail Customer's email address
 * @param customerName Customer's name
 * @param orderReference Order/reference ID
 * @param productSku Optional product SKU for product-specific review
 * @returns Success status
 */
export async function sendReviewInvitation(
  customerEmail: string,
  customerName: string,
  orderReference: string,
  productSku?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (!customerName || customerName.trim().length === 0) {
      return { success: false, error: 'Customer name is required' };
    }
    
    if (!orderReference || orderReference.trim().length === 0) {
      return { success: false, error: 'Order reference is required' };
    }
    
    if (!API_KEY) {
      return { success: false, error: 'TrustPilot API key not configured' };
    }

    // TrustPilot invitation endpoint
    const url = `${TRUSTPILOT_API_BASE}/business-units/${BUSINESS_UNIT_ID}/email-invitations`;
    
    const payload: any = {
      referenceId: orderReference,
      email: customerEmail.toLowerCase().trim(),
      name: customerName.trim(),
      locale: 'en-US',
      tags: ['automatic-invitation'],
    };
    
    // If product SKU provided, make it a product review invitation
    if (productSku) {
      payload.productUrl = `https://www.filtersfast.com/products/${productSku}`;
      payload.sku = productSku;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TrustPilot invitation API error:', response.status, errorData);
      
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized - Invalid API key' };
      } else if (response.status === 409) {
        return { success: false, error: 'Invitation already sent for this order' };
      } else if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded' };
      } else {
        return { success: false, error: `API error: ${response.status}` };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending review invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
}
