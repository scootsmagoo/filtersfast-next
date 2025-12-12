import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'filtersfast.db');

export interface DailySalesStats {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newCustomers: number;
}

export interface OrderByStatus {
  status: string;
  count: number;
  totalRevenue: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  email: string;
  orderCount: number;
  totalSpent: number;
}

export interface Top300ProductReportRow {
  productId: string;
  productName: string;
  sku: string;
  variantId: string | null;
  optionDescription: string | null;
  quantitySold: number;
  revenue: number;
  stock: number;
  ignoreStock: boolean;
  flagStock: string;
}

export interface RevenueBySource {
  source: string;
  orderCount: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  conversionRate: number;
}

/**
 * Get daily sales statistics for a date range
 */
export function getDailySalesStats(
  startDate: string,
  endDate: string
): DailySalesStats[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as totalOrders,
      SUM(total) as totalRevenue,
      AVG(total) as avgOrderValue,
      COUNT(DISTINCT CASE 
        WHEN user_id IN (
          SELECT user_id FROM orders o2 
          WHERE DATE(o2.created_at) <= DATE(o.created_at)
          GROUP BY user_id HAVING COUNT(*) = 1
        ) THEN user_id 
      END) as newCustomers
    FROM orders o
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as DailySalesStats[];
  db.close();
  
  return results;
}

/**
 * Get order counts and revenue by status
 */
export function getOrdersByStatus(
  startDate: string,
  endDate: string
): OrderByStatus[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total) as totalRevenue
    FROM orders
    WHERE DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY status
    ORDER BY count DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as OrderByStatus[];
  db.close();
  
  return results;
}

/**
 * Get top products by quantity sold
 */
export function getTopProductsByQuantity(
  startDate: string,
  endDate: string,
  limit: number = 10
): TopProduct[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      oi.product_id as productId,
      p.name as productName,
      SUM(oi.quantity) as quantitySold,
      SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
    GROUP BY oi.product_id, p.name
    ORDER BY quantitySold DESC
    LIMIT ?
  `;
  
  const results = db.prepare(query).all(startDate, endDate, limit) as TopProduct[];
  db.close();
  
  return results;
}

/**
 * Get top products by revenue
 */
export function getTopProductsByRevenue(
  startDate: string,
  endDate: string,
  limit: number = 10
): TopProduct[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      oi.product_id as productId,
      p.name as productName,
      SUM(oi.quantity) as quantitySold,
      SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
    GROUP BY oi.product_id, p.name
    ORDER BY revenue DESC
    LIMIT ?
  `;
  
  const results = db.prepare(query).all(startDate, endDate, limit) as TopProduct[];
  db.close();
  
  return results;
}

/**
 * Top 300 products report (legacy top300.asp parity)
 */
