-- ========================================
-- INVENTORY MANAGEMENT SCHEMA
-- ========================================
-- Purpose: Track stock levels, shipments, adjustments, and low stock alerts
-- Date: November 4, 2025
-- ========================================

-- ========================================
-- 1. INVENTORY SHIPMENTS TABLE
-- ========================================
-- Tracks inbound shipments from suppliers
CREATE TABLE IF NOT EXISTS inventory_shipments (
    idShipment INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentNumber VARCHAR(50) UNIQUE NOT NULL,
    supplierName VARCHAR(200),
    supplierPO VARCHAR(100),
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_transit, received, cancelled
    
    -- Dates
    expectedDate DATE,
    receivedDate DATETIME,
    createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- User tracking
    createdBy INTEGER,
    receivedBy INTEGER,
    
    -- Notes
    notes TEXT,
    trackingNumber VARCHAR(100),
    carrier VARCHAR(50),
    
    -- Metadata
    totalItems INTEGER DEFAULT 0,
    totalCost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Indexes
    INDEX idx_shipment_status (status),
    INDEX idx_shipment_date (expectedDate),
    INDEX idx_shipment_created (createdDate),
    
    FOREIGN KEY (createdBy) REFERENCES admins(idAdmin),
    FOREIGN KEY (receivedBy) REFERENCES admins(idAdmin)
);

-- ========================================
-- 2. INVENTORY SHIPMENT ITEMS TABLE
-- ========================================
-- Tracks individual items in each shipment
CREATE TABLE IF NOT EXISTS inventory_shipment_items (
    idShipmentItem INTEGER PRIMARY KEY AUTOINCREMENT,
    idShipment INTEGER NOT NULL,
    idProduct INTEGER NOT NULL,
    idOption INTEGER, -- NULL for product-level inventory, or specific option ID
    
    -- Quantities
    expectedQuantity INTEGER NOT NULL,
    receivedQuantity INTEGER DEFAULT 0,
    damagedQuantity INTEGER DEFAULT 0,
    
    -- Cost tracking
    unitCost DECIMAL(10,2),
    
    -- Receiving notes
    notes TEXT,
    receivedDate DATETIME,
    
    -- Indexes
    INDEX idx_shipment_item_shipment (idShipment),
    INDEX idx_shipment_item_product (idProduct),
    INDEX idx_shipment_item_option (idOption),
    
    FOREIGN KEY (idShipment) REFERENCES inventory_shipments(idShipment) ON DELETE CASCADE,
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE
);

-- ========================================
-- 3. INVENTORY ADJUSTMENTS TABLE
-- ========================================
-- Tracks manual inventory adjustments (corrections, damage, theft, etc.)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    idAdjustment INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct INTEGER NOT NULL,
    idOption INTEGER, -- NULL for product-level inventory
    
    -- Adjustment details
    adjustmentType VARCHAR(50) NOT NULL, -- correction, damage, theft, shrinkage, returned, found
    quantityChange INTEGER NOT NULL, -- Positive for increase, negative for decrease
    
    -- Before/After tracking
    quantityBefore INTEGER NOT NULL,
    quantityAfter INTEGER NOT NULL,
    
    -- Reason and notes
    reason TEXT NOT NULL,
    notes TEXT,
    
    -- User and date tracking
    createdBy INTEGER NOT NULL,
    createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional cost impact
    costImpact DECIMAL(10,2),
    
    -- Indexes
    INDEX idx_adjustment_product (idProduct),
    INDEX idx_adjustment_option (idOption),
    INDEX idx_adjustment_date (createdDate),
    INDEX idx_adjustment_type (adjustmentType),
    INDEX idx_adjustment_user (createdBy),
    
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES admins(idAdmin)
);

