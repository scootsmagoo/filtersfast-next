/**
 * Open Graph Meta Tags Utility
 * 
 * Helper functions for generating Open Graph tags for social media sharing
 */

import { Metadata } from 'next';

export interface OGTagsOptions {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

/**
 * Generate Open Graph metadata for Next.js pages
 */
export function generateOGMetadata(options: OGTagsOptions): Metadata {
  const {
    title,
    description,
    url = 'https://www.filtersfast.com',
    image = 'https://www.filtersfast.com/og-image.jpg',
    type = 'website',
    siteName = 'FiltersFast',
    locale = 'en_US'
  } = options;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale,
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@FiltersFast'
    },
    alternates: {
      canonical: url
    }
  };
}

/**
 * Generate OG tags for product pages
 */
export function generateProductOGMetadata(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  brand?: string;
  sku?: string;
}): Metadata {
  const title = `${product.name} - ${product.brand || 'FiltersFast'}`;
  const description = product.description;
  const image = product.image || 'https://www.filtersfast.com/og-image.jpg';
  
  return {
    ...generateOGMetadata({
      title,
      description,
      image,
      type: 'product'
    }),
    openGraph: {
      title,
      description,
      siteName: 'FiltersFast',
      locale: 'en_US',
      type: 'website', // OpenGraph doesn't have 'product' type in Metadata API
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name
        }
      ]
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'USD',
      'product:brand': product.brand || '',
      'product:retailer_item_id': product.sku || ''
    }
  };
}

/**
 * Generate OG tags for referral sharing
 */
export function generateReferralOGMetadata(referralCode: string): Metadata {
  return generateOGMetadata({
    title: 'Get 10% Off at FiltersFast!',
    description: `Use referral code ${referralCode} to save 10% on your first order. Shop air filters, water filters, and more!`,
    image: 'https://www.filtersfast.com/og-referral.jpg',
    url: `https://www.filtersfast.com?ref=${referralCode}`
  });
}

/**
 * Default Open Graph tags for the site
 */
export const defaultOGMetadata = generateOGMetadata({
  title: "FiltersFast - America's Top Online Filtration Retailer",
  description: 'Huge Selection. Unbeatable Quality. 365-Day Returns. Shop refrigerator water filters, air filters, pool filters, and more from trusted brands.',
  image: 'https://www.filtersfast.com/og-image.jpg',
  url: 'https://www.filtersfast.com'
});

