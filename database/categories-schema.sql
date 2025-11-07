-- ========================================
-- CATEGORIES SCHEMA
-- ========================================
-- Purpose: Product category hierarchy and management
-- Date: January 2025
-- ========================================

-- ========================================
-- 1. CATEGORIES TABLE
-- ========================================
-- Main categories table with hierarchical structure
CREATE TABLE IF NOT EXISTS categories (
    idCategory INTEGER PRIMARY KEY,
    categoryDesc TEXT NOT NULL,
    idParentCategory INTEGER NOT NULL DEFAULT 0,
    categoryFeatured TEXT NOT NULL DEFAULT 'N', -- Y or N
    categoryHTML TEXT, -- Short HTML (max 255 chars)
    categoryHTMLLong TEXT, -- Long HTML content
    sortOrder INTEGER,
    categoryGraphic TEXT, -- Splash image path
    categoryImage TEXT, -- Category graphic path
    categoryContentLocation INTEGER NOT NULL DEFAULT 0, -- 0 = above products, 1 = below products
    categoryType TEXT DEFAULT '', -- '', 'Brands', 'Size', 'Type', 'Filtration Level', 'Deal', 'MarketingPromos'
    hideFromListings INTEGER NOT NULL DEFAULT 0, -- 0 = show, 1 = hide
    pagname TEXT, -- URL slug (e.g., 'example-cat.asp')
    metatitle TEXT, -- SEO meta title
    metadesc TEXT, -- SEO meta description
    metacat TEXT, -- SEO meta keywords
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (idParentCategory) REFERENCES categories(idCategory) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(idParentCategory);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(categoryType);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(categoryFeatured);
CREATE INDEX IF NOT EXISTS idx_categories_pagname ON categories(pagname);

-- ========================================
-- 2. CATEGORIES_PRODUCTS TABLE
-- ========================================
-- Many-to-many relationship between categories and products
CREATE TABLE IF NOT EXISTS categories_products (
    idCatProd INTEGER PRIMARY KEY AUTOINCREMENT,
    idCategory INTEGER NOT NULL,
    idProduct INTEGER NOT NULL,
    FOREIGN KEY (idCategory) REFERENCES categories(idCategory) ON DELETE CASCADE,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(idCategory, idProduct)
);

CREATE INDEX IF NOT EXISTS idx_categories_products_category ON categories_products(idCategory);
CREATE INDEX IF NOT EXISTS idx_categories_products_product ON categories_products(idProduct);

-- ========================================
-- 3. INITIAL DATA
-- ========================================
-- Create root category if it doesn't exist
INSERT OR IGNORE INTO categories (
    idCategory,
    categoryDesc,
    idParentCategory,
    categoryFeatured,
    createdAt,
    updatedAt
) VALUES (
    1,
    'Root',
    0,
    'N',
    CAST(strftime('%s', 'now') AS INTEGER),
    CAST(strftime('%s', 'now') AS INTEGER)
);

