import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');

export interface SearchLog {
  id: number;
  searchTerm: string;
  searchTermNormalized: string | null;
  searchDate: string;
  userId: number | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
  resultCount: number;
  redirectUrl: string | null;
  searchType: string | null;
  filtersApplied: string | null;
  resultProductIds: string | null;
  mobile: boolean;
  referrer: string | null;
  createdAt: string;
}

export interface SearchClick {
  id: number;
  searchLogId: number;
  productId: string;
  clickPosition: number;
  clickDate: string;
  userId: number | null;
  sessionId: string | null;
  ipAddress: string | null;
  converted: boolean;
  orderId: number | null;
  createdAt: string;
}

export interface TopSearch {
  searchTerm: string;
  searchTermNormalized: string;
  searchCount: number;
  uniqueUsers: number;
  avgResults: number;
  successfulSearches: number;
  failedSearches: number;
  lastSearched: string;
}

export interface SearchTrend {
  searchDay: string;
  totalSearches: number;
  uniqueSearchers: number;
  uniqueTerms: number;
  avgResultsPerSearch: number;
  successfulSearches: number;
  failedSearches: number;
  mobileSearches: number;
}

export interface FailedSearch {
  searchTerm: string;
  searchTermNormalized: string;
  failureCount: number;
  uniqueUsers: number;
  lastSearched: string;
  searchTypes: string;
}

export interface SearchConversion {
  searchTermNormalized: string;
  totalSearches: number;
  totalClicks: number;
  conversions: number;
  clickRate: number;
  conversionRate: number;
}

/**
 * Log a search query
 * OWASP: All inputs validated and sanitized to prevent injection attacks
 */
