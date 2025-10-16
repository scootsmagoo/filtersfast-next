import { SearchableProduct, SearchResult, SearchFilters } from './types';

/**
 * Normalize search query for consistent matching
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculate search score based on match type and field
 */
export function calculateScore(
  product: SearchableProduct,
  query: string,
  matchedFields: string[]
): number {
  const normalizedQuery = normalizeQuery(query);
  let score = 0;

  // Exact SKU match (highest priority)
  if (product.sku.toLowerCase() === normalizedQuery) {
    score += 100;
  }

  // Exact name match
  if (product.name.toLowerCase().includes(normalizedQuery)) {
    score += 80;
  }

  // Brand + partial name match
  if (product.brand.toLowerCase().includes(normalizedQuery)) {
    score += 60;
  }

  // Partial name match
  if (product.name.toLowerCase().includes(normalizedQuery)) {
    score += 40;
  }

  // Keyword matches
  const keywordMatches = product.searchKeywords.filter(keyword =>
    keyword.includes(normalizedQuery)
  ).length;
  score += keywordMatches * 20;

  // Part number matches
  const partNumberMatches = product.partNumbers.filter(part =>
    part.toLowerCase().includes(normalizedQuery)
  ).length;
  score += partNumberMatches * 30;

  // Description matches
  if (product.description.toLowerCase().includes(normalizedQuery)) {
    score += 10;
  }

  // Boost score for popular products
  if (product.reviewCount > 1000) score += 5;
  if (product.rating > 4.5) score += 5;
  if (product.badges?.includes('bestseller')) score += 10;

  return score;
}

/**
 * Determine match type based on how the query matched
 */
export function getMatchType(
  product: SearchableProduct,
  query: string,
  matchedFields: string[]
): 'exact' | 'partial' | 'fuzzy' | 'keyword' {
  const normalizedQuery = normalizeQuery(query);

  if (product.sku.toLowerCase() === normalizedQuery) {
    return 'exact';
  }

  if (matchedFields.includes('name') && product.name.toLowerCase().includes(normalizedQuery)) {
    return 'partial';
  }

  if (matchedFields.some(field => field === 'searchKeywords' || field === 'partNumbers')) {
    return 'keyword';
  }

  return 'fuzzy';
}

/**
 * Get which fields matched the search query
 */
export function getMatchedFields(
  product: SearchableProduct,
  query: string
): string[] {
  const normalizedQuery = normalizeQuery(query);
  const matchedFields: string[] = [];

  if (product.sku.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('sku');
  }

  if (product.name.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('name');
  }

  if (product.brand.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('brand');
  }

  if (product.description.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push('description');
  }

  if (product.searchKeywords.some(keyword => keyword.includes(normalizedQuery))) {
    matchedFields.push('searchKeywords');
  }

  if (product.partNumbers.some(part => part.includes(normalizedQuery))) {
    matchedFields.push('partNumbers');
  }

  return matchedFields;
}

/**
 * Apply filters to search results
 */
export function applyFilters(
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] {
  return results.filter(result => {
    const product = result.product;

    if (filters.category && product.category !== filters.category) {
      return false;
    }

    if (filters.brand && product.brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }

    if (filters.minPrice && product.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice && product.price > filters.maxPrice) {
      return false;
    }

    if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
      return false;
    }

    if (filters.minRating && product.rating < filters.minRating) {
      return false;
    }

    return true;
  });
}

/**
 * Generate search suggestions based on query
 */
export function generateSuggestions(
  products: SearchableProduct[],
  query: string,
  limit: number = 5
): string[] {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) return [];

  const suggestions = new Set<string>();

  products.forEach(product => {
    // Add brand suggestions
    if (product.brand.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(product.brand);
    }

    // Add SKU suggestions
    if (product.sku.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(product.sku);
    }

    // Add partial name suggestions
    const words = product.name.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.includes(normalizedQuery) && word.length > normalizedQuery.length) {
        suggestions.add(word);
      }
    });
  });

  return Array.from(suggestions)
    .sort()
    .slice(0, limit);
}
