/**
 * Initialize Multi-Language (i18n) Support
 * Creates tables for languages, translations, and content localization
 * Supports: English (EN), Spanish (ES), French (FR), French Canadian (FR-CA)
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'filtersfast.db');
const db = new Database(dbPath);

console.log('🌍 Initializing Multi-Language Support...');

try {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Languages table - Supported languages
  console.log('Creating languages table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      flag_emoji TEXT NOT NULL,
      direction TEXT DEFAULT 'ltr' CHECK(direction IN ('ltr', 'rtl')),
      is_active INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 2. Translations table - UI text translations
  console.log('Creating translations table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      language_code TEXT NOT NULL,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      context TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
      UNIQUE(key, language_code)
    )
  `);

  // 3. Product translations table
  console.log('Creating product_translations table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      language_code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      features TEXT,
      specifications TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
      UNIQUE(product_id, language_code)
    )
  `);

  // 4. Category translations table
  console.log('Creating category_translations table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      language_code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
      UNIQUE(category_id, language_code)
    )
  `);

  // 5. Content translations table - For pages, articles, support content
  console.log('Creating content_translations table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL CHECK(content_type IN ('page', 'article', 'support', 'email', 'sms', 'other')),
      language_code TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      slug TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
      UNIQUE(content_id, content_type, language_code)
    )
  `);

  // Create indexes for better query performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
    CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language_code);
    CREATE INDEX IF NOT EXISTS idx_translations_category ON translations(category);
    CREATE INDEX IF NOT EXISTS idx_product_translations_product ON product_translations(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_translations_lang ON product_translations(language_code);
    CREATE INDEX IF NOT EXISTS idx_category_translations_category ON category_translations(category_id);
    CREATE INDEX IF NOT EXISTS idx_category_translations_lang ON category_translations(language_code);
    CREATE INDEX IF NOT EXISTS idx_content_translations_content ON content_translations(content_id, content_type);
    CREATE INDEX IF NOT EXISTS idx_content_translations_lang ON content_translations(language_code);
  `);

  // Insert supported languages
  console.log('Inserting supported languages...');
  const insertLanguage = db.prepare(`
    INSERT OR REPLACE INTO languages (code, name, native_name, flag_emoji, is_active, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const languages = [
    { code: 'en', name: 'English', native_name: 'English', flag: '🇺🇸', active: 1, default: 1 },
    { code: 'es', name: 'Spanish', native_name: 'Español', flag: '🇪🇸', active: 1, default: 0 },
    { code: 'fr', name: 'French', native_name: 'Français', flag: '🇫🇷', active: 1, default: 0 },
    { code: 'fr-ca', name: 'French (Canada)', native_name: 'Français (Canada)', flag: '🇨🇦', active: 1, default: 0 }
  ];

  for (const lang of languages) {
    insertLanguage.run(lang.code, lang.name, lang.native_name, lang.flag, lang.active, lang.default);
    console.log(`  ✓ Added ${lang.name} (${lang.code})`);
  }

  // Insert base English translations
  console.log('Inserting base English translations...');
  const insertTranslation = db.prepare(`
    INSERT OR REPLACE INTO translations (key, language_code, value, category)
    VALUES (?, ?, ?, ?)
  `);

  const baseTranslations = [
    // Navigation
    { key: 'nav.home', value: 'Home', category: 'navigation' },
    { key: 'nav.shop', value: 'Shop', category: 'navigation' },
    { key: 'nav.products', value: 'Products', category: 'navigation' },
    { key: 'nav.categories', value: 'Categories', category: 'navigation' },
    { key: 'nav.account', value: 'Account', category: 'navigation' },
    { key: 'nav.cart', value: 'Cart', category: 'navigation' },
    { key: 'nav.search', value: 'Search', category: 'navigation' },
    { key: 'nav.sign_in', value: 'Sign In', category: 'navigation' },
    { key: 'nav.sign_up', value: 'Sign Up', category: 'navigation' },
    { key: 'nav.sign_out', value: 'Sign Out', category: 'navigation' },

    // Common Actions
    { key: 'action.add_to_cart', value: 'Add to Cart', category: 'actions' },
    { key: 'action.buy_now', value: 'Buy Now', category: 'actions' },
    { key: 'action.checkout', value: 'Checkout', category: 'actions' },
    { key: 'action.continue_shopping', value: 'Continue Shopping', category: 'actions' },
    { key: 'action.save', value: 'Save', category: 'actions' },
    { key: 'action.cancel', value: 'Cancel', category: 'actions' },
    { key: 'action.edit', value: 'Edit', category: 'actions' },
    { key: 'action.delete', value: 'Delete', category: 'actions' },
    { key: 'action.submit', value: 'Submit', category: 'actions' },
    { key: 'action.update', value: 'Update', category: 'actions' },
    { key: 'action.apply', value: 'Apply', category: 'actions' },
    { key: 'action.search', value: 'Search', category: 'actions' },

    // Product
    { key: 'product.price', value: 'Price', category: 'product' },
    { key: 'product.quantity', value: 'Quantity', category: 'product' },
    { key: 'product.in_stock', value: 'In Stock', category: 'product' },
    { key: 'product.out_of_stock', value: 'Out of Stock', category: 'product' },
    { key: 'product.sku', value: 'SKU', category: 'product' },
    { key: 'product.description', value: 'Description', category: 'product' },
    { key: 'product.features', value: 'Features', category: 'product' },
    { key: 'product.specifications', value: 'Specifications', category: 'product' },
    { key: 'product.reviews', value: 'Reviews', category: 'product' },

    // Cart
    { key: 'cart.your_cart', value: 'Your Cart', category: 'cart' },
    { key: 'cart.empty', value: 'Your cart is empty', category: 'cart' },
    { key: 'cart.subtotal', value: 'Subtotal', category: 'cart' },
    { key: 'cart.tax', value: 'Tax', category: 'cart' },
    { key: 'cart.shipping', value: 'Shipping', category: 'cart' },
    { key: 'cart.total', value: 'Total', category: 'cart' },
    { key: 'cart.item_added', value: 'Item added to cart', category: 'cart' },
    { key: 'cart.item_removed', value: 'Item removed from cart', category: 'cart' },

    // Account
    { key: 'account.profile', value: 'Profile', category: 'account' },
    { key: 'account.orders', value: 'Orders', category: 'account' },
    { key: 'account.settings', value: 'Settings', category: 'account' },
    { key: 'account.email', value: 'Email', category: 'account' },
    { key: 'account.password', value: 'Password', category: 'account' },
    { key: 'account.change_password', value: 'Change Password', category: 'account' },

    // Checkout
    { key: 'checkout.shipping_address', value: 'Shipping Address', category: 'checkout' },
    { key: 'checkout.billing_address', value: 'Billing Address', category: 'checkout' },
    { key: 'checkout.payment_method', value: 'Payment Method', category: 'checkout' },
    { key: 'checkout.review_order', value: 'Review Order', category: 'checkout' },
    { key: 'checkout.place_order', value: 'Place Order', category: 'checkout' },

    // Messages
    { key: 'message.success', value: 'Success!', category: 'messages' },
    { key: 'message.error', value: 'Error', category: 'messages' },
    { key: 'message.warning', value: 'Warning', category: 'messages' },
    { key: 'message.info', value: 'Information', category: 'messages' },

    // Forms
    { key: 'form.first_name', value: 'First Name', category: 'forms' },
    { key: 'form.last_name', value: 'Last Name', category: 'forms' },
    { key: 'form.email', value: 'Email', category: 'forms' },
    { key: 'form.phone', value: 'Phone', category: 'forms' },
    { key: 'form.address', value: 'Address', category: 'forms' },
    { key: 'form.city', value: 'City', category: 'forms' },
    { key: 'form.state', value: 'State', category: 'forms' },
    { key: 'form.zip', value: 'ZIP Code', category: 'forms' },
    { key: 'form.country', value: 'Country', category: 'forms' },

    // Categories
    { key: 'category.air_filters', value: 'Air Filters', category: 'categories' },
    { key: 'category.water_filters', value: 'Water Filters', category: 'categories' },
    { key: 'category.refrigerator_filters', value: 'Refrigerator Filters', category: 'categories' },
    { key: 'category.pool_filters', value: 'Pool Filters', category: 'categories' },
    { key: 'category.humidifier_filters', value: 'Humidifier Filters', category: 'categories' },
  ];

  for (const trans of baseTranslations) {
    insertTranslation.run(trans.key, 'en', trans.value, trans.category);
  }

  console.log(`  ✓ Inserted ${baseTranslations.length} base English translations`);

  console.log('\n✅ Multi-Language Support initialized successfully!');
  console.log('\n📝 Next steps:');
  console.log('  1. Run translation generation scripts to populate ES, FR, FR-CA translations');
  console.log('  2. Add language selector to Header component');
  console.log('  3. Access admin panel at /admin/translations to manage translations');
  console.log('  4. Use the translation helper functions in your components');
  console.log('\n🌍 Supported Languages:');
  console.log('  • English (en) - Default');
  console.log('  • Spanish (es)');
  console.log('  • French (fr)');
  console.log('  • French Canadian (fr-ca)');

} catch (error) {
  console.error('❌ Error initializing multi-language support:', error);
  throw error;
} finally {
  db.close();
}


