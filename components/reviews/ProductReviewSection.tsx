/**
 * Product Review Section
 * Complete review section for product pages
 * Combines summary, list, and schema
 */

import { getAllProductReviews, getCombinedProductSummary } from '@/lib/trustpilot/client';
import ReviewSummary from './ReviewSummary';
import ReviewList from './ReviewList';
import { generateProductReviewSchema, generateSchemaScript } from '@/lib/trustpilot/schema';

interface ProductReviewSectionProps {
  productSku: string;
  productName: string;
  productUrl: string;
  productImage?: string;
  productDescription?: string;
  price?: number;
  currency?: string;
  initialReviewCount?: number;
}

export default async function ProductReviewSection({
  productSku,
  productName,
  productUrl,
  productImage,
  productDescription,
  price,
  currency = 'USD',
  initialReviewCount = 20,
}: ProductReviewSectionProps) {
  // Fetch reviews and summary server-side
  const [reviews, summary] = await Promise.all([
    getAllProductReviews(productSku, initialReviewCount),
    getCombinedProductSummary(productSku),
  ]);

  // Generate schema for SEO
  const schema = generateProductReviewSchema({
    productName,
    productSku,
    productUrl,
    productImage,
    productDescription,
    price,
    currency,
    reviews,
    totalReviews: summary.totalReviews,
    averageRating: summary.averageRating,
  });

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateSchemaScript(schema) }}
      />

      {/* Review Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Review Summary */}
        <ReviewSummary
          totalReviews={summary.totalReviews}
          averageRating={summary.averageRating}
          starDistribution={summary.starDistribution}
          productName={productName}
          className="mb-12"
        />

        {/* Review List */}
        <div className="mt-8">
          <ReviewList
            initialReviews={reviews}
            productSku={productSku}
            productName={productName}
            totalReviews={summary.totalReviews}
          />
        </div>
      </div>
    </>
  );
}

