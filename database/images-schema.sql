-- ========================================
-- IMAGE MANAGEMENT SCHEMA
-- ========================================
-- Purpose: Support product gallery images and image management
-- Date: January 2025
-- ========================================

-- ========================================
-- 1. PRODUCT IMAGES TABLE
-- ========================================
-- Gallery images for products (supports up to multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    idProduct TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    imgSortOrder INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(idProduct);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(imgSortOrder);

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Product Images: Stores gallery images for products (separate from primary_image field)
-- 2. Sort Order: Used to control the order of gallery images
-- 3. Image URLs: Should be relative paths from /ProdImages/ directory
-- 
-- EXAMPLE:
-- - Product: "Air Filter"
-- - Gallery Images:
--   - imgSortOrder 1: front-view.jpg
--   - imgSortOrder 2: side-view.jpg
--   - imgSortOrder 3: installation.jpg
-- 
-- ========================================

