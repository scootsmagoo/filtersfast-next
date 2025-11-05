/**
 * Schema.org Structured Data for Reviews
 * Helps Google display rich snippets with star ratings
 */

import { TrustPilotReview } from './client';

interface ProductSchemaProps {
  productName: string;
  productSku: string;
  productUrl: string;
  productImage?: string;
  productDescription?: string;
  price?: number;
  currency?: string;
  reviews: TrustPilotReview[];
  totalReviews: number;
  averageRating: number;
}

/**
 * Generate Product schema with AggregateRating and Review
 * https://schema.org/Product
 */
export function generateProductReviewSchema({
  productName,
  productSku,
  productUrl,
  productImage,
  productDescription,
  price,
  currency = 'USD',
  reviews,
  totalReviews,
  averageRating,
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    sku: productSku,
    url: productUrl,
    ...(productImage && { image: productImage }),
    ...(productDescription && { description: productDescription }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        url: productUrl,
      },
    }),
    // Aggregate Rating
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: totalReviews,
      bestRating: '5',
      worstRating: '1',
    },
    // Individual Reviews (limited to first 10 for schema)
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.stars.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Person',
        name: review.consumer.displayName,
      },
      datePublished: review.createdAt,
      ...(review.title && { headline: review.title }),
      ...(review.text && { reviewBody: review.text }),
      ...(review.isVerified && { 
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          name: review.consumer.displayName,
        },
        'reviewRating': {
          '@type': 'Rating',
          ratingValue: review.stars.toString(),
          bestRating: '5',
          worstRating: '1',
        },
        'itemReviewed': {
          '@type': 'Product',
          name: productName,
        },
        'datePublished': review.createdAt,
        ...(review.title && { headline: review.title }),
        ...(review.text && { reviewBody: review.text }),
        'publisher': {
          '@type': 'Organization',
          name: 'FiltersFast',
        },
        'verifiedBuyer': true,
      }),
    })),
  };

  return schema;
}

/**
 * Generate AggregateRating schema (standalone)
 * Useful for homepage or category pages
 */
export function generateAggregateRatingSchema(
  totalReviews: number,
  averageRating: number,
  itemName: string = 'FiltersFast'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Organization',
      name: itemName,
      url: 'https://www.filtersfast.com',
    },
    ratingValue: averageRating.toFixed(1),
    reviewCount: totalReviews,
    bestRating: '5',
    worstRating: '1',
  };
}

/**
 * Generate LocalBusiness schema with review data
 * For homepage or about page
 */
export function generateLocalBusinessSchema(
  totalReviews: number,
  averageRating: number,
  trustScore: number
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'FiltersFast',
    url: 'https://www.filtersfast.com',
    logo: 'https://www.filtersfast.com/images/logo.png',
    image: 'https://www.filtersfast.com/images/og-image.jpg',
    description: 'Premium air filters, water filters, and HVAC filters delivered fast. Subscribe & Save on filter replacements.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: totalReviews,
      bestRating: '5',
      worstRating: '1',
    },
    priceRange: '$',
    telephone: '1-866-438-3936',
    email: 'customerservice@filtersfast.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.facebook.com/filtersfast',
      'https://twitter.com/filtersfast',
      'https://www.instagram.com/filtersfast',
      'https://www.trustpilot.com/review/www.filtersfast.com',
    ],
  };
}

/**
 * Generate schema as JSON-LD string for embedding
 * Use this in your component: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateSchemaScript(schema) }} />
 */
export function generateSchemaScript(schema: object): string {
  return JSON.stringify(schema);
}