-- ========================================
-- 4. INVENTORY ALERTS TABLE
-- ========================================
-- Tracks low stock alerts and thresholds
CREATE TABLE IF NOT EXISTS inventory_alerts (
    idAlert INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct INTEGER NOT NULL,
    idOption INTEGER, -- NULL for product-level inventory
    
    -- Alert configuration
    lowStockThreshold INTEGER NOT NULL DEFAULT 10,
    criticalStockThreshold INTEGER NOT NULL DEFAULT 5,
    reorderPoint INTEGER NOT NULL DEFAULT 20,
    reorderQuantity INTEGER NOT NULL DEFAULT 50,
    
    -- Alert status
    alertEnabled BOOLEAN DEFAULT 1,
    currentStockLevel INTEGER,
    lastAlertDate DATETIME,
    alertStatus VARCHAR(20) DEFAULT 'ok', -- ok, low, critical, out_of_stock
    
    -- Supplier info for reordering
    preferredSupplier VARCHAR(200),
    supplierSKU VARCHAR(100),
    leadTimeDays INTEGER,
    
    -- Auto-reorder (future feature)
    autoReorderEnabled BOOLEAN DEFAULT 0,
    
    -- Timestamps
    createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_alert_product (idProduct),
    INDEX idx_alert_option (idOption),
    INDEX idx_alert_status (alertStatus),
    INDEX idx_alert_enabled (alertEnabled),
    
    UNIQUE (idProduct, idOption),
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE
);

-- ========================================
-- 5. INVENTORY MOVEMENT LOG TABLE
-- ========================================
-- Comprehensive log of all inventory changes (auto-populated via triggers or application code)
CREATE TABLE IF NOT EXISTS inventory_movement_log (
    idMovement INTEGER PRIMARY KEY AUTOINCREMENT,
    idProduct INTEGER NOT NULL,
    idOption INTEGER,
    
    -- Movement details
    movementType VARCHAR(50) NOT NULL, -- sale, return, adjustment, shipment_received, order_cancelled
    quantityChange INTEGER NOT NULL, -- Positive for increase, negative for decrease
    
    -- Before/After tracking
    quantityBefore INTEGER NOT NULL,
    quantityAfter INTEGER NOT NULL,
    
    -- Reference to source transaction
    referenceType VARCHAR(50), -- order, shipment, adjustment, return
    referenceId INTEGER,
    
    -- User and date
    performedBy INTEGER,
    performedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    notes TEXT,
    
    -- Indexes
    INDEX idx_movement_product (idProduct),
    INDEX idx_movement_option (idOption),
    INDEX idx_movement_date (performedDate),
    INDEX idx_movement_type (movementType),
    INDEX idx_movement_reference (referenceType, referenceId),
    
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    FOREIGN KEY (performedBy) REFERENCES admins(idAdmin)
);

-- ========================================
-- 6. INVENTORY COUNTS TABLE
-- ========================================
-- Physical inventory counts/audits
CREATE TABLE IF NOT EXISTS inventory_counts (
    idCount INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Count session details
    countNumber VARCHAR(50) UNIQUE NOT NULL,
    countDate DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled
    
    -- User tracking
    countedBy INTEGER NOT NULL,
    completedDate DATETIME,
    
    -- Summary
    totalItemsCounted INTEGER DEFAULT 0,
    totalDiscrepancies INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_count_date (countDate),
    INDEX idx_count_status (status),
    
    FOREIGN KEY (countedBy) REFERENCES admins(idAdmin)
);

-- ========================================
-- 7. INVENTORY COUNT ITEMS TABLE
-- ========================================
-- Individual items in each physical count
CREATE TABLE IF NOT EXISTS inventory_count_items (
    idCountItem INTEGER PRIMARY KEY AUTOINCREMENT,
    idCount INTEGER NOT NULL,
    idProduct INTEGER NOT NULL,
    idOption INTEGER,
    
    -- Count details
    systemQuantity INTEGER NOT NULL,
    countedQuantity INTEGER NOT NULL,
    discrepancy INTEGER NOT NULL, -- countedQuantity - systemQuantity
    
    -- Resolution
    resolved BOOLEAN DEFAULT 0,
    adjustmentApplied BOOLEAN DEFAULT 0,
    idAdjustment INTEGER, -- Link to adjustment if created
    
    notes TEXT,
    countedDate DATETIME,
    
    INDEX idx_count_item_count (idCount),
    INDEX idx_count_item_product (idProduct),
    INDEX idx_count_item_resolved (resolved),
    
    FOREIGN KEY (idCount) REFERENCES inventory_counts(idCount) ON DELETE CASCADE,
    FOREIGN KEY (idProduct) REFERENCES products(idProduct) ON DELETE CASCADE,
    FOREIGN KEY (idOption) REFERENCES options(idOption) ON DELETE CASCADE,
    FOREIGN KEY (idAdjustment) REFERENCES inventory_adjustments(idAdjustment)
);

