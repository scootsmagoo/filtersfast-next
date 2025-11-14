'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  StatCard, 
  RevenueChart, 
  TopItemsChart, 
  PieChart, 
  LineChart,
  DataTable,
} from '@/components/admin/AnalyticsCharts';
import { formatCurrency, formatNumber, calculatePercentageChange } from '@/lib/analytics-utils';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, ListOrdered } from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Button from '@/components/ui/Button';

type DatePeriod = 'today' | '7days' | '30days' | '90days' | 'year' | 'custom';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<DatePeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  
  // State for analytics data
  const [summary, setSummary] = useState<any>({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0 });
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [revenueByPeriod, setRevenueByPeriod] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<any>({ newCustomers: 0, returningCustomers: 0, repeatPurchaseRate: 0 });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setStatusMessage('Loading analytics data...');
    try {
      const params = new URLSearchParams({
        period,
        ...(period === 'custom' && customStartDate && customEndDate && {
          startDate: customStartDate,
          endDate: customEndDate,
        }),
      });

      // Fetch all analytics data in parallel
      const [
        summaryRes,
        dailySalesRes,
        topProductsRes,
        topCustomersRes,
        revenueRes,
        statusRes,
        customerRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics/summary?${params}`).then(r => r.json()),
        fetch(`/api/admin/analytics/daily-sales?${params}`).then(r => r.json()),
        fetch(`/api/admin/analytics/top-products?${params}&sortBy=revenue&limit=10`).then(r => r.json()),
        fetch(`/api/admin/analytics/top-customers?${params}&sortBy=revenue&limit=10`).then(r => r.json()),
        fetch(`/api/admin/analytics/revenue-by-period?${params}&groupBy=day`).then(r => r.json()),
        fetch(`/api/admin/analytics/order-status?${params}`).then(r => r.json()),
        fetch(`/api/admin/analytics/customer-acquisition?${params}`).then(r => r.json()),
      ]);

      setSummary(summaryRes.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0 });
      setDailySales(dailySalesRes.dailySales || []);
      setTopProducts(topProductsRes.topProducts || []);
      setTopCustomers(topCustomersRes.topCustomers || []);
      setRevenueByPeriod(revenueRes.revenueData || []);
      setOrdersByStatus(statusRes.ordersByStatus || []);
      setCustomerMetrics(customerRes.metrics || { newCustomers: 0, returningCustomers: 0, repeatPurchaseRate: 0 });
      setStatusMessage('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setStatusMessage('Error loading analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, customStartDate, customEndDate]);

  const handleExportData = () => {
    // Prepare CSV data
    const csvData = (dailySales || []).map(d => ({
      Date: d.date,
      Orders: d.totalOrders,
      Revenue: d.totalRevenue,
      'Avg Order Value': d.avgOrderValue,
      'New Customers': d.newCustomers,
    }));

    if (csvData.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f26722] mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading analytics...</p>
          <span className="sr-only">Loading analytics data, please wait</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        <AdminBreadcrumb />
      </div>
      {/* Screen reader status announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#analytics-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#f26722] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f26722] focus:ring-offset-2 z-50"
      >
        Skip to analytics content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="analytics-content">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics & Reporting Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Comprehensive insights into your business performance
            </p>
          </div>
          <Link href="/admin/analytics/top-300">
            <Button variant="outline" className="inline-flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              Open Top 300 Report
            </Button>
          </Link>
        </div>

        {/* Period Selector */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <Calendar className="inline-block w-4 h-4 mr-2" aria-hidden="true" />
              Time Period:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as DatePeriod)}
              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#f26722] focus:ring-[#f26722] focus:ring-2 focus:ring-offset-2"
              aria-label="Select time period for analytics"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {period === 'custom' && (
              <>
                <label htmlFor="start-date" className="sr-only">
                  Start date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#f26722] focus:ring-[#f26722] focus:ring-2 focus:ring-offset-2"
                  aria-label="Custom start date"
                />
                <span className="text-gray-500 dark:text-gray-400" aria-hidden="true">to</span>
                <label htmlFor="end-date" className="sr-only">
                  End date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#f26722] focus:ring-[#f26722] focus:ring-2 focus:ring-offset-2"
                  aria-label="Custom end date"
                />
              </>
            )}

            <button
              onClick={handleExportData}
              className="ml-auto px-4 py-2 bg-[#054f97] hover:bg-[#043a6f] focus:bg-[#043a6f] text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#054f97] focus:ring-offset-2"
              aria-label="Export analytics data as CSV"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <section aria-labelledby="summary-heading" className="mb-8">
          <h2 id="summary-heading" className="sr-only">Summary Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={summary?.totalRevenue || 0}
              valueFormatter={formatCurrency}
              icon={<DollarSign className="w-8 h-8" />}
            />
            <StatCard
              title="Total Orders"
              value={summary?.totalOrders || 0}
              valueFormatter={formatNumber}
              icon={<ShoppingCart className="w-8 h-8" />}
            />
            <StatCard
              title="Avg Order Value"
              value={summary?.avgOrderValue || 0}
              valueFormatter={formatCurrency}
              icon={<TrendingUp className="w-8 h-8" />}
            />
            <StatCard
              title="Total Customers"
              value={summary?.totalCustomers || 0}
              valueFormatter={formatNumber}
              icon={<Users className="w-8 h-8" />}
            />
          </div>
        </section>

        {/* Customer Acquisition Metrics */}
        {customerMetrics && (
          <section aria-labelledby="customer-metrics-heading" className="mb-8">
            <h2 id="customer-metrics-heading" className="sr-only">Customer Acquisition Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="New Customers"
                value={customerMetrics.newCustomers}
                valueFormatter={formatNumber}
              />
              <StatCard
                title="Returning Customers"
                value={customerMetrics.returningCustomers}
                valueFormatter={formatNumber}
              />
              <StatCard
                title="Repeat Purchase Rate"
                value={`${customerMetrics.repeatPurchaseRate.toFixed(1)}%`}
              />
            </div>
          </section>
        )}

        {/* Charts Row 1 */}
        <section aria-labelledby="charts-heading" className="mb-8">
          <h2 id="charts-heading" className="sr-only">Analytics Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LineChart
              data={(revenueByPeriod || []).map(d => ({ date: d.period, value: d.revenue }))}
              title="Revenue Trend"
              valueFormatter={formatCurrency}
              color="#f26722"
            />
            <PieChart
              data={(ordersByStatus || []).map(o => ({ label: o.status, value: o.count }))}
              title="Orders by Status"
              valueFormatter={formatNumber}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopItemsChart
              items={(topProducts || []).map(p => ({
                name: p.productName || 'Unknown Product',
                value: p.revenue,
                label: `${p.quantitySold} sold`,
              }))}
              title="Top Products by Revenue"
              valueFormatter={formatCurrency}
            />
            <TopItemsChart
              items={(topCustomers || []).map(c => ({
                name: c.customerName || c.email,
                value: c.totalSpent,
                label: `${c.orderCount} orders`,
              }))}
              title="Top Customers by Revenue"
              valueFormatter={formatCurrency}
            />
          </div>
        </section>

        {/* Daily Sales Table */}
        <section aria-labelledby="daily-sales-heading" className="mb-8">
          <h2 id="daily-sales-heading" className="sr-only">Daily Sales Data</h2>
          <DataTable
            title="Daily Sales Breakdown"
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'totalOrders', label: 'Orders', formatter: formatNumber },
              { key: 'totalRevenue', label: 'Revenue', formatter: formatCurrency },
              { key: 'avgOrderValue', label: 'Avg Order', formatter: formatCurrency },
              { key: 'newCustomers', label: 'New Customers', formatter: formatNumber },
            ]}
            data={(dailySales || []).slice(0, 30)}
          />
        </section>

        {/* Revenue Chart by Period */}
        <section aria-labelledby="revenue-period-heading" className="mb-8">
          <h2 id="revenue-period-heading" className="sr-only">Revenue by Time Period</h2>
          <RevenueChart
            data={(revenueByPeriod || []).map(d => ({
              period: d.period,
              revenue: d.revenue,
              orderCount: d.orderCount,
            }))}
            title="Revenue by Period"
          />
        </section>
      </div>
    </div>
  );
}