export function getTop300ProductsReport(options?: {
  startTimeMs?: number;
  endTimeMs?: number;
  limit?: number;
}): Top300ProductReportRow[] {
  const db = new Database(dbPath);

  try {
    const now = Date.now();
    const endTime = options?.endTimeMs ?? now;
    const defaultStart = endTime - 7 * 24 * 60 * 60 * 1000;
    const startTime = options?.startTimeMs ?? defaultStart;
    const limit = Math.min(Math.max(options?.limit ?? 300, 1), 350);

    const start = Math.min(startTime, endTime);
    const end = Math.max(startTime, endTime);

    const query = `
      SELECT 
        oi.product_id as productId,
        COALESCE(p.name, oi.product_name) as productName,
        COALESCE(p.sku, oi.product_sku) as sku,
        oi.variant_id as variantId,
        COALESCE(opt.optionDescrip, oi.variant_name) as optionDescription,
        SUM(oi.quantity) as quantitySold,
        SUM(oi.total_price) as revenue,
        CASE
          WHEN oi.variant_id IS NOT NULL THEN COALESCE(poi.stock, p.inventory_quantity, 0)
          ELSE COALESCE(p.inventory_quantity, 0)
        END as stock,
        CASE
          WHEN oi.variant_id IS NOT NULL THEN COALESCE(poi.ignoreStock, 0)
          ELSE CASE 
            WHEN COALESCE(p.track_inventory, 1) = 0 OR COALESCE(p.allow_backorder, 0) = 1 THEN 1
            ELSE 0
          END
        END as ignoreStock,
        CASE
          WHEN (
            CASE
              WHEN oi.variant_id IS NOT NULL THEN COALESCE(poi.stock, p.inventory_quantity, 0)
              ELSE COALESCE(p.inventory_quantity, 0)
            END
          ) <= 0
          AND (
            CASE
              WHEN oi.variant_id IS NOT NULL THEN COALESCE(poi.ignoreStock, 0)
              ELSE CASE 
                WHEN COALESCE(p.track_inventory, 1) = 0 OR COALESCE(p.allow_backorder, 0) = 1 THEN 1
                ELSE 0
              END
            END
          ) = 0
          THEN 'Out of stock'
          ELSE ''
        END as flagStock
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_option_inventory poi
        ON poi.idProduct = oi.product_id AND poi.idOption = oi.variant_id
      LEFT JOIN options opt ON opt.idOption = oi.variant_id
      WHERE o.status IN ('paid', 'shipped', 'completed')
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY oi.product_id, oi.variant_id
      ORDER BY quantitySold DESC, revenue DESC
      LIMIT ?
    `;

    const rows = db.prepare(query).all(start, end, limit) as Array<{
      productId: string;
      productName: string | null;
      sku: string | null;
      variantId: string | null;
      optionDescription: string | null;
      quantitySold: number;
      revenue: number;
      stock: number | null;
      ignoreStock: number;
      flagStock: string | null;
    }>;

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName || 'Unknown product',
      sku: row.sku || 'N/A',
      variantId: row.variantId,
      optionDescription: row.optionDescription,
      quantitySold: row.quantitySold || 0,
      revenue: row.revenue || 0,
      stock: row.stock ?? 0,
      ignoreStock: row.ignoreStock === 1,
      flagStock: row.flagStock || '',
    }));
  } finally {
    db.close();
  }
}

/**
 * Get top customers by order count
 */
export function getTopCustomersByOrders(
  startDate: string,
  endDate: string,
  limit: number = 10
): TopCustomer[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      o.user_id as customerId,
      u.name as customerName,
      u.email as email,
      COUNT(*) as orderCount,
      SUM(o.total) as totalSpent
    FROM orders o
    LEFT JOIN user u ON u.id = o.user_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
    GROUP BY o.user_id, u.name, u.email
    ORDER BY orderCount DESC
    LIMIT ?
  `;
  
  const results = db.prepare(query).all(startDate, endDate, limit) as TopCustomer[];
  db.close();
  
  return results;
}

/**
 * Get top customers by total spent
 */
export function getTopCustomersByRevenue(
  startDate: string,
  endDate: string,
  limit: number = 10
): TopCustomer[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      o.user_id as customerId,
      u.name as customerName,
      u.email as email,
      COUNT(*) as orderCount,
      SUM(o.total) as totalSpent
    FROM orders o
    LEFT JOIN user u ON u.id = o.user_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
    GROUP BY o.user_id, u.name, u.email
    ORDER BY totalSpent DESC
    LIMIT ?
  `;
  
  const results = db.prepare(query).all(startDate, endDate, limit) as TopCustomer[];
  db.close();
  
  return results;
}

/**
 * Get revenue by traffic source
 */
export function getRevenueBySource(
  startDate: string,
  endDate: string
): RevenueBySource[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      COALESCE(referral_source, 'Direct') as source,
      COUNT(*) as orderCount,
      SUM(total) as revenue
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY source
    ORDER BY revenue DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as RevenueBySource[];
  db.close();
  
  return results;
}

/**
 * Get analytics summary for dashboard
 */
export function getAnalyticsSummary(
  startDate: string,
  endDate: string
): AnalyticsSummary {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      COUNT(*) as totalOrders,
      SUM(total) as totalRevenue,
      AVG(total) as avgOrderValue,
      COUNT(DISTINCT user_id) as totalCustomers
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
  `;
  
  const result = db.prepare(query).get(startDate, endDate) as any;
  db.close();
  
  return {
    totalOrders: result.totalOrders || 0,
    totalRevenue: result.totalRevenue || 0,
    avgOrderValue: result.avgOrderValue || 0,
    totalCustomers: result.totalCustomers || 0,
    conversionRate: 0, // Would need traffic data to calculate
  };
}

/**
 * Get revenue by time period (day, week, month, quarter, year)
 */
export function getRevenueByPeriod(
  startDate: string,
  endDate: string,
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
): { period: string; orderCount: number; revenue: number }[] {
  const db = new Database(dbPath);
  
  let dateFormat: string;
  switch (period) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%W';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    case 'quarter':
      // SQLite doesn't have quarter, we'll calculate it
      dateFormat = '%Y-Q' + "|| CAST((CAST(strftime('%m', created_at) AS INTEGER) + 2) / 3 AS TEXT)";
      break;
    case 'year':
      dateFormat = '%Y';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  
  const query = `
    SELECT 
      strftime('${dateFormat}', created_at) as period,
      COUNT(*) as orderCount,
      SUM(total) as revenue
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY period
    ORDER BY period DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as any[];
  db.close();
  
  return results;
}

