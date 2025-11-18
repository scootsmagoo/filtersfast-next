/**
 * Product Recommendations Engine
 * Generates product recommendations using multiple algorithms
 */

import {
  getFrequentlyBoughtTogether,
  getRecommendations,
  saveRecommendation,
  clearRecommendations,
  getRecentProductViews,
  getUserProductHistory,
  type RecommendationType,
} from './db/product-recommendations';
import { getProductById, listProducts, type ProductFilters } from './db/products';
import type { Product } from './types/product';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
}

export interface RecommendationOptions {
  limit?: number;
  excludeProductIds?: string[];
  minScore?: number;
}

// ============================================================================
// FREQUENTLY BOUGHT TOGETHER ALGORITHM
// ============================================================================

/**
 * Generate "Frequently Bought Together" recommendations
 */
export function generateFrequentlyBoughtTogether(
  idProduct: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  const excludeIds = new Set(options.excludeProductIds || []);
  excludeIds.add(idProduct);
  
  const coPurchases = getFrequentlyBoughtTogether(idProduct, limit * 2);
  
  const results: RecommendationResult[] = [];
  
  for (const coPurchase of coPurchases) {
    const recommendedId = coPurchase.idProduct1 === idProduct
      ? coPurchase.idProduct2
      : coPurchase.idProduct1;
    
    if (excludeIds.has(recommendedId)) continue;
    
    // Score based on co-purchase count and confidence
    const score = (coPurchase.coPurchaseCount / 100) * (coPurchase.confidenceScore / 100) * 100;
    
    if (options.minScore && score < options.minScore) continue;
    
    results.push({
      productId: recommendedId,
      score,
      reason: `Frequently bought together (${coPurchase.coPurchaseCount} times)`,
    });
    
    if (results.length >= limit) break;
  }
  
  return results;
}

// ============================================================================
// SIMILAR PRODUCTS ALGORITHM
// ============================================================================

/**
 * Generate "Similar Products" recommendations based on attributes
 */
export function generateSimilarProducts(
  idProduct: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  const excludeIds = new Set(options.excludeProductIds || []);
  excludeIds.add(idProduct);
  
  const product = getProductById(idProduct);
  if (!product) return [];
  
  // Build filters for similar products
  const filters: ProductFilters = {
    status: 'active',
    limit: limit * 3, // Get more to filter
  };
  
  // Match by type first
  if (product.type) {
    filters.type = product.type;
  }
  
  // Match by brand (weighted lower if private label)
  const isPrivateLabel = product.brand?.toLowerCase().includes('filtersfast') ||
                        product.brand?.toLowerCase().includes('filters fast');
  
  const searchResults = listProducts(filters);
  
  const scored: Array<RecommendationResult & { product: Product }> = [];
  
  for (const candidate of searchResults.products) {
    if (excludeIds.has(candidate.id)) continue;
    
    let score = 0;
    const reasons: string[] = [];
    
    // Same type (high weight)
    if (candidate.type === product.type) {
      score += 40;
      reasons.push('same type');
    }
    
    // Same brand (medium weight, lower for private label)
    if (candidate.brand === product.brand) {
      score += isPrivateLabel ? 15 : 25;
      reasons.push('same brand');
    }
    
    // Similar price range (within 30%)
    const priceDiff = Math.abs(candidate.price - product.price) / product.price;
    if (priceDiff <= 0.3) {
      score += 15;
      reasons.push('similar price');
    }
    
    // Similar rating (within 0.5 stars)
    if (candidate.rating && product.rating) {
      const ratingDiff = Math.abs(candidate.rating - product.rating);
      if (ratingDiff <= 0.5) {
        score += 10;
        reasons.push('similar rating');
      }
    }
    
    // Same category
    const productCategories = new Set(product.categoryIds || []);
    const candidateCategories = new Set(candidate.categoryIds || []);
    const commonCategories = [...productCategories].filter(c => candidateCategories.has(c));
    if (commonCategories.length > 0) {
      score += 10;
      reasons.push('same category');
    }
    
    // Similar specifications (if available)
    if (product.specifications && candidate.specifications) {
      const productSpecs = Object.keys(product.specifications);
      const candidateSpecs = Object.keys(candidate.specifications);
      const commonSpecs = productSpecs.filter(s => candidateSpecs.includes(s));
      if (commonSpecs.length > 0) {
        score += 5;
        reasons.push('similar specs');
      }
    }
    
    if (score > 0) {
      scored.push({
        productId: candidate.id,
        score,
        reason: reasons.join(', '),
        product: candidate,
      });
    }
  }
  
  // Sort by score and return top results
  scored.sort((a, b) => b.score - a.score);
  
  return scored
    .filter(r => !options.minScore || r.score >= options.minScore)
    .slice(0, limit)
    .map(({ product, ...rest }) => rest);
}

