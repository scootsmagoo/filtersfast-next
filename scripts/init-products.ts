/**
 * Initialize Products Database Schema
 * Creates all tables needed for product management system
 * 
 * Run: npx tsx scripts/init-products.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🚀 Initializing Products Database Schema...\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // ============================================================================
  // PRODUCTS TABLE
  // ============================================================================
  console.log('Creating products table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      
      -- Basic Information
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      
      -- Type & Classification
      type TEXT NOT NULL CHECK(type IN (
        'air-filter', 'water-filter', 'refrigerator-filter', 
        'humidifier-filter', 'pool-filter', 'gift-card', 'custom', 'accessory', 'other'
      )),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
        'active', 'draft', 'archived', 'out-of-stock'
      )),
      
      -- Pricing
      price REAL NOT NULL,
      compare_at_price REAL,
      cost_price REAL,
      
      -- Inventory
      track_inventory INTEGER DEFAULT 1,
      inventory_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      allow_backorder INTEGER DEFAULT 0,
      max_cart_qty INTEGER,
      
      -- Dimensions (JSON for flexibility)
      dimensions TEXT,  -- JSON: { height, width, depth, weight }
      merv_rating TEXT CHECK(merv_rating IN (
        '1-4', '5-7', '8', '9-12', '13', '14-16', '17-20', NULL
      )),
      
      -- Product Details (JSON arrays/objects)
      features TEXT,              -- JSON array of strings
      specifications TEXT,        -- JSON object
      compatible_models TEXT,     -- JSON array of strings
      
      -- Images (JSON array)
      images TEXT,               -- JSON array of image objects
      primary_image TEXT,
      
      -- Variants
      has_variants INTEGER DEFAULT 0,
      variants TEXT,             -- JSON array of variant objects
      
      -- Categories & Tags (JSON arrays)
      category_ids TEXT,         -- JSON array of category IDs
      tags TEXT,                 -- JSON array of tag strings
      
      -- SEO
      meta_title TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      
      -- Reviews
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      
      -- Flags & Badges
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_best_seller INTEGER DEFAULT 0,
      made_in_usa INTEGER DEFAULT 0,
      free_shipping INTEGER DEFAULT 0,
      badges TEXT,  -- JSON array
      ret_exclude INTEGER NOT NULL DEFAULT 0 CHECK(ret_exclude IN (0, 1, 2)),
      blocked_reason TEXT,
      
      -- Subscription
      subscription_eligible INTEGER DEFAULT 1,
      subscription_discount REAL DEFAULT 5.0,

      -- Gift With Purchase
      gift_with_purchase_product_id TEXT,
      gift_with_purchase_quantity INTEGER NOT NULL DEFAULT 1,
      gift_with_purchase_auto_add INTEGER NOT NULL DEFAULT 1,
      
      -- Related Products (JSON arrays)
      related_product_ids TEXT,
      cross_sell_product_ids TEXT,
      
      -- Shipping
      weight REAL DEFAULT 0,
      requires_shipping INTEGER DEFAULT 1,
      shipping_class TEXT,
      
      -- Metadata
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      published_at INTEGER,
      
      -- Stats (updated by triggers/cron)
      view_count INTEGER DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0
    );
  `);

  const productColumns = db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
  const productColumnNames = productColumns.map(column => column.name);

  if (!productColumnNames.includes('gift_with_purchase_product_id')) {
    console.log('Adding gift_with_purchase_product_id column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN gift_with_purchase_product_id TEXT`);
  }

  if (!productColumnNames.includes('gift_with_purchase_quantity')) {
    console.log('Adding gift_with_purchase_quantity column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN gift_with_purchase_quantity INTEGER NOT NULL DEFAULT 1`);
  }

  if (!productColumnNames.includes('gift_with_purchase_auto_add')) {
    console.log('Adding gift_with_purchase_auto_add column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN gift_with_purchase_auto_add INTEGER NOT NULL DEFAULT 1`);
  }

  if (!productColumnNames.includes('ret_exclude')) {
    console.log('Adding ret_exclude column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN ret_exclude INTEGER NOT NULL DEFAULT 0`);
  }

  if (!productColumnNames.includes('blocked_reason')) {
    console.log('Adding blocked_reason column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN blocked_reason TEXT`);
  }

  if (!productColumnNames.includes('max_cart_qty')) {
    console.log('Adding max_cart_qty column to products table...');
    db.exec(`ALTER TABLE products ADD COLUMN max_cart_qty INTEGER`);
  }

  db.exec(`UPDATE products SET gift_with_purchase_quantity = 1 WHERE gift_with_purchase_quantity IS NULL`);
  db.exec(`UPDATE products SET gift_with_purchase_auto_add = 1 WHERE gift_with_purchase_auto_add IS NULL`);

  // ============================================================================
  // PRODUCT CATEGORIES TABLE
  // ============================================================================
  console.log('Creating product_categories table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL
    );
  `);

  // ============================================================================
  // PRODUCT HISTORY TABLE (Audit Log)
  // ============================================================================
  console.log('Creating product_history table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN (
        'created', 'updated', 'status-changed', 'price-changed', 
        'inventory-adjusted', 'deleted'
      )),
      changes TEXT,  -- JSON object with old/new values
      performed_by TEXT NOT NULL,
      performed_by_name TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // ============================================================================
  // PRODUCT VIEWS TABLE (Analytics)
  // ============================================================================
  console.log('Creating product_views table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_views (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT,
      session_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      viewed_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // ============================================================================
  // INDEXES
  // ============================================================================
  console.log('Creating indexes...');
  
  db.exec(`
    -- Products indexes
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);
    CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(inventory_quantity);
    
    -- Categories indexes
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON product_categories(slug);
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_categories_active ON product_categories(is_active);
    
    -- History indexes
    CREATE INDEX IF NOT EXISTS idx_history_product ON product_history(product_id);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON product_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_history_action ON product_history(action);
    
    -- Views indexes
    CREATE INDEX IF NOT EXISTS idx_views_product ON product_views(product_id);
    CREATE INDEX IF NOT EXISTS idx_views_timestamp ON product_views(viewed_at);
    CREATE INDEX IF NOT EXISTS idx_views_user ON product_views(user_id);
  `);

  // ============================================================================
  // SEED DEFAULT CATEGORIES
  // ============================================================================
  console.log('Seeding default categories...');
  
  const now = Date.now();
  const categories = [
    { id: 'cat-air', name: 'Air Filters', slug: 'air-filters', description: 'HVAC and furnace air filters' },
    { id: 'cat-water', name: 'Water Filters', slug: 'water-filters', description: 'Drinking water filtration' },
    { id: 'cat-fridge', name: 'Refrigerator Filters', slug: 'refrigerator-filters', description: 'Fridge water filters' },
    { id: 'cat-humid', name: 'Humidifier Filters', slug: 'humidifier-filters', description: 'Humidifier pads and filters' },
    { id: 'cat-pool', name: 'Pool & Spa Filters', slug: 'pool-spa-filters', description: 'Pool and spa filtration' },
    { id: 'cat-access', name: 'Accessories', slug: 'accessories', description: 'Tools and accessories' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO product_categories 
    (id, name, slug, description, parent_id, sort_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, 1, ?, ?)
  `);

  categories.forEach((cat, index) => {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.description, index, now, now);
  });

  console.log(`✅ Seeded ${categories.length} default categories\n`);

  // ============================================================================
  // SEED SAMPLE PRODUCTS
  // ============================================================================
  console.log('Seeding sample products...');
  
  const sampleProducts = [
    {
      id: 'prod-1',
      name: 'FiltersFast® MERV 13 Air Filter 16x25x1 (6-Pack)',
      slug: 'merv-13-air-filter-16x25x1-6pack',
      sku: 'FF-M13-16251-6PK',
      brand: 'FiltersFast',
      description: 'Premium MERV 13 air filter that captures 98% of airborne particles including smoke, smog, bacteria, and virus carriers. Made in USA with 100% synthetic media. Perfect for residential HVAC systems.',
      short_description: 'Premium MERV 13 filtration, 98% particle capture, Made in USA',
      type: 'air-filter',
      status: 'active',
      price: 69.99,
      compare_at_price: 89.99,
      cost_price: 35.00,
      inventory_quantity: 250,
      max_cart_qty: 6,
      dimensions: JSON.stringify({ height: 16, width: 25, depth: 1, weight: 1.2 }),
      merv_rating: '13',
      features: JSON.stringify([
        '98% particle capture efficiency',
        'MERV 13 rated filtration',
        'Made in USA',
        '100% synthetic media',
        'Electrostatically charged',
        'Captures smoke, smog, bacteria',
        'Lasts up to 3 months',
        '6-pack value bundle'
      ]),
      specifications: JSON.stringify({
        'Actual Size': '15.5" x 24.5" x 0.75"',
        'Nominal Size': '16x25x1',
        'MERV Rating': '13',
        'Material': '100% Synthetic',
        'Frame': 'Beverage board',
        'Lifespan': '90 days',
        'Made In': 'USA'
      }),
      compatible_models: JSON.stringify([]),
      images: JSON.stringify([
        { url: '/images/products/air-filter-merv13.jpg', alt: 'MERV 13 Air Filter', isPrimary: true, sortOrder: 0 }
      ]),
      primary_image: '/images/products/air-filter-merv13.jpg',
      category_ids: JSON.stringify(['cat-air']),
      tags: JSON.stringify(['merv-13', 'made-in-usa', 'best-seller', '6-pack']),
      is_featured: 1,
      is_best_seller: 1,
      made_in_usa: 1,
      free_shipping: 1,
      rating: 4.8,
      review_count: 342,
      subscription_eligible: 1,
      subscription_discount: 5.0,
      weight: 7.2,
      created_at: now,
      updated_at: now
    },
    {
      id: 'prod-2',
      name: 'Whirlpool EDR1RXD1 Refrigerator Water Filter',
      slug: 'whirlpool-edr1rxd1-water-filter',
      sku: 'WH-EDR1RXD1',
      brand: 'Whirlpool',
      description: 'Genuine Whirlpool refrigerator water filter. NSF 42 certified to reduce chlorine taste and odor. Compatible with most side-by-side Whirlpool refrigerators. Lasts up to 6 months or 200 gallons.',
      short_description: 'Genuine Whirlpool filter, NSF 42 certified, 6-month lifespan',
      type: 'refrigerator-filter',
      status: 'active',
      price: 44.99,
      compare_at_price: 59.99,
      cost_price: 22.00,
      inventory_quantity: 180,
      max_cart_qty: 3,
      dimensions: JSON.stringify({ height: 8.5, width: 2.5, depth: 2.5, weight: 0.5 }),
      merv_rating: null,
      features: JSON.stringify([
        'NSF 42 certified',
        'Reduces chlorine taste and odor',
        'Genuine Whirlpool part',
        'Lasts up to 6 months',
        '200 gallon capacity',
        'Easy twist-and-lock installation',
        'Compatible with multiple models'
      ]),
      specifications: JSON.stringify({
        'Part Number': 'EDR1RXD1',
        'Certification': 'NSF 42',
        'Capacity': '200 gallons',
        'Lifespan': '6 months',
        'Reduces': 'Chlorine taste and odor',
        'Installation': 'Twist-and-lock'
      }),
      compatible_models: JSON.stringify([
        'WRS325FDAM', 'WRS588FIHZ', 'WRS571CIHZ', 'WRS335SDHM'
      ]),
      images: JSON.stringify([
        { url: '/images/products/whirlpool-filter.jpg', alt: 'Whirlpool Water Filter', isPrimary: true, sortOrder: 0 }
      ]),
      primary_image: '/images/products/whirlpool-filter.jpg',
      category_ids: JSON.stringify(['cat-fridge']),
      tags: JSON.stringify(['nsf-certified', 'whirlpool', 'genuine']),
      is_featured: 0,
      is_best_seller: 1,
      made_in_usa: 0,
      free_shipping: 0,
      rating: 4.6,
      review_count: 156,
      subscription_eligible: 1,
      subscription_discount: 5.0,
      weight: 0.5,
      created_at: now,
      updated_at: now
    },
    {
      id: 'prod-3',
      name: 'Aprilaire 600 Humidifier Water Panel Filter (2-Pack)',
      slug: 'aprilaire-600-humidifier-filter-2pack',
      sku: 'AP-600-2PK',
      brand: 'Aprilaire',
      description: 'Genuine Aprilaire replacement water panel filter for model 600 series humidifiers. Premium aluminum mesh construction ensures maximum water absorption and humidification efficiency. Replace annually for optimal performance.',
      short_description: 'Genuine Aprilaire filter, aluminum mesh, annual replacement',
      type: 'humidifier-filter',
      status: 'active',
      price: 32.99,
      compare_at_price: 39.99,
      cost_price: 16.00,
      inventory_quantity: 95,
      max_cart_qty: null,
      dimensions: JSON.stringify({ height: 10, width: 13, depth: 1.75, weight: 0.8 }),
      merv_rating: null,
      features: JSON.stringify([
        'Genuine Aprilaire part',
        'Aluminum mesh construction',
        'Maximum water absorption',
        'Annual replacement recommended',
        'Easy installation',
        '2-pack value',
        'Compatible with 600 series'
      ]),
      specifications: JSON.stringify({
        'Part Number': '600',
        'Compatibility': 'Aprilaire 600 series',
        'Material': 'Aluminum mesh',
        'Dimensions': '10" x 13" x 1.75"',
        'Lifespan': '12 months',
        'Pack Size': '2 filters'
      }),
      compatible_models: JSON.stringify([
        'Model 600', 'Model 600A', 'Model 600M'
      ]),
      images: JSON.stringify([
        { url: '/images/products/aprilaire-600.jpg', alt: 'Aprilaire 600 Filter', isPrimary: true, sortOrder: 0 }
      ]),
      primary_image: '/images/products/aprilaire-600.jpg',
      category_ids: JSON.stringify(['cat-humid']),
      tags: JSON.stringify(['aprilaire', 'humidifier', '2-pack']),
      is_featured: 0,
      is_best_seller: 0,
      made_in_usa: 1,
      free_shipping: 0,
      rating: 4.7,
      review_count: 78,
      subscription_eligible: 1,
      subscription_discount: 10.0,
      weight: 1.6,
      created_at: now,
      updated_at: now
    }
  ];

  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, slug, sku, brand, description, short_description, type, status,
      price, compare_at_price, cost_price, track_inventory, inventory_quantity, low_stock_threshold, allow_backorder, max_cart_qty,
      dimensions, merv_rating, features, specifications, compatible_models,
      images, primary_image, has_variants, variants, category_ids, tags,
      meta_title, meta_description, meta_keywords,
      rating, review_count, is_featured, is_new, is_best_seller, made_in_usa, free_shipping, badges,
      ret_exclude, blocked_reason,
      subscription_eligible, subscription_discount,
      gift_with_purchase_product_id, gift_with_purchase_quantity, gift_with_purchase_auto_add,
      related_product_ids, cross_sell_product_ids,
      weight, requires_shipping, shipping_class,
      created_at, updated_at, created_by, updated_by, published_at,
      view_count, order_count, revenue
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  sampleProducts.forEach((product) => {
    insertProduct.run(
      product.id, product.name, product.slug, product.sku, product.brand,
      product.description, product.short_description, product.type, product.status,
      product.price, product.compare_at_price, product.cost_price, 1, product.inventory_quantity, 10, 0, product.max_cart_qty ?? null,
      product.dimensions, product.merv_rating, product.features, product.specifications, product.compatible_models,
      product.images, product.primary_image, 0, '[]', product.category_ids, product.tags,
      product.name, product.short_description, null,
      product.rating, product.review_count, product.is_featured, 0, product.is_best_seller, product.made_in_usa, product.free_shipping, '[]',
      0, null,
      product.subscription_eligible, product.subscription_discount,
      null, 1, 1,
      '[]', '[]',
      product.weight, 1, null,
      product.created_at, product.updated_at, 'seed-script', 'seed-script', product.status === 'active' ? product.created_at : null,
      0, 0, 0
    );
  });

  console.log(`✅ Seeded ${sampleProducts.length} sample products\n`);

  console.log('✅ Products database schema initialized successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Products table with comprehensive fields');
  console.log('   - Product categories with hierarchy support');
  console.log('   - Product history for audit trail');
  console.log('   - Product views for analytics');
  console.log(`   - ${categories.length} default categories`);
  console.log(`   - ${sampleProducts.length} sample products\n`);

} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
} finally {
  db.close();
}