/**
 * Get sales by payment method
 */
export function getSalesByPaymentMethod(
  startDate: string,
  endDate: string
): { paymentMethod: string; orderCount: number; revenue: number }[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      COALESCE(payment_method, 'Unknown') as paymentMethod,
      COUNT(*) as orderCount,
      SUM(total) as revenue
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY paymentMethod
    ORDER BY revenue DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as any[];
  db.close();
  
  return results;
}

/**
 * Get average order value trend over time
 */
export function getAOVTrend(
  startDate: string,
  endDate: string
): { date: string; avgOrderValue: number }[] {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      DATE(created_at) as date,
      AVG(total) as avgOrderValue
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as any[];
  db.close();
  
  return results;
}

/**
 * Get customer acquisition metrics
 */
export function getCustomerAcquisitionMetrics(
  startDate: string,
  endDate: string
): {
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRate: number;
} {
  const db = new Database(dbPath);
  
  // Get customers who made their first purchase in the period
  const newCustomersQuery = `
    SELECT COUNT(DISTINCT user_id) as count
    FROM orders
    WHERE user_id IN (
      SELECT user_id FROM orders
      GROUP BY user_id
      HAVING MIN(DATE(created_at)) >= DATE(?) AND MIN(DATE(created_at)) <= DATE(?)
    )
    AND status IN ('paid', 'shipped', 'completed')
  `;
  
  const newCustomers = (db.prepare(newCustomersQuery).get(startDate, endDate) as any)?.count || 0;
  
  // Get customers who made multiple purchases in the period
  const returningCustomersQuery = `
    SELECT COUNT(DISTINCT user_id) as count
    FROM orders
    WHERE DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
    AND status IN ('paid', 'shipped', 'completed')
    AND user_id IN (
      SELECT user_id FROM orders
      WHERE DATE(created_at) < DATE(?)
      AND status IN ('paid', 'shipped', 'completed')
      GROUP BY user_id
    )
  `;
  
  const returningCustomers = (db.prepare(returningCustomersQuery).get(startDate, endDate, startDate) as any)?.count || 0;
  
  db.close();
  
  const totalCustomers = newCustomers + returningCustomers;
  const repeatPurchaseRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  
  return {
    newCustomers,
    returningCustomers,
    repeatPurchaseRate,
  };
}

/**
 * Get period-over-period comparison metrics
 */
export function getPeriodComparison(
  currentStartDate: string,
  currentEndDate: string,
  previousStartDate: string,
  previousEndDate: string
): {
  revenue: { current: number; previous: number; change: number; changePercent: number };
  orders: { current: number; previous: number; change: number; changePercent: number };
  customers: { current: number; previous: number; change: number; changePercent: number };
  aov: { current: number; previous: number; change: number; changePercent: number };
} {
  const db = new Database(dbPath);
  
  // Current period
  const currentQuery = `
    SELECT 
      COUNT(*) as orders,
      SUM(total) as revenue,
      COUNT(DISTINCT user_id) as customers,
      AVG(total) as aov
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
  `;
  
  const current = db.prepare(currentQuery).get(currentStartDate, currentEndDate) as any;
  
  // Previous period
  const previous = db.prepare(currentQuery).get(previousStartDate, previousEndDate) as any;
  
  db.close();
  
  const currentRevenue = current.revenue || 0;
  const previousRevenue = previous.revenue || 0;
  const currentOrders = current.orders || 0;
  const previousOrders = previous.orders || 0;
  const currentCustomers = current.customers || 0;
  const previousCustomers = previous.customers || 0;
  const currentAov = current.aov || 0;
  const previousAov = previous.aov || 0;
  
  return {
    revenue: {
      current: currentRevenue,
      previous: previousRevenue,
      change: currentRevenue - previousRevenue,
      changePercent: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
    },
    orders: {
      current: currentOrders,
      previous: previousOrders,
      change: currentOrders - previousOrders,
      changePercent: previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0,
    },
    customers: {
      current: currentCustomers,
      previous: previousCustomers,
      change: currentCustomers - previousCustomers,
      changePercent: previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0,
    },
    aov: {
      current: currentAov,
      previous: previousAov,
      change: currentAov - previousAov,
      changePercent: previousAov > 0 ? ((currentAov - previousAov) / previousAov) * 100 : 0,
    },
  };
}

