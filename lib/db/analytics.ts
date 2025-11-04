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