export function logSearch(params: {
  searchTerm: string;
  searchTermNormalized?: string;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'results_found' | 'no_results' | 'redirect' | 'error';
  resultCount?: number;
  redirectUrl?: string;
  searchType?: 'product' | 'size' | 'sku' | 'model' | 'custom';
  filtersApplied?: Record<string, any>;
  resultProductIds?: string[];
  mobile?: boolean;
  referrer?: string;
}): number {
  const db = new Database(dbPath);

  // OWASP: Validate and sanitize all inputs
  // Sanitize search term - limit length and strip dangerous characters
  const sanitizedSearchTerm = (params.searchTerm || '').trim().slice(0, 200);
  if (!sanitizedSearchTerm) {
    db.close();
    throw new Error('Search term is required');
  }

  // OWASP: Validate outcome is in allowed list
  const validOutcomes = ['results_found', 'no_results', 'redirect', 'error'];
  if (!validOutcomes.includes(params.outcome)) {
    db.close();
    throw new Error('Invalid outcome value');
  }

  // OWASP: Sanitize and limit string fields
  const sanitizedNormalized = (params.searchTermNormalized || sanitizedSearchTerm.toLowerCase().trim()).slice(0, 200);
  const sanitizedSessionId = params.sessionId ? params.sessionId.slice(0, 255) : null;
  const sanitizedIpAddress = params.ipAddress ? params.ipAddress.slice(0, 45) : null; // IPv6 max length
  const sanitizedUserAgent = params.userAgent ? params.userAgent.slice(0, 500) : null;
  const sanitizedRedirectUrl = params.redirectUrl ? params.redirectUrl.slice(0, 500) : null;
  const sanitizedSearchType = params.searchType && ['product', 'size', 'sku', 'model', 'custom'].includes(params.searchType) 
    ? params.searchType 
    : null;
  const sanitizedReferrer = params.referrer ? params.referrer.slice(0, 500) : null;

  // OWASP: Validate numeric inputs
  const validatedUserId = params.userId && params.userId > 0 ? params.userId : null;
  const validatedResultCount = Math.max(0, Math.min(1000000, Math.floor(params.resultCount || 0)));

  // OWASP: Sanitize JSON data (filtersApplied) - validate structure and limit size
  let sanitizedFilters = null;
  if (params.filtersApplied) {
    try {
      const jsonString = JSON.stringify(params.filtersApplied);
      if (jsonString.length <= 2000) {
        sanitizedFilters = jsonString;
      }
    } catch {
      // Invalid JSON - ignore
    }
  }

  // OWASP: Sanitize product IDs array
  let sanitizedProductIds = null;
  if (params.resultProductIds && Array.isArray(params.resultProductIds)) {
    const sanitized = params.resultProductIds
      .slice(0, 100) // Limit to 100 product IDs
      .map(id => String(id).slice(0, 100))
      .filter(id => id.length > 0);
    if (sanitized.length > 0) {
      sanitizedProductIds = sanitized.join(',');
    }
  }

  const query = `
    INSERT INTO search_logs (
      search_term,
      search_term_normalized,
      user_id,
      session_id,
      ip_address,
      user_agent,
      outcome,
      result_count,
      redirect_url,
      search_type,
      filters_applied,
      result_product_ids,
      mobile,
      referrer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(
    sanitizedSearchTerm,
    sanitizedNormalized,
    validatedUserId,
    sanitizedSessionId,
    sanitizedIpAddress,
    sanitizedUserAgent,
    params.outcome,
    validatedResultCount,
    sanitizedRedirectUrl,
    sanitizedSearchType,
    sanitizedFilters,
    sanitizedProductIds,
    params.mobile ? 1 : 0,
    sanitizedReferrer
  );

  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Log a search result click
 */
export function logSearchClick(params: {
  searchLogId: number;
  productId: string;
  clickPosition: number;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
}): number {
  const db = new Database(dbPath);

  const query = `
    INSERT INTO search_clicks (
      search_log_id,
      product_id,
      click_position,
      user_id,
      session_id,
      ip_address
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(
    params.searchLogId,
    params.productId,
    params.clickPosition,
    params.userId || null,
    params.sessionId || null,
    params.ipAddress || null
  );

  db.close();
  return result.lastInsertRowid as number;
}

/**
 * Mark a search click as converted (purchase made)
 */
export function markSearchClickConverted(clickId: number, orderId: number): void {
  const db = new Database(dbPath);

  const query = `
    UPDATE search_clicks
    SET converted = 1, order_id = ?
    WHERE id = ?
  `;

  db.prepare(query).run(orderId, clickId);
  db.close();
}

/**
 * Get top searches
 */
export function getTopSearches(limit: number = 50, startDate?: string, endDate?: string): TopSearch[] {
  const db = new Database(dbPath);

  let query = `
    SELECT 
      search_term,
      search_term_normalized,
      search_count,
      unique_users,
      avg_results,
      successful_searches,
      failed_searches,
      last_searched
    FROM v_top_searches
  `;

  const params: any[] = [];
  if (startDate || endDate) {
    query += ` WHERE 1=1`;
    if (startDate) {
      query += ` AND last_searched >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND last_searched <= ?`;
      params.push(endDate);
    }
  }

  query += ` ORDER BY search_count DESC LIMIT ?`;
  params.push(limit);

  const results = db.prepare(query).all(...params) as TopSearch[];
  db.close();

  return results;
}

/**
 * Get search trends over time
 */
export function getSearchTrends(days: number = 30): SearchTrend[] {
  const db = new Database(dbPath);

  const query = `
    SELECT 
      search_day,
      total_searches,
      unique_searchers,
      unique_terms,
      avg_results_per_search,
      successful_searches,
      failed_searches,
      mobile_searches
    FROM v_search_trends
    WHERE search_day >= DATE('now', '-' || ? || ' days')
    ORDER BY search_day DESC
  `;

  const results = db.prepare(query).all(days) as SearchTrend[];
  db.close();

  return results;
}

/**
 * Get failed searches (catalog insights)
 */
export function getFailedSearches(limit: number = 50, minFailures: number = 2): FailedSearch[] {
  const db = new Database(dbPath);

  const query = `
    SELECT 
      search_term,
      search_term_normalized,
      failure_count,
      unique_users,
      last_searched,
      search_types
    FROM v_failed_searches
    WHERE failure_count >= ?
    ORDER BY failure_count DESC
    LIMIT ?
  `;

  const results = db.prepare(query).all(minFailures, limit) as FailedSearch[];
  db.close();

  return results;
}

/**
 * Get search conversion rates
 */
export function getSearchConversions(limit: number = 50, minSearches: number = 5): SearchConversion[] {
  const db = new Database(dbPath);

  const query = `
    SELECT 
      search_term_normalized,
      total_searches,
      total_clicks,
      conversions,
      click_rate,
      conversion_rate
    FROM v_search_conversions
    WHERE total_searches >= ?
    ORDER BY conversions DESC, total_searches DESC
    LIMIT ?
  `;

  const results = db.prepare(query).all(minSearches, limit) as SearchConversion[];
  db.close();

  return results;
}

/**
 * Get search statistics summary
 */
export function getSearchStats(startDate?: string, endDate?: string): {
  totalSearches: number;
  uniqueSearchers: number;
  uniqueTerms: number;
  avgResultsPerSearch: number;
  successRate: number;
  mobilePercentage: number;
  topOutcomes: Array<{ outcome: string; count: number }>;
} {
  const db = new Database(dbPath);

  let query = `
    SELECT 
      COUNT(*) as total_searches,
      COUNT(DISTINCT user_id) as unique_searchers,
      COUNT(DISTINCT search_term_normalized) as unique_terms,
      AVG(result_count) as avg_results,
      SUM(CASE WHEN outcome = 'results_found' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
      SUM(CASE WHEN mobile = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as mobile_percentage
    FROM search_logs
    WHERE 1=1
  `;

  const params: any[] = [];
  if (startDate) {
    query += ` AND search_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND search_date <= ?`;
    params.push(endDate);
  }

  const stats = db.prepare(query).get(...params) as any;

  // Get outcome breakdown
  let outcomeQuery = `
    SELECT outcome, COUNT(*) as count
    FROM search_logs
    WHERE 1=1
  `;
  if (startDate) {
    outcomeQuery += ` AND search_date >= ?`;
  }
  if (endDate) {
    outcomeQuery += ` AND search_date <= ?`;
  }
  outcomeQuery += ` GROUP BY outcome ORDER BY count DESC`;

  const outcomes = db.prepare(outcomeQuery).all(...params) as Array<{ outcome: string; count: number }>;

  db.close();

  return {
    totalSearches: stats.total_searches || 0,
    uniqueSearchers: stats.unique_searchers || 0,
    uniqueTerms: stats.unique_terms || 0,
    avgResultsPerSearch: Math.round((stats.avg_results || 0) * 100) / 100,
    successRate: Math.round((stats.success_rate || 0) * 100) / 100,
    mobilePercentage: Math.round((stats.mobile_percentage || 0) * 100) / 100,
    topOutcomes: outcomes
  };
}

/**
 * Get recent search logs
 * OWASP: Input sanitized to prevent SQL injection via LIKE queries
 */
export function getRecentSearches(limit: number = 100, searchTerm?: string): SearchLog[] {
  const db = new Database(dbPath);

  // OWASP: Validate and sanitize limit
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit || 100)));

  let query = `
    SELECT 
      id,
      search_term,
      search_term_normalized,
      search_date,
      user_id,
      session_id,
      ip_address,
      user_agent,
      outcome,
      result_count,
      redirect_url,
      search_type,
      filters_applied,
      result_product_ids,
      mobile,
      referrer,
      created_at
    FROM search_logs
    WHERE 1=1
  `;

  const params: any[] = [];
  if (searchTerm) {
    // OWASP: Sanitize search term - remove SQL special characters and limit length
    const sanitizedTerm = searchTerm.trim().slice(0, 200).replace(/[%_]/g, '');
    if (sanitizedTerm.length > 0) {
      query += ` AND (search_term LIKE ? ESCAPE '\\' OR search_term_normalized LIKE ? ESCAPE '\\')`;
      // Escape LIKE wildcards in user input
      const escapedTerm = sanitizedTerm.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      params.push(`%${escapedTerm}%`, `%${escapedTerm}%`);
    }
  }

  query += ` ORDER BY search_date DESC LIMIT ?`;
  params.push(safeLimit);

  const results = db.prepare(query).all(...params) as any[];
  db.close();

  return results.map(row => ({
    id: row.id,
    searchTerm: row.search_term,
    searchTermNormalized: row.search_term_normalized,
    searchDate: row.search_date,
    userId: row.user_id,
    sessionId: row.session_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    outcome: row.outcome,
    resultCount: row.result_count,
    redirectUrl: row.redirect_url,
    searchType: row.search_type,
    filtersApplied: row.filters_applied ? JSON.parse(row.filters_applied) : null,
    resultProductIds: row.result_product_ids ? row.result_product_ids.split(',') : null,
    mobile: Boolean(row.mobile),
    referrer: row.referrer,
    createdAt: row.created_at
  }));
}