// ============================================================================
// TRENDING PRODUCTS ALGORITHM
// ============================================================================

/**
 * Generate "Trending Products" recommendations (popular recently)
 */
export function generateTrendingProducts(
  idProduct: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  const excludeIds = new Set(options.excludeProductIds || []);
  excludeIds.add(idProduct);
  
  // Get products with high view counts and recent activity
  const filters: ProductFilters = {
    status: 'active',
    sortBy: 'popularity',
    sortOrder: 'desc',
    limit: limit * 2,
  };
  
  const searchResults = listProducts(filters);
  
  const results: RecommendationResult[] = [];
  
  for (const product of searchResults.products) {
    if (excludeIds.has(product.id)) continue;
    
    // Score based on popularity metrics
    let score = 0;
    const reasons: string[] = [];
    
    // High review count
    if (product.reviewCount && product.reviewCount > 100) {
      score += 30;
      reasons.push('highly reviewed');
    }
    
    // High rating
    if (product.rating && product.rating >= 4.5) {
      score += 25;
      reasons.push('top rated');
    }
    
    // Best seller badge
    if (product.isBestSeller) {
      score += 20;
      reasons.push('bestseller');
    }
    
    // Featured product
    if (product.isFeatured) {
      score += 15;
      reasons.push('featured');
    }
    
    // Recent orders (if available)
    if (product.orderCount && product.orderCount > 50) {
      score += 10;
      reasons.push('popular');
    }
    
    if (score > 0) {
      results.push({
        productId: product.id,
        score,
        reason: reasons.join(', '),
      });
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}

// ============================================================================
// CROSS-SELL ALGORITHM
// ============================================================================

/**
 * Generate "Cross-Sell" recommendations (complementary products)
 */
export function generateCrossSellProducts(
  idProduct: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  const excludeIds = new Set(options.excludeProductIds || []);
  excludeIds.add(idProduct);
  
  const product = getProductById(idProduct);
  if (!product) return [];
  
  const results: RecommendationResult[] = [];
  
  // Define cross-sell mappings by product type
  const crossSellMap: Record<string, string[]> = {
    'air-filter': ['accessory'], // Air filter accessories, tools
    'water-filter': ['water-filter', 'accessory'], // Other water filters, installation kits
    'refrigerator-filter': ['refrigerator-filter', 'accessory'], // Other fridge filters
    'pool-filter': ['pool-filter', 'accessory'], // Other pool filters, chemicals
    'humidifier-filter': ['humidifier-filter'], // Other humidifier filters
  };
  
  const targetTypes = crossSellMap[product.type] || [];
  
  if (targetTypes.length === 0) return results;
  
  // Get products from complementary categories
  const filters: ProductFilters = {
    status: 'active',
    limit: limit * 2,
  };
  
  // Try each target type
  for (const targetType of targetTypes) {
    filters.type = targetType as any;
    const searchResults = listProducts(filters);
    
    for (const candidate of searchResults.products) {
      if (excludeIds.has(candidate.id)) continue;
      
      let score = 0;
      const reasons: string[] = [];
      
      // Complementary type
      if (targetTypes.includes(candidate.type)) {
        score += 40;
        reasons.push('complementary product');
      }
      
      // Same brand (if applicable)
      if (candidate.brand === product.brand) {
        score += 20;
        reasons.push('same brand');
      }
      
      // Good rating
      if (candidate.rating && candidate.rating >= 4.0) {
        score += 20;
        reasons.push('well rated');
      }
      
      // In stock
      if (candidate.inventoryQuantity > 0 || !candidate.trackInventory) {
        score += 20;
        reasons.push('in stock');
      }
      
      if (score > 0) {
        results.push({
          productId: candidate.id,
          score,
          reason: reasons.join(', '),
        });
      }
      
      if (results.length >= limit) break;
    }
    
    if (results.length >= limit) break;
  }
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, limit);
}

// ============================================================================
// UPSELL ALGORITHM
// ============================================================================

/**
 * Generate "Upsell" recommendations (higher-priced alternatives)
 */
export function generateUpsellProducts(
  idProduct: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 5; // Fewer upsells
  const excludeIds = new Set(options.excludeProductIds || []);
  excludeIds.add(idProduct);
  
  const product = getProductById(idProduct);
  if (!product) return [];
  
  // Get products of same type but higher price
  const filters: ProductFilters = {
    status: 'active',
    type: product.type,
    minPrice: product.price * 1.1, // At least 10% more expensive
    sortBy: 'price',
    sortOrder: 'asc', // Cheapest upsells first
    limit: limit * 2,
  };
  
  const searchResults = listProducts(filters);
  
  const results: RecommendationResult[] = [];
  
  for (const candidate of searchResults.products) {
    if (excludeIds.has(candidate.id)) continue;
    
    let score = 0;
    const reasons: string[] = [];
    
    // Price premium (not too high - sweet spot is 20-50% more)
    const priceDiff = (candidate.price - product.price) / product.price;
    if (priceDiff >= 0.2 && priceDiff <= 0.5) {
      score += 40;
      reasons.push('premium option');
    } else if (priceDiff > 0.5 && priceDiff <= 1.0) {
      score += 20;
      reasons.push('higher tier');
    } else {
      continue; // Skip if too expensive
    }
    
    // Better rating
    if (candidate.rating && product.rating && candidate.rating > product.rating) {
      score += 30;
      reasons.push('better rated');
    }
    
    // More features/better specs
    if (candidate.features && candidate.features.length > (product.features?.length || 0)) {
      score += 20;
      reasons.push('more features');
    }
    
    // Same brand (trust)
    if (candidate.brand === product.brand) {
      score += 10;
      reasons.push('same brand');
    }
    
    if (score > 0) {
      results.push({
        productId: candidate.id,
        score,
        reason: reasons.join(', '),
      });
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}

// ============================================================================
// RECENTLY VIEWED ALGORITHM
// ============================================================================

/**
 * Generate "Recently Viewed" recommendations
 */
export function generateRecentlyViewed(
  userId: string | null,
  sessionId: string | null,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  
  if (!userId && !sessionId) return [];
  
  const recentViews = getRecentProductViews(userId, sessionId, limit * 2);
  const excludeIds = new Set(options.excludeProductIds || []);
  
  const results: RecommendationResult[] = [];
  
  for (const view of recentViews) {
    if (excludeIds.has(view.idProduct)) continue;
    
    // Check if product still exists and is active
    const product = getProductById(view.idProduct);
    if (!product || product.status !== 'active') continue;
    
    // Score based on recency
    const daysSinceView = (Date.now() - view.viewedAt) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - daysSinceView * 10); // Decay over 10 days
    
    results.push({
      productId: view.idProduct,
      score: recencyScore,
      reason: `Viewed ${Math.round(daysSinceView)} days ago`,
    });
    
    if (results.length >= limit) break;
  }
  
  return results;
}

// ============================================================================
// PERSONALIZED ALGORITHM
// ============================================================================

/**
 * Generate "Personalized" recommendations based on user history
 */
export function generatePersonalized(
  userId: string,
  options: RecommendationOptions = {}
): RecommendationResult[] {
  const limit = options.limit || 10;
  const excludeIds = new Set(options.excludeProductIds || []);
  
  // Get user's purchase and view history
  const purchases = getUserProductHistory(userId, 'purchase', 50);
  const views = getUserProductHistory(userId, 'view', 100);
  
  if (purchases.length === 0 && views.length === 0) return [];
  
  // Build product type and brand preferences
  const typeCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  
  for (const purchase of purchases) {
    const product = getProductById(purchase.idProduct);
    if (!product) continue;
    
    typeCounts[product.type] = (typeCounts[product.type] || 0) + purchase.quantity;
    brandCounts[product.brand] = (brandCounts[product.brand] || 0) + purchase.quantity;
  }
  
  for (const view of views) {
    const product = getProductById(view.idProduct);
    if (!product) continue;
    
    typeCounts[product.type] = (typeCounts[product.type] || 0) + 0.5; // Views count less
    brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 0.5;
  }
  
  // Find most preferred type and brand
  const preferredType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const preferredBrand = Object.entries(brandCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  if (!preferredType) return [];
  
  // Get products matching preferences
  const filters: ProductFilters = {
    status: 'active',
    type: preferredType as any,
    limit: limit * 2,
  };
  
  const searchResults = listProducts(filters);
  
  const results: RecommendationResult[] = [];
  
  for (const product of searchResults.products) {
    if (excludeIds.has(product.id)) continue;
    
    let score = 0;
    const reasons: string[] = [];
    
    // Preferred type
    if (product.type === preferredType) {
      score += 50;
      reasons.push('matches your preferences');
    }
    
    // Preferred brand
    if (preferredBrand && product.brand === preferredBrand) {
      score += 30;
      reasons.push('preferred brand');
    }
    
    // High rating
    if (product.rating && product.rating >= 4.0) {
      score += 20;
      reasons.push('well rated');
    }
    
    if (score > 0) {
      results.push({
        productId: product.id,
        score,
        reason: reasons.join(', '),
      });
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}

// ============================================================================
// MAIN RECOMMENDATION GENERATOR
// ============================================================================

/**
 * Generate all recommendations for a product and save them
 */
export function generateAllRecommendations(
  idProduct: string,
  options: {
    userId?: string | null;
    sessionId?: string | null;
    regenerate?: boolean;
  } = {}
): void {
  if (options.regenerate) {
    clearRecommendations(idProduct);
  }
  
  const excludeIds = [idProduct];
  
  // Generate each type
  const fbt = generateFrequentlyBoughtTogether(idProduct, { limit: 10, excludeProductIds: excludeIds });
  const similar = generateSimilarProducts(idProduct, { limit: 10, excludeProductIds: excludeIds });
  const trending = generateTrendingProducts(idProduct, { limit: 10, excludeProductIds: excludeIds });
  const crossSell = generateCrossSellProducts(idProduct, { limit: 5, excludeProductIds: excludeIds });
  const upsell = generateUpsellProducts(idProduct, { limit: 5, excludeProductIds: excludeIds });
  
  // Save recommendations
  const saveRecommendations = (
    recommendations: RecommendationResult[],
    type: RecommendationType,
    algorithm: string
  ) => {
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      saveRecommendation({
        idProduct,
        recommendedProductId: rec.productId,
        recommendationType: type,
        rank: i + 1,
        score: rec.score,
        algorithm,
        algorithmVersion: 1,
      });
    }
  };
  
  saveRecommendations(fbt, 'frequently_bought_together', 'co-purchase-analysis');
  saveRecommendations(similar, 'similar', 'attribute-matching');
  saveRecommendations(trending, 'trending', 'popularity-ranking');
  saveRecommendations(crossSell, 'cross_sell', 'complementary-products');
  saveRecommendations(upsell, 'upsell', 'premium-alternatives');
}

/**
 * Get recommendations for a product (combines multiple types)
 */
export function getProductRecommendations(
  idProduct: string,
  options: {
    types?: RecommendationType[];
    limit?: number;
    userId?: string | null;
    sessionId?: string | null;
  } = {}
): Array<{
  product: Product;
  recommendationType: RecommendationType;
  score: number;
  reason: string;
}> {
  const types = options.types || [
    'frequently_bought_together',
    'similar',
    'trending',
    'cross_sell',
    'upsell',
  ];
  
  const limit = options.limit || 10;
  
  // Get saved recommendations
  const allRecommendations: Array<{
    productId: string;
    recommendationType: RecommendationType;
    score: number;
    rank: number;
  }> = [];
  
  for (const type of types) {
    const recs = getRecommendations(idProduct, type, limit);
    allRecommendations.push(...recs.map(r => ({
      productId: r.recommendedProductId,
      recommendationType: r.recommendationType,
      score: r.score,
      rank: r.rank,
    })));
  }
  
  // Add recently viewed if user is available
  if (options.userId || options.sessionId) {
    const recentlyViewed = generateRecentlyViewed(
      options.userId || null,
      options.sessionId || null,
      { limit: 5, excludeProductIds: [idProduct] }
    );
    
    allRecommendations.push(...recentlyViewed.map(r => ({
      productId: r.productId,
      recommendationType: 'recently_viewed' as RecommendationType,
      score: r.score,
      rank: 999, // Lower priority
    })));
  }
  
  // Deduplicate and sort by score
  const seen = new Set<string>();
  const unique: typeof allRecommendations = [];
  
  for (const rec of allRecommendations) {
    const key = `${rec.productId}-${rec.recommendationType}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rec);
    }
  }
  
  unique.sort((a, b) => b.score - a.score);
  
  // Fetch product details
  const results: Array<{
    product: Product;
    recommendationType: RecommendationType;
    score: number;
    reason: string;
  }> = [];
  
  for (const rec of unique.slice(0, limit)) {
    const product = getProductById(rec.productId);
    if (!product || product.status !== 'active') continue;
    
    results.push({
      product,
      recommendationType: rec.recommendationType,
      score: rec.score,
      reason: getRecommendationReason(rec.recommendationType),
    });
  }
  
  return results;
}

function getRecommendationReason(type: RecommendationType): string {
  const reasons: Record<RecommendationType, string> = {
    frequently_bought_together: 'Frequently bought together',
    similar: 'Similar products',
    trending: 'Trending now',
    cross_sell: 'You may also like',
    upsell: 'Premium option',
    recently_viewed: 'Recently viewed',
    personalized: 'Recommended for you',
  };
  
  return reasons[type] || 'Recommended';
}

