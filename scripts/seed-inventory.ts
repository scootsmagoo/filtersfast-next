/**
 * Seed Inventory Data
 * Creates sample shipments and inventory data for testing
 */

import Database from 'better-sqlite3'

const db = new Database('filtersfast.db')

console.log('🌱 Seeding Inventory Data...\n')

try {
  // We'll create shipments without linking to specific products for now
  console.log('📦 Creating sample shipments...')

  // Create sample shipments
  const shipments = [
    {
      shipmentNumber: 'SHIP-000001',
      supplierName: 'ABC Filter Supply Co.',
      supplierPO: 'PO-2025-001',
      status: 'received',
      expectedDate: '2025-10-15',
      receivedDate: '2025-10-17',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      totalItems: 100,
      totalCost: 599.00,
      notes: 'Received in good condition'
    },
    {
      shipmentNumber: 'SHIP-000002',
      supplierName: 'FilterMaster Distributors',
      supplierPO: 'PO-2025-002',
      status: 'in_transit',
      expectedDate: '2025-11-10',
      trackingNumber: 'FDX987654321',
      carrier: 'FedEx',
      totalItems: 50,
      totalCost: 299.50,
      notes: 'Expected delivery next week'
    },
    {
      shipmentNumber: 'SHIP-000003',
      supplierName: 'Premium Filters Inc.',
      supplierPO: 'PO-2025-003',
      status: 'pending',
      expectedDate: '2025-11-20',
      totalItems: 75,
      totalCost: 450.00,
      notes: 'Waiting for supplier confirmation'
    },
    {
      shipmentNumber: 'SHIP-000004',
      supplierName: 'Global Filter Warehouse',
      supplierPO: 'PO-2025-004',
      status: 'pending',
      expectedDate: '2025-11-15',
      trackingNumber: null,
      carrier: null,
      totalItems: 200,
      totalCost: 1200.00,
      notes: 'Bulk order - special pricing'
    }
  ]

  const insertShipment = db.prepare(`
    INSERT INTO inventory_shipments (
      shipmentNumber, supplierName, supplierPO, status, expectedDate,
      receivedDate, trackingNumber, carrier, totalItems, totalCost, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  shipments.forEach(s => {
    try {
      insertShipment.run(
        s.shipmentNumber,
        s.supplierName,
        s.supplierPO,
        s.status,
        s.expectedDate,
        s.receivedDate || null,
        s.trackingNumber || null,
        s.carrier || null,
        s.totalItems,
        s.totalCost,
        s.notes
      )
      console.log(`✅ Created shipment: ${s.shipmentNumber} (${s.status})`)
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        console.log(`⏭️  Skipped ${s.shipmentNumber} (already exists)`)
      } else {
        throw error
      }
    }
  })

  // Note: Shipment items can be added later when linking to actual products

  // Update sequence
  db.prepare(`
    UPDATE inventory_sequences 
    SET currentValue = 4
    WHERE sequenceName = 'shipment_number'
  `).run()

  console.log('\n✨ Inventory data seeded successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${shipments.length} sample shipments created`)
  console.log('   - Sample items added to shipments')
  console.log('\n🚀 Navigate to /admin/products/shipments to view!')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}