/**
 * Get wishlist engagement metrics
 */
export function getWishlistMetrics(
  startDate: string,
  endDate: string
): {
  totalWishlists: number;
  totalItems: number;
  uniqueUsers: number;
  avgItemsPerWishlist: number;
  wishlistToOrderRate: number;
} {
  const db = new Database(dbPath);
  
  try {
    // Check if wishlist tables exist
    db.prepare('SELECT 1 FROM wishlists LIMIT 1').get();
  } catch {
    db.close();
    return {
      totalWishlists: 0,
      totalItems: 0,
      uniqueUsers: 0,
      avgItemsPerWishlist: 0,
      wishlistToOrderRate: 0,
    };
  }
  
  const query = `
    SELECT 
      COUNT(DISTINCT w.id) as total_wishlists,
      COUNT(DISTINCT wi.id) as total_items,
      COUNT(DISTINCT w.user_id) as unique_users,
      CASE 
        WHEN COUNT(DISTINCT w.id) > 0 
        THEN CAST(COUNT(DISTINCT wi.id) AS REAL) / COUNT(DISTINCT w.id)
        ELSE 0
      END as avg_items_per_wishlist
    FROM wishlists w
    LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
    WHERE w.created_at >= ?
      AND w.created_at <= ?
  `;
  
  const result = db.prepare(query).get(
    new Date(startDate).getTime(),
    new Date(endDate).getTime() + 86400000 // Add 1 day to include end date
  ) as any;
  
  // Calculate wishlist to order conversion rate
  // This is a simplified version - would need order_items to track wishlist conversions
  const wishlistToOrderRate = 0; // Placeholder - would need additional tracking
  
  db.close();
  
  return {
    totalWishlists: result.total_wishlists || 0,
    totalItems: result.total_items || 0,
    uniqueUsers: result.unique_users || 0,
    avgItemsPerWishlist: Math.round((result.avg_items_per_wishlist || 0) * 100) / 100,
    wishlistToOrderRate,
  };
}

/**
 * Get workflow performance metrics
 */
export function getWorkflowMetrics(
  startDate: string,
  endDate: string
): {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  topWorkflows: Array<{
    workflowId: string;
    workflowName: string;
    executionCount: number;
    successRate: number;
  }>;
} {
  const db = new Database(dbPath);
  
  try {
    // Check if workflow tables exist
    db.prepare('SELECT 1 FROM workflows LIMIT 1').get();
  } catch {
    db.close();
    return {
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgExecutionTime: 0,
      topWorkflows: [],
    };
  }
  
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime() + 86400000;
  
  // Get workflow counts
  const workflowStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
    FROM workflows
  `).get() as any;
  
  // Get execution stats
  const executionStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(CASE 
        WHEN completed_at IS NOT NULL AND started_at IS NOT NULL 
        THEN completed_at - started_at 
        ELSE NULL 
      END) as avg_time
    FROM workflow_executions
    WHERE started_at >= ? AND started_at <= ?
  `).get(startTime, endTime) as any;
  
  // Get top workflows by execution count
  const topWorkflowsQuery = `
    SELECT 
      w.id as workflow_id,
      w.name as workflow_name,
      COUNT(we.id) as execution_count,
      SUM(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(we.id) as success_rate
    FROM workflows w
    LEFT JOIN workflow_executions we ON we.workflow_id = w.id
      AND we.started_at >= ? AND we.started_at <= ?
    GROUP BY w.id, w.name
    HAVING execution_count > 0
    ORDER BY execution_count DESC
    LIMIT 10
  `;
  
  const topWorkflows = db.prepare(topWorkflowsQuery).all(startTime, endTime) as any[];
  
  db.close();
  
  return {
    totalWorkflows: workflowStats.total || 0,
    activeWorkflows: workflowStats.active || 0,
    totalExecutions: executionStats.total || 0,
    successfulExecutions: executionStats.successful || 0,
    failedExecutions: executionStats.failed || 0,
    avgExecutionTime: Math.round((executionStats.avg_time || 0) / 1000), // Convert to seconds
    topWorkflows: topWorkflows.map(w => ({
      workflowId: w.workflow_id,
      workflowName: w.workflow_name,
      executionCount: w.execution_count,
      successRate: Math.round((w.success_rate || 0) * 100) / 100,
    })),
  };
}

