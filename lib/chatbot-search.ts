import { getAllArticles } from './db/support';

/**
 * Simple keyword-based search for support articles
 * This is a basic implementation - could be enhanced with vector embeddings later
 */
export function searchSupportArticles(query: string, limit: number = 5) {
  const articles = getAllArticles({ publishedOnly: true });
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);
  
  // Score each article based on keyword matches
  const scoredArticles = articles.map(article => {
    let score = 0;
    const normalizedTitle = normalizeText(article.title);
    const normalizedContent = normalizeText(article.content);
    const normalizedExcerpt = normalizeText(article.excerpt || '');
    
    queryWords.forEach(word => {
      // Title matches are weighted highest
      if (normalizedTitle.includes(word)) {
        score += 5;
      }
      
      // Excerpt matches are weighted medium
      if (normalizedExcerpt.includes(word)) {
        score += 3;
      }
      
      // Content matches are weighted lower
      if (normalizedContent.includes(word)) {
        score += 1;
      }
    });
    
    // Boost score for exact phrase matches
    if (normalizedTitle.includes(normalizedQuery)) {
      score += 20;
    }
    if (normalizedContent.includes(normalizedQuery)) {
      score += 10;
    }
    
    return {
      ...article,
      score,
    };
  });
  
  // Sort by score and return top results
  return scoredArticles
    .filter(article => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Normalize text for better matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Format articles as context for the AI
 */
export function formatArticlesForContext(articles: ReturnType<typeof searchSupportArticles>): string {
  if (articles.length === 0) {
    return 'No relevant articles found.';
  }
  
  return articles.map((article, index) => {
    return `
Article ${index + 1}: ${article.title}
Category: ${article.category_name}
Content: ${stripHtml(article.content).substring(0, 500)}...
---`;
  }).join('\n');
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

