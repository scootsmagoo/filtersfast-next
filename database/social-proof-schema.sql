-- ========================================
-- SOCIAL PROOF SCHEMA
-- ========================================
-- Purpose: Track real-time product views and purchases for social proof badges
-- Date: January 2026
-- ========================================

-- Add social proof enabled flag to products table
-- This will be added via migration, but documented here for reference
-- ALTER TABLE products ADD COLUMN social_proof_enabled INTEGER DEFAULT 1;

-- ========================================
-- SOCIAL PROOF VIEWS TABLE (Extended from product_views)
-- ========================================
-- We'll use the existing product_views table for tracking views
-- This view provides real-time counts for social proof

-- View for recent product views (last 5 minutes)
CREATE VIEW IF NOT EXISTS view_recent_product_views AS
SELECT 
    idProduct,
    COUNT(*) as view_count,
    COUNT(DISTINCT sessionId) as unique_viewers
FROM product_views
WHERE viewedAt >= datetime('now', '-5 minutes')
GROUP BY idProduct;

-- ========================================
-- SOCIAL PROOF PURCHASES TABLE
-- ========================================
-- Track recent purchases for "X bought in last hour" badges
CREATE TABLE IF NOT EXISTS social_proof_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchased_at INTEGER NOT NULL,
    
    -- Indexes
    INDEX idx_social_proof_product (product_id),
    INDEX idx_social_proof_order (order_id),
    INDEX idx_social_proof_date (purchased_at),
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- View for recent purchases (last hour)
CREATE VIEW IF NOT EXISTS view_recent_product_purchases AS
SELECT 
    product_id,
    COUNT(*) as purchase_count,
    SUM(quantity) as total_quantity
FROM social_proof_purchases
WHERE purchased_at >= (strftime('%s', 'now') - 3600) * 1000
GROUP BY product_id;

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Product Views: Uses existing product_views table
-- 2. Recent Purchases: Tracked in social_proof_purchases table
-- 3. Views are aggregated for last 5 minutes
-- 4. Purchases are aggregated for last hour
-- 5. Privacy: Only aggregated counts are shown, no individual data
-- 
-- MAINTENANCE:
-- - Clean old purchase records after 24 hours (keep only for last hour queries)
-- - Indexes ensure fast queries for real-time counts
-- 
-- ========================================