/**
 * Get sales by category
 */
export function getSalesByCategory(
  startDate: string,
  endDate: string
): Array<{
  categoryId: string;
  categoryName: string;
  orderCount: number;
  revenue: number;
  quantitySold: number;
}> {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      c.id as category_id,
      c.name as category_name,
      COUNT(DISTINCT o.id) as order_count,
      SUM(oi.total_price) as revenue,
      SUM(oi.quantity) as quantity_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
      AND c.id IS NOT NULL
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as any[];
  db.close();
  
  return results.map(r => ({
    categoryId: r.category_id,
    categoryName: r.category_name || 'Uncategorized',
    orderCount: r.order_count || 0,
    revenue: r.revenue || 0,
    quantitySold: r.quantity_sold || 0,
  }));
}

/**
 * Get customer lifetime value metrics
 */
export function getCustomerLTVMetrics(
  startDate: string,
  endDate: string
): {
  avgLTV: number;
  medianLTV: number;
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    email: string;
    totalSpent: number;
    orderCount: number;
    avgOrderValue: number;
  }>;
} {
  const db = new Database(dbPath);
  
  // Get all customers who made purchases in the period
  const ltvQuery = `
    SELECT 
      o.user_id as customer_id,
      u.name as customer_name,
      u.email as email,
      SUM(o.total) as total_spent,
      COUNT(*) as order_count,
      AVG(o.total) as avg_order_value
    FROM orders o
    LEFT JOIN user u ON u.id = o.user_id
    WHERE o.status IN ('paid', 'shipped', 'completed')
      AND DATE(o.created_at) >= DATE(?)
      AND DATE(o.created_at) <= DATE(?)
      AND o.user_id IS NOT NULL
    GROUP BY o.user_id, u.name, u.email
    ORDER BY total_spent DESC
  `;
  
  const customers = db.prepare(ltvQuery).all(startDate, endDate) as any[];
  
  if (customers.length === 0) {
    db.close();
    return {
      avgLTV: 0,
      medianLTV: 0,
      topCustomers: [],
    };
  }
  
  const ltvValues = customers.map(c => c.total_spent || 0).sort((a, b) => a - b);
  const sum = ltvValues.reduce((acc, val) => acc + val, 0);
  const avgLTV = sum / ltvValues.length;
  const medianLTV = ltvValues[Math.floor(ltvValues.length / 2)];
  
  db.close();
  
  return {
    avgLTV: Math.round(avgLTV * 100) / 100,
    medianLTV: Math.round(medianLTV * 100) / 100,
    topCustomers: customers.slice(0, 10).map(c => ({
      customerId: c.customer_id,
      customerName: c.customer_name || 'Unknown',
      email: c.email || '',
      totalSpent: c.total_spent || 0,
      orderCount: c.order_count || 0,
      avgOrderValue: Math.round((c.avg_order_value || 0) * 100) / 100,
    })),
  };
}

/**
 * Get hourly sales distribution
 */
export function getHourlySalesDistribution(
  startDate: string,
  endDate: string
): Array<{
  hour: number;
  orderCount: number;
  revenue: number;
}> {
  const db = new Database(dbPath);
  
  const query = `
    SELECT 
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as order_count,
      SUM(total) as revenue
    FROM orders
    WHERE status IN ('paid', 'shipped', 'completed')
      AND DATE(created_at) >= DATE(?)
      AND DATE(created_at) <= DATE(?)
    GROUP BY hour
    ORDER BY hour
  `;
  
  const results = db.prepare(query).all(startDate, endDate) as any[];
  db.close();
  
  // Fill in missing hours with 0
  const hourlyData: Array<{ hour: number; orderCount: number; revenue: number }> = [];
  for (let hour = 0; hour < 24; hour++) {
    const existing = results.find(r => r.hour === hour);
    hourlyData.push({
      hour,
      orderCount: existing?.order_count || 0,
      revenue: existing?.revenue || 0,
    });
  }
  
  return hourlyData;
}