-- ========================================
-- INDEXES FOR EXISTING TABLES
-- ========================================
-- Add indexes to products table if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_actual_inventory ON products(actualInventory);
CREATE INDEX IF NOT EXISTS idx_products_ignore_stock ON products(ignoreStock);

-- Add indexes to productOptionInventory table if it exists and doesn't have them
CREATE INDEX IF NOT EXISTS idx_option_inventory_stock ON productOptionInventory(stock);
CREATE INDEX IF NOT EXISTS idx_option_inventory_product ON productOptionInventory(idProduct);
CREATE INDEX IF NOT EXISTS idx_option_inventory_option ON productOptionInventory(idOption);

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Low Stock Products View
CREATE VIEW IF NOT EXISTS view_low_stock_products AS
SELECT 
    p.idProduct,
    p.sku,
    p.description,
    p.stock,
    p.actualInventory,
    p.ignoreStock,
    a.lowStockThreshold,
    a.criticalStockThreshold,
    a.reorderPoint,
    a.reorderQuantity,
    a.alertStatus,
    a.preferredSupplier,
    a.leadTimeDays,
    CASE 
        WHEN p.stock <= 0 THEN 'out_of_stock'
        WHEN p.stock <= a.criticalStockThreshold THEN 'critical'
        WHEN p.stock <= a.lowStockThreshold THEN 'low'
        ELSE 'ok'
    END as calculatedStatus
FROM products p
LEFT JOIN inventory_alerts a ON p.idProduct = a.idProduct AND a.idOption IS NULL
WHERE p.active = 1 
  AND (p.ignoreStock IS NULL OR p.ignoreStock = 0)
  AND (p.stock <= a.lowStockThreshold OR a.alertStatus != 'ok');

-- Pending Shipments View
CREATE VIEW IF NOT EXISTS view_pending_shipments AS
SELECT 
    s.idShipment,
    s.shipmentNumber,
    s.supplierName,
    s.status,
    s.expectedDate,
    s.totalItems,
    s.totalCost,
    s.createdDate,
    COUNT(DISTINCT si.idShipmentItem) as itemCount,
    SUM(si.expectedQuantity) as totalExpectedQty,
    SUM(si.receivedQuantity) as totalReceivedQty
FROM inventory_shipments s
LEFT JOIN inventory_shipment_items si ON s.idShipment = si.idShipment
WHERE s.status IN ('pending', 'in_transit')
GROUP BY s.idShipment;

-- Stock Movement Summary View
CREATE VIEW IF NOT EXISTS view_stock_movement_summary AS
SELECT 
    DATE(performedDate) as movementDate,
    idProduct,
    movementType,
    COUNT(*) as transactionCount,
    SUM(CASE WHEN quantityChange > 0 THEN quantityChange ELSE 0 END) as totalAdded,
    SUM(CASE WHEN quantityChange < 0 THEN ABS(quantityChange) ELSE 0 END) as totalRemoved,
    SUM(quantityChange) as netChange
FROM inventory_movement_log
GROUP BY DATE(performedDate), idProduct, movementType;

-- ========================================
-- SAMPLE DATA / INITIAL CONFIGURATION
-- ========================================

-- Create initial shipment number sequence tracking (optional)
CREATE TABLE IF NOT EXISTS inventory_sequences (
    sequenceName VARCHAR(50) PRIMARY KEY,
    currentValue INTEGER NOT NULL DEFAULT 0,
    prefix VARCHAR(20),
    lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO inventory_sequences (sequenceName, currentValue, prefix) 
VALUES ('shipment_number', 0, 'SHIP-');

INSERT OR IGNORE INTO inventory_sequences (sequenceName, currentValue, prefix) 
VALUES ('count_number', 0, 'CNT-');

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================
-- 
-- USAGE NOTES:
-- 1. Stock Levels: Use products.stock and products.actualInventory for current inventory
-- 2. Product Options: Use productOptionInventory table for variant-level inventory
-- 3. Adjustments: Always create an inventory_adjustment record when manually changing stock
-- 4. Movements: Log all stock changes in inventory_movement_log for audit trail
-- 5. Alerts: Configure inventory_alerts for products that need monitoring
-- 6. Shipments: Track inbound shipments through inventory_shipments and _items tables
-- 
-- MAINTENANCE:
-- - Regularly clean old movement_log entries (keep 2+ years for audit)
-- - Archive completed shipments after 1 year
-- - Monitor alert thresholds and adjust based on sales velocity
-- 
-- ========================================

