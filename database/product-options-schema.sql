-- ========================================
-- PRODUCT OPTIONS/VARIANTS SCHEMA
-- ========================================
-- Purpose: Support product variations (e.g., sizes, colors, pack quantities)
-- Date: January 2025
-- ========================================

-- ========================================
-- 1. OPTION GROUPS TABLE
-- ========================================
-- Groups of options (e.g., "Size", "Color", "Pack Quantity")
CREATE TABLE IF NOT EXISTS option_groups (
    idOptionGroup TEXT PRIMARY KEY,
    optionGroupDesc TEXT NOT NULL,
    optionReq TEXT NOT NULL DEFAULT 'Y', -- Y = required, N = optional
    optionType TEXT NOT NULL DEFAULT 'S', -- S = Select (dropdown), T = Text input
    sizingLink INTEGER DEFAULT 0, -- 1 = show sizing chart link
    sortOrder INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- ========================================
-- 2. OPTIONS TABLE
-- ========================================
-- Individual option values (e.g., "Small", "Medium", "Large", "6-Pack", "12-Pack")
CREATE TABLE IF NOT EXISTS options (
    idOption TEXT PRIMARY KEY,
    optionDescrip TEXT NOT NULL,
    priceToAdd DECIMAL(10,2) DEFAULT 0.00, -- Additional price for this option
    percToAdd DECIMAL(5,2) DEFAULT 0.00, -- Percentage to add to base price
    sortOrder INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- ========================================
-- 3. OPTION GROUP XREF TABLE
-- ========================================
-- Links options to option groups (many-to-many)
CREATE TABLE IF NOT EXISTS option_group_xref (
    idOptionGroup TEXT NOT NULL,
    idOption TEXT NOT NULL,
    PRIMARY KEY (idOptionGroup, idOption),
    FOREIGN KEY (idOptionGroup) REFERENCES option_groups(idOptionGroup) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_option_group_xref_group ON option_group_xref(idOptionGroup);
CREATE INDEX IF NOT EXISTS idx_option_group_xref_option ON option_group_xref(idOption);

-- ========================================
-- 4. PRODUCT OPTION GROUPS TABLE
-- ========================================
-- Links products to option groups
CREATE TABLE IF NOT EXISTS product_option_groups (
    id TEXT PRIMARY KEY,
    idProduct TEXT NOT NULL,
    idOptionGroup TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (idOptionGroup) REFERENCES option_groups(idOptionGroup) ON DELETE CASCADE,
    UNIQUE(idProduct, idOptionGroup)
);

CREATE INDEX IF NOT EXISTS idx_product_option_groups_product ON product_option_groups(idProduct);
CREATE INDEX IF NOT EXISTS idx_product_option_groups_group ON product_option_groups(idOptionGroup);

-- ========================================
-- 5. PRODUCT OPTION INVENTORY TABLE
-- ========================================
-- Inventory tracking per product+option combination
CREATE TABLE IF NOT EXISTS product_option_inventory (
    id TEXT PRIMARY KEY,
    idProduct TEXT NOT NULL,
    idOption TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    actualInventory INTEGER DEFAULT 0,
    ignoreStock INTEGER DEFAULT 0, -- 1 = ignore stock levels
    unavailable INTEGER DEFAULT 0, -- 1 = unavailable
    blocked INTEGER DEFAULT 0, -- 1 = blocked/discontinued
    reasonCode TEXT, -- Reason for unavailable/blocked status
    dropShip INTEGER DEFAULT 0, -- 1 = dropship item
    specialOrder INTEGER DEFAULT 0, -- 1 = special order
    updateCPStock INTEGER DEFAULT 0, -- 1 = update ChannelPilot stock
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    UNIQUE(idProduct, idOption)
);

CREATE INDEX IF NOT EXISTS idx_product_option_inventory_product ON product_option_inventory(idProduct);
CREATE INDEX IF NOT EXISTS idx_product_option_inventory_option ON product_option_inventory(idOption);
CREATE INDEX IF NOT EXISTS idx_product_option_inventory_stock ON product_option_inventory(stock);
CREATE INDEX IF NOT EXISTS idx_product_option_inventory_unavailable ON product_option_inventory(unavailable);
CREATE INDEX IF NOT EXISTS idx_product_option_inventory_blocked ON product_option_inventory(blocked);

-- ========================================
-- 6. PRODUCT OPTION IMAGES TABLE
-- ========================================
-- Images for specific product+option combinations
CREATE TABLE IF NOT EXISTS product_option_images (
    id TEXT PRIMARY KEY,
    idProduct TEXT NOT NULL,
    idOption TEXT NOT NULL,
    optionImageUrl TEXT NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    UNIQUE(idProduct, idOption)
);

CREATE INDEX IF NOT EXISTS idx_product_option_images_product ON product_option_images(idProduct);
CREATE INDEX IF NOT EXISTS idx_product_option_images_option ON product_option_images(idOption);

-- ========================================
-- 7. PRODUCT OPTION EXCLUSIONS TABLE
-- ========================================
-- Options to exclude from specific products
-- (Used when an option group has many options, but not all apply to a product)
CREATE TABLE IF NOT EXISTS product_option_exclusions (
    id TEXT PRIMARY KEY,
    idProduct TEXT NOT NULL,
    idOption TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (idProduct) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    UNIQUE(idProduct, idOption)
);

CREATE INDEX IF NOT EXISTS idx_product_option_exclusions_product ON product_option_exclusions(idProduct);
CREATE INDEX IF NOT EXISTS idx_product_option_exclusions_option ON product_option_exclusions(idOption);

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Option Groups: Define categories of options (e.g., "Size", "Pack Quantity")
-- 2. Options: Individual values within a group (e.g., "16x20x1", "6-Pack")
-- 3. Product Option Groups: Link products to option groups they support
-- 4. Product Option Inventory: Track stock per product+option combination
-- 5. Product Option Images: Display different images for different options
-- 6. Product Option Exclusions: Exclude specific options from specific products
-- 
-- EXAMPLE:
-- - Product: "Air Filter"
-- - Option Group: "Size" (required, dropdown)
--   - Option: "16x20x1" (priceToAdd: 0.00)
--   - Option: "20x25x1" (priceToAdd: 5.00)
--   - Option: "24x24x1" (priceToAdd: 10.00)
-- 
-- - Product Option Groups: Links "Air Filter" to "Size" group
-- - Product Option Inventory: Tracks stock for each size
-- - Product Option Images: Shows different image for each size (optional)
-- 
-- ========================================

