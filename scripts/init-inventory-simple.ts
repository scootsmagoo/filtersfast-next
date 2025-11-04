/**
 * Simple Inventory Tables Initialization
 * Creates just the core inventory tables
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

console.log('🔧 Initializing Inventory Tables (Simple)...\n')

try {
  // Create inventory_shipments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_shipments (
      idShipment INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentNumber VARCHAR(50) UNIQUE NOT NULL,
      supplierName VARCHAR(200),
      supplierPO VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      expectedDate DATE,
      receivedDate DATETIME,
      createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdBy INTEGER,
      receivedBy INTEGER,
      notes TEXT,
      trackingNumber VARCHAR(100),
      carrier VARCHAR(50),
      totalItems INTEGER DEFAULT 0,
      totalCost DECIMAL(10,2) DEFAULT 0.00
    )
  `)
  console.log('✅ Created inventory_shipments table')

  // Create inventory_shipment_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_shipment_items (
      idShipmentItem INTEGER PRIMARY KEY AUTOINCREMENT,
      idShipment INTEGER NOT NULL,
      idProduct INTEGER NOT NULL,
      idOption INTEGER,
      expectedQuantity INTEGER NOT NULL,
      receivedQuantity INTEGER DEFAULT 0,
      damagedQuantity INTEGER DEFAULT 0,
      unitCost DECIMAL(10,2),
      notes TEXT,
      receivedDate DATETIME,
      FOREIGN KEY (idShipment) REFERENCES inventory_shipments(idShipment) ON DELETE CASCADE
    )
  `)
  console.log('✅ Created inventory_shipment_items table')

  // Create inventory_adjustments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      idAdjustment INTEGER PRIMARY KEY AUTOINCREMENT,
      idProduct INTEGER NOT NULL,
      idOption INTEGER,
      adjustmentType VARCHAR(50) NOT NULL,
      quantityChange INTEGER NOT NULL,
      quantityBefore INTEGER NOT NULL,
      quantityAfter INTEGER NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      createdBy INTEGER NOT NULL,
      createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      costImpact DECIMAL(10,2)
    )
  `)
  console.log('✅ Created inventory_adjustments table')

  // Create inventory_alerts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_alerts (
      idAlert INTEGER PRIMARY KEY AUTOINCREMENT,
      idProduct INTEGER NOT NULL,
      idOption INTEGER,
      lowStockThreshold INTEGER NOT NULL DEFAULT 10,
      criticalStockThreshold INTEGER NOT NULL DEFAULT 5,
      reorderPoint INTEGER NOT NULL DEFAULT 20,
      reorderQuantity INTEGER NOT NULL DEFAULT 50,
      alertEnabled BOOLEAN DEFAULT 1,
      currentStockLevel INTEGER,
      lastAlertDate DATETIME,
      alertStatus VARCHAR(20) DEFAULT 'ok',
      preferredSupplier VARCHAR(200),
      supplierSKU VARCHAR(100),
      leadTimeDays INTEGER,
      autoReorderEnabled BOOLEAN DEFAULT 0,
      createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (idProduct, idOption)
    )
  `)
  console.log('✅ Created inventory_alerts table')

  // Create inventory_movement_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_movement_log (
      idMovement INTEGER PRIMARY KEY AUTOINCREMENT,
      idProduct INTEGER NOT NULL,
      idOption INTEGER,
      movementType VARCHAR(50) NOT NULL,
      quantityChange INTEGER NOT NULL,
      quantityBefore INTEGER NOT NULL,
      quantityAfter INTEGER NOT NULL,
      referenceType VARCHAR(50),
      referenceId INTEGER,
      performedBy INTEGER,
      performedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `)
  console.log('✅ Created inventory_movement_log table')

  // Create inventory_sequences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_sequences (
      sequenceName VARCHAR(50) PRIMARY KEY,
      currentValue INTEGER NOT NULL DEFAULT 0,
      prefix VARCHAR(20),
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✅ Created inventory_sequences table')

  // Seed sequences
  db.exec(`
    INSERT OR IGNORE INTO inventory_sequences (sequenceName, currentValue, prefix) 
    VALUES ('shipment_number', 0, 'SHIP-')
  `)
  console.log('✅ Seeded shipment sequence')

  console.log('\n✨ Inventory tables created successfully!\n')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  db.close()
}

