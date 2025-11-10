/**
 * Initialize Order Management Database Tables
 * Tables for e-commerce order processing and admin management
 */

import Database from 'better-sqlite3';

const mainDb = new Database('filtersfast.db');

console.log('📦 Initializing Order Management database tables...\n');

try {
  // Orders Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      
      -- Customer Information
      user_id TEXT,
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      is_guest INTEGER NOT NULL DEFAULT 0,
      
      -- Order Status
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'on-hold', 'failed')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially-refunded', 'voided')),
      shipping_status TEXT NOT NULL DEFAULT 'not-shipped' CHECK(shipping_status IN ('not-shipped', 'preparing', 'shipped', 'in-transit', 'out-for-delivery', 'delivered', 'failed-delivery', 'returned')),
      
      -- Pricing
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      shipping_cost REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total REAL NOT NULL,
      
      -- Addresses (JSON)
      shipping_address TEXT NOT NULL,
      billing_address TEXT,
      
      -- Payment Information
      payment_method TEXT NOT NULL CHECK(payment_method IN ('stripe', 'paypal', 'credit-card', 'net-terms', 'store-credit')),
      payment_intent_id TEXT,
      transaction_id TEXT,
      
      -- Shipping Information
      shipping_method TEXT,
      tracking_number TEXT,
      shipped_at INTEGER,
      delivered_at INTEGER,
      
      -- Discount & Promo
      promo_code TEXT,
      promo_discount REAL NOT NULL DEFAULT 0,
      
      -- Donation
      donation_amount REAL NOT NULL DEFAULT 0,
      donation_charity_id TEXT,
      
      -- Subscription
      is_subscription INTEGER NOT NULL DEFAULT 0,
      subscription_id TEXT,
      
      -- B2B
      is_b2b INTEGER NOT NULL DEFAULT 0,
      b2b_account_id TEXT,
      purchase_order_number TEXT,
      
      -- Metadata
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      source TEXT DEFAULT 'web',
      
      -- Notes
      customer_notes TEXT,
      internal_notes TEXT,
      
      -- Timestamps
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      cancelled_at INTEGER,
      refunded_at INTEGER,
      
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Created orders table');

  // Create indexes for orders
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_is_b2b ON orders(is_b2b);
    CREATE INDEX IF NOT EXISTS idx_orders_is_subscription ON orders(is_subscription);
  `);
  console.log('✅ Created orders indexes');

  // Order Items Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      
      -- Product Information
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      product_image TEXT,
      
      -- Variant Information
      variant_id TEXT,
      variant_name TEXT,
      
      -- Pricing
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      
      -- Fulfillment
      is_shipped INTEGER NOT NULL DEFAULT 0,
      shipped_quantity INTEGER NOT NULL DEFAULT 0,
      
      -- Metadata
      metadata TEXT,
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created order_items table');

  // Create indexes for order items
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
  `);
  console.log('✅ Created order_items indexes');

  // Order Gift Cards Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS order_gift_cards (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      gift_card_id TEXT,
      code TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      balance_before REAL,
      balance_after REAL,
      redeemed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Created order_gift_cards table');

  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_gift_cards_order ON order_gift_cards(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_gift_cards_code ON order_gift_cards(code);
  `);
  console.log('✅ Created order_gift_cards indexes');

  // Ensure metadata column exists for existing databases
  const orderItemsColumns = mainDb.prepare(`PRAGMA table_info(order_items)`).all() as Array<{ name: string }>;
  const hasMetadataColumn = orderItemsColumns.some(column => column.name === 'metadata');
  if (!hasMetadataColumn) {
    console.log('ℹ️ Adding metadata column to order_items table...');
    mainDb.exec(`ALTER TABLE order_items ADD COLUMN metadata TEXT`);
    console.log('✅ Added metadata column to order_items table');
  }

  // Order Notes Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS order_notes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      
      -- Note Information
      note TEXT NOT NULL,
      note_type TEXT NOT NULL CHECK(note_type IN ('customer', 'internal', 'system')),
      
      -- Author
      author_id TEXT,
      author_name TEXT NOT NULL,
      author_email TEXT,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created order_notes table');

  // Create index for order notes
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);
  `);
  console.log('✅ Created order_notes index');

  // Order History Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS order_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      
      -- Change Information
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      description TEXT NOT NULL,
      
      -- Author
      performed_by_id TEXT,
      performed_by_name TEXT NOT NULL,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created order_history table');

  // Create index for order history
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
  `);
  console.log('✅ Created order_history index');

  // Order Refunds Table
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS order_refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      
      -- Refund Information
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      refund_type TEXT NOT NULL CHECK(refund_type IN ('full', 'partial')),
      
      -- Payment Gateway
      payment_intent_id TEXT NOT NULL,
      refund_id TEXT NOT NULL,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'succeeded', 'failed')),
      
      -- Refunded Items (JSON array)
      refunded_items TEXT,
      
      -- Author
      processed_by_id TEXT,
      processed_by_name TEXT NOT NULL,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      processed_at INTEGER,
      
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created order_refunds table');

  // Create indexes for order refunds
  mainDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON order_refunds(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_refunds_status ON order_refunds(status);
  `);
  console.log('✅ Created order_refunds indexes');

  console.log('\n✅ Order Management tables initialized successfully!');
  console.log('\n📝 Created tables:');
  console.log('   - orders');
  console.log('   - order_items');
  console.log('   - order_notes');
  console.log('   - order_history');
  console.log('   - order_refunds');
  console.log('\n🎉 You can now use the order management system!');

} catch (error) {
  console.error('❌ Error initializing order management tables:', error);
  process.exit(1);
} finally {
  mainDb.close();
}

