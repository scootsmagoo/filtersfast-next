-- ========================================
-- SKU COMPATIBILITY MANAGEMENT SCHEMA
-- ========================================
-- Purpose: Track compatible SKUs and brands for products (replaces productCompSkuList)
-- This allows products to show which other SKUs/brands they are compatible with
-- Date: November 7, 2025
-- ========================================

-- ========================================
-- PRODUCT SKU COMPATIBILITY TABLE
-- ========================================
-- Stores compatible SKUs and brands for each product
-- Legacy table: productCompSkuList
CREATE TABLE IF NOT EXISTS product_sku_compatibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct INTEGER NOT NULL,
    
    -- Compatibility details
    skuBrand VARCHAR(100) NOT NULL,  -- Brand name (e.g., "Pentek", "Culligan")
    skuValue VARCHAR(100) NOT NULL,  -- SKU/part number (e.g., "P5", "155014")
    
    -- Timestamps
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sku_compat_product (idProduct),
    INDEX idx_sku_compat_brand (skuBrand),
    INDEX idx_sku_compat_value (skuValue),
    INDEX idx_sku_compat_product_brand_value (idProduct, skuBrand, skuValue),
    
    -- Foreign key
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE
);

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Product Compatibility Summary View
CREATE VIEW IF NOT EXISTS view_product_compatibility_summary AS
SELECT 
    p.idProduct,
    p.sku as productSku,
    p.description as productName,
    COUNT(DISTINCT c.id) as compatibleSkuCount,
    GROUP_CONCAT(DISTINCT c.skuBrand) as compatibleBrands
FROM products p
LEFT JOIN product_sku_compatibility c ON p.idProduct = c.idProduct
WHERE p.active = 1
GROUP BY p.idProduct, p.sku, p.description;

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Compatibility Records: Each record represents one compatible SKU/brand combination
-- 2. Product Linking: Use idProduct to link compatibility to a product
-- 3. Search Integration: Compatible SKUs are indexed for search functionality
-- 4. Display: Show compatible SKUs on product pages for customer reference
-- 5. Merging: When products are merged, compatibility records should be merged too
-- 
-- MAINTENANCE:
-- - Clean up orphaned compatibility records when products are deleted
-- - Regular validation to ensure brand/SKU combinations are valid
-- - Index optimization for search performance
-- 
-- ========================================

