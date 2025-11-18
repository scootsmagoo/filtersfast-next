-- ========================================
-- PRODUCT RECOMMENDATIONS ENGINE SCHEMA
-- ========================================
-- Purpose: Track product views, purchases, co-purchases, and generate recommendations
-- Date: January 2025
-- ========================================

-- ========================================
-- 1. PRODUCT VIEWS TABLE
-- ========================================
-- Tracks product page views for personalized recommendations
CREATE TABLE IF NOT EXISTS product_views (
    idView INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct TEXT NOT NULL,
    userId TEXT, -- NULL for anonymous users
    sessionId TEXT, -- Track anonymous sessions
    
    -- View details
    viewedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    viewDuration INTEGER, -- Seconds spent on page (optional, tracked client-side)
    
    -- Source tracking
    referrerUrl TEXT,
    sourceType VARCHAR(50), -- search, category, recommendation, direct, etc.
    recommendationType VARCHAR(50), -- Type of recommendation that led to view (if applicable)
    
    -- Device/browser info (optional, for analytics)
    userAgent TEXT,
    ipAddress TEXT,
    
    -- Indexes
    INDEX idx_views_product (idProduct),
    INDEX idx_views_user (userId),
    INDEX idx_views_session (sessionId),
    INDEX idx_views_date (viewedAt),
    INDEX idx_views_source (sourceType),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 2. PRODUCT CO-PURCHASES TABLE
-- ========================================
-- Tracks products frequently bought together (from order history)
CREATE TABLE IF NOT EXISTS product_co_purchases (
    idCoPurchase INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct1 TEXT NOT NULL,
    idProduct2 TEXT NOT NULL,
    
    -- Purchase metrics
    coPurchaseCount INTEGER NOT NULL DEFAULT 1, -- Number of times bought together
    lastPurchasedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    firstPurchasedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Confidence score (0-100) - higher = more reliable recommendation
    confidenceScore INTEGER DEFAULT 50,
    
    -- Ensure product1 < product2 for consistency (avoid duplicates)
    CHECK (idProduct1 < idProduct2),
    
    -- Indexes
    INDEX idx_co_purchase_product1 (idProduct1),
    INDEX idx_co_purchase_product2 (idProduct2),
    INDEX idx_co_purchase_count (coPurchaseCount),
    INDEX idx_co_purchase_confidence (confidenceScore),
    UNIQUE (idProduct1, idProduct2),
    
    FOREIGN KEY (idProduct1) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (idProduct2) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 3. PRODUCT RECOMMENDATIONS TABLE
-- ========================================
-- Stores pre-computed recommendations for products
CREATE TABLE IF NOT EXISTS product_recommendations (
    idRecommendation INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct TEXT NOT NULL, -- Product being recommended FOR
    recommendedProductId TEXT NOT NULL, -- Product being recommended
    
    -- Recommendation type
    recommendationType VARCHAR(50) NOT NULL, -- frequently_bought_together, similar, trending, cross_sell, upsell
    
    -- Ranking and scoring
    rank INTEGER NOT NULL, -- Position in recommendation list (1 = best)
    score DECIMAL(10,4) NOT NULL, -- Recommendation score (higher = better)
    
    -- Algorithm metadata
    algorithm VARCHAR(50), -- Which algorithm generated this recommendation
    algorithmVersion INTEGER DEFAULT 1,
    
    -- Status
    isActive BOOLEAN DEFAULT 1, -- Can be disabled manually
    
    -- Timestamps
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_recommendations_product (idProduct),
    INDEX idx_recommendations_recommended (recommendedProductId),
    INDEX idx_recommendations_type (recommendationType),
    INDEX idx_recommendations_rank (rank),
    INDEX idx_recommendations_score (score),
    INDEX idx_recommendations_active (isActive),
    UNIQUE (idProduct, recommendedProductId, recommendationType),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendedProductId) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 4. RECOMMENDATION CLICKS TABLE
-- ========================================
-- Tracks when users click on recommendations (for analytics and improvement)
CREATE TABLE IF NOT EXISTS recommendation_clicks (
    idClick INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct TEXT NOT NULL, -- Product page where recommendation was shown
    recommendedProductId TEXT NOT NULL, -- Product that was clicked
    recommendationType VARCHAR(50) NOT NULL,
    
    -- User tracking
    userId TEXT,
    sessionId TEXT,
    
    -- Click details
    clickedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    position INTEGER, -- Position in recommendation list (1 = first)
    
    -- Outcome tracking (updated later if purchase occurs)
    convertedToPurchase BOOLEAN DEFAULT 0,
    convertedAt DATETIME,
    orderId TEXT, -- If converted to purchase
    
    -- Indexes
    INDEX idx_clicks_product (idProduct),
    INDEX idx_clicks_recommended (recommendedProductId),
    INDEX idx_clicks_type (recommendationType),
    INDEX idx_clicks_user (userId),
    INDEX idx_clicks_date (clickedAt),
    INDEX idx_clicks_converted (convertedToPurchase),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendedProductId) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 5. USER PRODUCT INTERACTIONS TABLE
-- ========================================
-- Comprehensive tracking of user-product interactions (views, cart adds, purchases)
CREATE TABLE IF NOT EXISTS user_product_interactions (
    idInteraction INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    idProduct TEXT NOT NULL,
    
    -- Interaction type
    interactionType VARCHAR(50) NOT NULL, -- view, cart_add, purchase, wishlist_add
    
    -- Interaction details
    interactedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity INTEGER DEFAULT 1, -- For purchases/cart adds
    
    -- Context
    orderId TEXT, -- If interactionType = 'purchase'
    sessionId TEXT,
    
    -- Indexes
    INDEX idx_interactions_user (userId),
    INDEX idx_interactions_product (idProduct),
    INDEX idx_interactions_type (interactionType),
    INDEX idx_interactions_date (interactedAt),
    INDEX idx_interactions_order (orderId),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 6. RECOMMENDATION PERFORMANCE TABLE
-- ========================================
-- Aggregated performance metrics for recommendations
CREATE TABLE IF NOT EXISTS recommendation_performance (
    idPerformance INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct TEXT NOT NULL,
    recommendedProductId TEXT NOT NULL,
    recommendationType VARCHAR(50) NOT NULL,
    
    -- Date range for this performance record
    periodStart DATE NOT NULL,
    periodEnd DATE NOT NULL,
    
    -- Metrics
    impressions INTEGER DEFAULT 0, -- Times recommendation was shown
    clicks INTEGER DEFAULT 0, -- Times recommendation was clicked
    purchases INTEGER DEFAULT 0, -- Times recommendation led to purchase
    revenue DECIMAL(10,2) DEFAULT 0.00, -- Revenue from purchases
    
    -- Calculated metrics
    clickThroughRate DECIMAL(5,4) DEFAULT 0.0000, -- clicks / impressions
    conversionRate DECIMAL(5,4) DEFAULT 0.0000, -- purchases / clicks
    revenuePerImpression DECIMAL(10,2) DEFAULT 0.00, -- revenue / impressions
    
    -- Timestamps
    lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_performance_product (idProduct),
    INDEX idx_performance_recommended (recommendedProductId),
    INDEX idx_performance_type (recommendationType),
    INDEX idx_performance_period (periodStart, periodEnd),
    UNIQUE (idProduct, recommendedProductId, recommendationType, periodStart, periodEnd),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendedProductId) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- 7. RECOMMENDATION RULES TABLE
-- ========================================
-- Manual override rules for recommendations (admin-configurable)
CREATE TABLE IF NOT EXISTS recommendation_rules (
    idRule INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Rule scope
    idProduct TEXT, -- NULL = applies to all products
    productType VARCHAR(50), -- NULL = applies to all types
    categoryId TEXT, -- NULL = applies to all categories
    
    -- Rule type
    ruleType VARCHAR(50) NOT NULL, -- always_include, always_exclude, boost_score, limit_count
    
    -- Rule target
    targetProductId TEXT, -- Product to apply rule to (NULL for some rule types)
    targetProductType VARCHAR(50), -- Product type to apply rule to
    targetCategoryId TEXT, -- Category to apply rule to
    
    -- Rule parameters
    ruleValue TEXT, -- JSON or value depending on ruleType
    priority INTEGER DEFAULT 0, -- Higher priority rules override lower priority ones
    
    -- Status
    isActive BOOLEAN DEFAULT 1,
    
    -- Metadata
    description TEXT,
    createdBy TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_rules_product (idProduct),
    INDEX idx_rules_type (productType),
    INDEX idx_rules_category (categoryId),
    INDEX idx_rules_rule_type (ruleType),
    INDEX idx_rules_active (isActive),
    INDEX idx_rules_priority (priority),
    
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE
);

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Top Co-Purchased Products View
CREATE VIEW IF NOT EXISTS view_top_co_purchases AS
SELECT 
    idProduct1,
    idProduct2,
    coPurchaseCount,
    confidenceScore,
    lastPurchasedAt,
    ROW_NUMBER() OVER (PARTITION BY idProduct1 ORDER BY coPurchaseCount DESC, confidenceScore DESC) as rank
FROM product_co_purchases
ORDER BY idProduct1, rank;

-- Product Recommendation Summary View
CREATE VIEW IF NOT EXISTS view_product_recommendations_summary AS
SELECT 
    pr.idProduct,
    pr.recommendationType,
    COUNT(*) as recommendationCount,
    AVG(pr.score) as avgScore,
    MAX(pr.score) as maxScore,
    MIN(pr.score) as minScore,
    SUM(CASE WHEN pr.isActive = 1 THEN 1 ELSE 0 END) as activeCount
FROM product_recommendations pr
GROUP BY pr.idProduct, pr.recommendationType;

-- Recommendation Performance Summary View
CREATE VIEW IF NOT EXISTS view_recommendation_performance_summary AS
SELECT 
    rp.idProduct,
    rp.recommendationType,
    SUM(rp.impressions) as totalImpressions,
    SUM(rp.clicks) as totalClicks,
    SUM(rp.purchases) as totalPurchases,
    SUM(rp.revenue) as totalRevenue,
    CASE 
        WHEN SUM(rp.impressions) > 0 
        THEN CAST(SUM(rp.clicks) AS DECIMAL) / CAST(SUM(rp.impressions) AS DECIMAL)
        ELSE 0 
    END as overallCTR,
    CASE 
        WHEN SUM(rp.clicks) > 0 
        THEN CAST(SUM(rp.purchases) AS DECIMAL) / CAST(SUM(rp.clicks) AS DECIMAL)
        ELSE 0 
    END as overallConversionRate,
    CASE 
        WHEN SUM(rp.impressions) > 0 
        THEN SUM(rp.revenue) / CAST(SUM(rp.impressions) AS DECIMAL)
        ELSE 0 
    END as overallRevenuePerImpression
FROM recommendation_performance rp
WHERE rp.periodStart >= DATE('now', '-30 days')
GROUP BY rp.idProduct, rp.recommendationType;

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Product Views: Track every product page view for personalized recommendations
-- 2. Co-Purchases: Automatically updated when orders are placed (products bought together)
-- 3. Recommendations: Pre-computed recommendations refreshed periodically via background jobs
-- 4. Clicks: Track recommendation clicks to measure effectiveness
-- 5. Performance: Aggregated metrics for analyzing recommendation success
-- 6. Rules: Admin can override recommendations with manual rules
-- 
-- RECOMMENDATION TYPES:
-- - frequently_bought_together: Products often purchased in same order
-- - similar: Products with similar attributes (category, brand, specs)
-- - trending: Currently popular products
-- - cross_sell: Complementary products (e.g., air filter + filter frame)
-- - upsell: Higher-priced alternatives
-- - recently_viewed: Products user recently viewed
-- - personalized: Based on user's purchase/view history
-- 
-- MAINTENANCE:
-- - Run recommendation generation job daily/weekly
-- - Clean old views/interactions after 1+ year
-- - Update co-purchase counts when orders are placed
-- - Monitor performance metrics to optimize algorithms
-- 
-- ========================================

