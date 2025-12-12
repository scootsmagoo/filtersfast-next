import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');

console.log('🔧 Initializing Analytics & Reporting Dashboard...');

const db = new Database(dbPath);

try {
  // Check if orders table exists
  const tablesExist = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='orders'
  `).get();

  if (!tablesExist) {
    console.log('⚠️  Warning: Orders table does not exist.');
    console.log('   Analytics will work once you have order data.');
  }

  // Create analytics views for better performance
  console.log('Creating analytics views...');

  // Daily sales summary view
  db.exec(`
    CREATE VIEW IF NOT EXISTS daily_sales_summary AS
    SELECT 
      DATE(created_at) as sale_date,
      COUNT(*) as total_orders,
      SUM(total) as total_revenue,
      AVG(total) as avg_order_value,
      COUNT(DISTINCT user_id) as unique_customers
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
    GROUP BY DATE(created_at);
  `);

  // Monthly sales summary view
  db.exec(`
    CREATE VIEW IF NOT EXISTS monthly_sales_summary AS
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as total_orders,
      SUM(total) as total_revenue,
      AVG(total) as avg_order_value,
      COUNT(DISTINCT user_id) as unique_customers
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
    GROUP BY strftime('%Y-%m', created_at);
  `);

  // Product performance view
  db.exec(`
    CREATE VIEW IF NOT EXISTS product_performance AS
    SELECT 
      oi.product_id,
      p.name as product_name,
      p.sku,
      SUM(oi.quantity) as total_quantity_sold,
      SUM(oi.price * oi.quantity) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count,
      AVG(oi.price) as avg_price
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
    GROUP BY oi.product_id, p.name, p.sku;
  `);

  // Customer lifetime value view
  db.exec(`
    CREATE VIEW IF NOT EXISTS customer_lifetime_value AS
    SELECT 
      o.user_id,
      u.name as customer_name,
      u.email,
      COUNT(*) as total_orders,
      SUM(o.total) as lifetime_value,
      AVG(o.total) as avg_order_value,
      MIN(o.created_at) as first_order_date,
      MAX(o.created_at) as last_order_date
    FROM orders o
    LEFT JOIN user u ON u.id = o.user_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
    GROUP BY o.user_id, u.name, u.email;
  `);

  // Create indexes for better query performance
  console.log('Creating performance indexes...');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_created_at 
    ON orders(created_at);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
    ON orders(status, created_at);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id 
    ON orders(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
    ON order_items(product_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
    ON order_items(order_id);
  `);

  console.log('✅ Analytics views created successfully!');
  console.log('✅ Performance indexes created successfully!');
  console.log('');
  console.log('📊 Analytics Dashboard is ready!');
  console.log('   Navigate to: /admin/analytics');
  console.log('');
  console.log('Features Available:');
  console.log('  ✓ Real-time revenue and sales tracking');
  console.log('  ✓ Daily, weekly, monthly, quarterly, yearly reports');
  console.log('  ✓ Top products by quantity and revenue');
  console.log('  ✓ Top customers by orders and lifetime value');
  console.log('  ✓ Customer acquisition metrics');
  console.log('  ✓ Order status breakdown');
  console.log('  ✓ Revenue trend analysis');
  console.log('  ✓ Custom date range reports');
  console.log('  ✓ CSV export functionality');
  console.log('');
  console.log('API Endpoints Created:');
  console.log('  • GET /api/admin/analytics/summary');
  console.log('  • GET /api/admin/analytics/daily-sales');
  console.log('  • GET /api/admin/analytics/top-products');
  console.log('  • GET /api/admin/analytics/top-customers');
  console.log('  • GET /api/admin/analytics/revenue-by-period');
  console.log('  • GET /api/admin/analytics/order-status');
  console.log('  • GET /api/admin/analytics/customer-acquisition');
  console.log('');
  console.log('🎯 Pro Tip: Use the period selector to view different time ranges!');

} catch (error) {
  console.error('❌ Error initializing analytics:', error);
  process.exit(1);
} finally {
  db.close();
}

