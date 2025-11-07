-- Search Analytics Schema
-- Tracks user searches, search outcomes, and catalog insights

CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_term TEXT NOT NULL,
  search_term_normalized TEXT,
  search_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  outcome TEXT, -- 'results_found', 'no_results', 'redirect', 'error'
  result_count INTEGER DEFAULT 0,
  redirect_url TEXT,
  search_type TEXT, -- 'product', 'size', 'sku', 'model', 'custom'
  filters_applied TEXT, -- JSON string of filters
  result_product_ids TEXT, -- Comma-separated list of product IDs that matched
  mobile BOOLEAN DEFAULT 0,
  referrer TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON search_logs(search_date);
CREATE INDEX IF NOT EXISTS idx_search_logs_term ON search_logs(search_term);
CREATE INDEX IF NOT EXISTS idx_search_logs_normalized ON search_logs(search_term_normalized);
CREATE INDEX IF NOT EXISTS idx_search_logs_outcome ON search_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_type ON search_logs(search_type);
CREATE INDEX IF NOT EXISTS idx_search_logs_mobile ON search_logs(mobile);

-- Search click tracking (when users click on search results)
CREATE TABLE IF NOT EXISTS search_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_log_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  click_position INTEGER NOT NULL, -- Position in search results (1-based)
  click_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  session_id TEXT,
  ip_address TEXT,
  converted BOOLEAN DEFAULT 0, -- Whether this click led to a purchase
  order_id INTEGER, -- If converted, the order ID
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (search_log_id) REFERENCES search_logs(id) ON DELETE CASCADE
);

-- Indexes for search clicks
CREATE INDEX IF NOT EXISTS idx_search_clicks_log ON search_clicks(search_log_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_product ON search_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_date ON search_clicks(click_date);
CREATE INDEX IF NOT EXISTS idx_search_clicks_converted ON search_clicks(converted);

-- View for top searches
CREATE VIEW IF NOT EXISTS v_top_searches AS
SELECT 
  search_term,
  search_term_normalized,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(result_count) as avg_results,
  SUM(CASE WHEN outcome = 'results_found' THEN 1 ELSE 0 END) as successful_searches,
  SUM(CASE WHEN outcome = 'no_results' THEN 1 ELSE 0 END) as failed_searches,
  MAX(search_date) as last_searched
FROM search_logs
WHERE search_term IS NOT NULL AND search_term != ''
GROUP BY search_term_normalized
ORDER BY search_count DESC;

-- View for search trends over time
CREATE VIEW IF NOT EXISTS v_search_trends AS
SELECT 
  DATE(search_date) as search_day,
  COUNT(*) as total_searches,
  COUNT(DISTINCT user_id) as unique_searchers,
  COUNT(DISTINCT search_term_normalized) as unique_terms,
  AVG(result_count) as avg_results_per_search,
  SUM(CASE WHEN outcome = 'results_found' THEN 1 ELSE 0 END) as successful_searches,
  SUM(CASE WHEN outcome = 'no_results' THEN 1 ELSE 0 END) as failed_searches,
  SUM(CASE WHEN mobile = 1 THEN 1 ELSE 0 END) as mobile_searches
FROM search_logs
GROUP BY DATE(search_date)
ORDER BY search_day DESC;

-- View for failed searches (catalog insights)
CREATE VIEW IF NOT EXISTS v_failed_searches AS
SELECT 
  search_term,
  search_term_normalized,
  COUNT(*) as failure_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(search_date) as last_searched,
  GROUP_CONCAT(DISTINCT search_type) as search_types
FROM search_logs
WHERE outcome = 'no_results'
GROUP BY search_term_normalized
ORDER BY failure_count DESC;

-- View for search conversion rates
CREATE VIEW IF NOT EXISTS v_search_conversions AS
SELECT 
  sl.search_term_normalized,
  COUNT(DISTINCT sl.id) as total_searches,
  COUNT(DISTINCT sc.id) as total_clicks,
  COUNT(DISTINCT CASE WHEN sc.converted = 1 THEN sc.id END) as conversions,
  ROUND(COUNT(DISTINCT sc.id) * 100.0 / COUNT(DISTINCT sl.id), 2) as click_rate,
  ROUND(COUNT(DISTINCT CASE WHEN sc.converted = 1 THEN sc.id END) * 100.0 / COUNT(DISTINCT sc.id), 2) as conversion_rate
FROM search_logs sl
LEFT JOIN search_clicks sc ON sl.id = sc.search_log_id
WHERE sl.search_term_normalized IS NOT NULL
GROUP BY sl.search_term_normalized
HAVING total_searches >= 5
ORDER BY conversions DESC, total_searches DESC;

