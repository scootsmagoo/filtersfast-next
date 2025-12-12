/**
 * Create Sample Product Options
 * This script creates sample option groups and options for testing
 * Run after initializing the product options schema
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');

function createSampleOptions() {
  console.log('Creating sample product options...');
  
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  try {
    const now = Date.now();
    
    // 1. Create "Size" option group
    const sizeGroupId = `og-${now}-size`;
    db.prepare(`
      INSERT INTO option_groups 
      (idOptionGroup, optionGroupDesc, optionReq, optionType, sizingLink, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sizeGroupId, 'Size', 'Y', 'S', 1, 1, now, now);
    
    console.log('✅ Created "Size" option group');
    
    // 2. Create size options
    const sizes = [
      { desc: '16x20x1', price: 0 },
      { desc: '20x25x1', price: 5.00 },
      { desc: '24x24x1', price: 10.00 },
      { desc: '16x25x4', price: 15.00 },
      { desc: '20x25x4', price: 20.00 },
    ];
    
    sizes.forEach((size, index) => {
      const optionId = `opt-${now}-size-${index}`;
      db.prepare(`
        INSERT INTO options 
        (idOption, optionDescrip, priceToAdd, percToAdd, sortOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(optionId, size.desc, size.price, 0, index + 1, now, now);
      
      // Link to size group
      db.prepare(`
        INSERT INTO option_group_xref (idOptionGroup, idOption)
        VALUES (?, ?)
      `).run(sizeGroupId, optionId);
    });
    
    console.log('✅ Created size options');
    
    // 3. Create "Pack Quantity" option group
    const packGroupId = `og-${now}-pack`;
    db.prepare(`
      INSERT INTO option_groups 
      (idOptionGroup, optionGroupDesc, optionReq, optionType, sizingLink, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(packGroupId, 'Pack Quantity', 'N', 'S', 0, 2, now, now);
    
    console.log('✅ Created "Pack Quantity" option group');
    
    // 4. Create pack quantity options
    const packs = [
      { desc: 'Single', price: 0 },
      { desc: '3-Pack', price: -5.00, perc: 5 }, // 5% discount
      { desc: '6-Pack', price: -10.00, perc: 10 }, // 10% discount
      { desc: '12-Pack', price: -25.00, perc: 15 }, // 15% discount
    ];
    
    packs.forEach((pack, index) => {
      const optionId = `opt-${now}-pack-${index}`;
      db.prepare(`
        INSERT INTO options 
        (idOption, optionDescrip, priceToAdd, percToAdd, sortOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(optionId, pack.desc, pack.price || 0, pack.perc || 0, index + 1, now, now);
      
      // Link to pack group
      db.prepare(`
        INSERT INTO option_group_xref (idOptionGroup, idOption)
        VALUES (?, ?)
      `).run(packGroupId, optionId);
    });
    
    console.log('✅ Created pack quantity options');
    
    // 5. Get first product to assign options to (if any exist)
    const product = db.prepare('SELECT id FROM products LIMIT 1').get() as { id?: string } | undefined;
    
    if (product && product.id) {
      // Assign size group to first product
      const pogId1 = `pog-${now}-1`;
      db.prepare(`
        INSERT INTO product_option_groups (id, idProduct, idOptionGroup, createdAt)
        VALUES (?, ?, ?, ?)
      `).run(pogId1, product.id, sizeGroupId, now);
      
      // Assign pack group to first product
      const pogId2 = `pog-${now}-2`;
      db.prepare(`
        INSERT INTO product_option_groups (id, idProduct, idOptionGroup, createdAt)
        VALUES (?, ?, ?, ?)
      `).run(pogId2, product.id, packGroupId, now);
      
      console.log(`✅ Assigned option groups to product: ${product.id}`);
      
      // Create inventory for first size option
      const firstSizeOption = `opt-${now}-size-0`;
      const invId = `poi-${now}-1`;
      db.prepare(`
        INSERT INTO product_option_inventory 
        (id, idProduct, idOption, stock, actualInventory, ignoreStock, unavailable, blocked, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(invId, product.id, firstSizeOption, 100, 100, 0, 0, 0, now, now);
      
      console.log(`✅ Created inventory for option: ${firstSizeOption}`);
    } else {
      console.log('⚠️  No products found. Create a product first, then assign options via admin UI or API.');
    }
    
    console.log('\n✅ Sample options created successfully!');
    console.log('\nTo view options on a product page:');
    console.log('1. Go to /admin/products and create or edit a product');
    console.log('2. Use the API or admin UI to assign option groups to products');
    console.log('3. Visit the product page at /products/[id]');
    console.log('\nOption Groups created:');
    console.log(`- Size (ID: ${sizeGroupId})`);
    console.log(`- Pack Quantity (ID: ${packGroupId})`);
    
  } catch (error) {
    console.error('❌ Error creating sample options:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

createSampleOptions();

