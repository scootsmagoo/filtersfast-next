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
import { formatCurrency, formatNumber, calculatePercentageChange, formatPercentage, exportToCSV } from '@/lib/analytics-utils';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, ListOrdered, Search, Heart, Workflow, BarChart3, Clock, TrendingDown } from 'lucide-react';
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
  
  // Advanced analytics state
  const [periodComparison, setPeriodComparison] = useState<any>(null);
  const [searchInsights, setSearchInsights] = useState<any>(null);
  const [wishlistMetrics, setWishlistMetrics] = useState<any>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<any>(null);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [customerLTV, setCustomerLTV] = useState<any>(null);
  const [hourlySales, setHourlySales] = useState<any[]>([]);

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
      // OWASP: Handle errors gracefully without exposing sensitive information
      const [
        summaryRes,
        dailySalesRes,
        topProductsRes,
        topCustomersRes,
        revenueRes,
        statusRes,
        customerRes,
        periodComparisonRes,
        searchInsightsRes,
        wishlistMetricsRes,
        workflowMetricsRes,
        salesByCategoryRes,
        customerLTVRes,
        hourlySalesRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics/summary?${params}`).then(r => r.ok ? r.json() : { summary: null, error: 'Failed to load summary' }).catch(() => ({ summary: null })),
        fetch(`/api/admin/analytics/daily-sales?${params}`).then(r => r.ok ? r.json() : { dailySales: [] }).catch(() => ({ dailySales: [] })),
        fetch(`/api/admin/analytics/top-products?${params}&sortBy=revenue&limit=10`).then(r => r.ok ? r.json() : { topProducts: [] }).catch(() => ({ topProducts: [] })),
        fetch(`/api/admin/analytics/top-customers?${params}&sortBy=revenue&limit=10`).then(r => r.ok ? r.json() : { topCustomers: [] }).catch(() => ({ topCustomers: [] })),
        fetch(`/api/admin/analytics/revenue-by-period?${params}&groupBy=day`).then(r => r.ok ? r.json() : { revenueData: [] }).catch(() => ({ revenueData: [] })),
        fetch(`/api/admin/analytics/order-status?${params}`).then(r => r.ok ? r.json() : { ordersByStatus: [] }).catch(() => ({ ordersByStatus: [] })),
        fetch(`/api/admin/analytics/customer-acquisition?${params}`).then(r => r.ok ? r.json() : { metrics: null }).catch(() => ({ metrics: null })),
        fetch(`/api/admin/analytics/period-comparison?${params}`).then(r => r.ok ? r.json() : { comparison: null }).catch(() => ({ comparison: null })),
        fetch(`/api/admin/analytics/search-insights?${params}`).then(r => r.ok ? r.json() : { stats: null }).catch(() => ({ stats: null })),
        fetch(`/api/admin/analytics/wishlist-metrics?${params}`).then(r => r.ok ? r.json() : { metrics: null }).catch(() => ({ metrics: null })),
        fetch(`/api/admin/analytics/workflow-metrics?${params}`).then(r => r.ok ? r.json() : { metrics: null }).catch(() => ({ metrics: null })),
        fetch(`/api/admin/analytics/sales-by-category?${params}`).then(r => r.ok ? r.json() : { salesByCategory: [] }).catch(() => ({ salesByCategory: [] })),
        fetch(`/api/admin/analytics/customer-ltv?${params}`).then(r => r.ok ? r.json() : { ltvMetrics: null }).catch(() => ({ ltvMetrics: null })),
        fetch(`/api/admin/analytics/hourly-sales?${params}`).then(r => r.ok ? r.json() : { hourlySales: [] }).catch(() => ({ hourlySales: [] })),
      ]);

      setSummary(summaryRes.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0 });
      setDailySales(dailySalesRes.dailySales || []);
      setTopProducts(topProductsRes.topProducts || []);
      setTopCustomers(topCustomersRes.topCustomers || []);
      setRevenueByPeriod(revenueRes.revenueData || []);
      setOrdersByStatus(statusRes.ordersByStatus || []);
      setCustomerMetrics(customerRes.metrics || { newCustomers: 0, returningCustomers: 0, repeatPurchaseRate: 0 });
      
      // Advanced analytics
      setPeriodComparison(periodComparisonRes.comparison || null);
      setSearchInsights(searchInsightsRes.stats ? {
        ...searchInsightsRes.stats,
        topSearches: searchInsightsRes.topSearches || [],
        failedSearches: searchInsightsRes.failedSearches || [],
        conversions: searchInsightsRes.conversions || [],
      } : null);
      setWishlistMetrics(wishlistMetricsRes.metrics || null);
      setWorkflowMetrics(workflowMetricsRes.metrics || null);
      setSalesByCategory(salesByCategoryRes.salesByCategory || []);
      setCustomerLTV(customerLTVRes.ltvMetrics || null);
      setHourlySales(hourlySalesRes.hourlySales || []);
      
      setStatusMessage('Analytics data loaded successfully');
    } catch (error) {
      // OWASP: Don't expose error details to user, WCAG: Announce error to screen readers
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
      // WCAG: Use accessible notification instead of alert()
      setStatusMessage('No data available to export');
      return;
    }

    // OWASP: Use proper CSV escaping function
    const csv = exportToCSV(csvData, `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.setAttribute('aria-label', 'Download analytics data as CSV file');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // WCAG: Announce success to screen readers
    setStatusMessage('Analytics data exported successfully');
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
      
      {/* WCAG: Error alert region for accessibility */}
      {statusMessage && statusMessage.includes('Error') && (
        <div 
          role="alert" 
          aria-live="assertive" 
          className="container-custom mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300"
        >
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{statusMessage}</p>
        </div>
      )}
      
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
              Advanced Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Comprehensive insights into your business performance with advanced metrics and analytics
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
              type="button"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Period Comparison */}
        {periodComparison && (
          <section aria-labelledby="period-comparison-heading" className="mb-8">
            <h2 id="period-comparison-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Period-over-Period Comparison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" role="listitem">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Revenue</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-label={`Current revenue: ${formatCurrency(periodComparison.revenue.current)}`}>
                    {formatCurrency(periodComparison.revenue.current)}
                  </p>
                  <span 
                    className={`text-sm font-medium ${
                      periodComparison.revenue.changePercent >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-label={`${periodComparison.revenue.changePercent >= 0 ? 'Increased' : 'Decreased'} by ${formatPercentage(Math.abs(periodComparison.revenue.changePercent))}`}
                  >
                    <span aria-hidden="true">
                      {periodComparison.revenue.changePercent >= 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                      {formatPercentage(periodComparison.revenue.changePercent)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Previous: {formatCurrency(periodComparison.revenue.previous)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" role="listitem">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-label={`Current orders: ${formatNumber(periodComparison.orders.current)}`}>
                    {formatNumber(periodComparison.orders.current)}
                  </p>
                  <span 
                    className={`text-sm font-medium ${
                      periodComparison.orders.changePercent >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-label={`${periodComparison.orders.changePercent >= 0 ? 'Increased' : 'Decreased'} by ${formatPercentage(Math.abs(periodComparison.orders.changePercent))}`}
                  >
                    <span aria-hidden="true">
                      {periodComparison.orders.changePercent >= 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                      {formatPercentage(periodComparison.orders.changePercent)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Previous: {formatNumber(periodComparison.orders.previous)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" role="listitem">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Customers</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-label={`Current customers: ${formatNumber(periodComparison.customers.current)}`}>
                    {formatNumber(periodComparison.customers.current)}
                  </p>
                  <span 
                    className={`text-sm font-medium ${
                      periodComparison.customers.changePercent >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-label={`${periodComparison.customers.changePercent >= 0 ? 'Increased' : 'Decreased'} by ${formatPercentage(Math.abs(periodComparison.customers.changePercent))}`}
                  >
                    <span aria-hidden="true">
                      {periodComparison.customers.changePercent >= 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                      {formatPercentage(periodComparison.customers.changePercent)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Previous: {formatNumber(periodComparison.customers.previous)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" role="listitem">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Avg Order Value</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-label={`Current average order value: ${formatCurrency(periodComparison.aov.current)}`}>
                    {formatCurrency(periodComparison.aov.current)}
                  </p>
                  <span 
                    className={`text-sm font-medium ${
                      periodComparison.aov.changePercent >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    aria-label={`${periodComparison.aov.changePercent >= 0 ? 'Increased' : 'Decreased'} by ${formatPercentage(Math.abs(periodComparison.aov.changePercent))}`}
                  >
                    <span aria-hidden="true">
                      {periodComparison.aov.changePercent >= 0 ? <TrendingUp className="inline w-4 h-4" /> : <TrendingDown className="inline w-4 h-4" />}
                      {formatPercentage(periodComparison.aov.changePercent)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Previous: {formatCurrency(periodComparison.aov.previous)}
                </p>
              </div>
            </div>
          </section>
        )}

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

        {/* Search Analytics Insights */}
        {searchInsights && (
          <section aria-labelledby="search-insights-heading" className="mb-8">
            <h2 id="search-insights-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-6 h-6 text-brand-orange" />
              Search Analytics Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Searches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(searchInsights.totalSearches || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Unique Searchers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(searchInsights.uniqueSearchers || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{searchInsights.successRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Mobile Searches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{searchInsights.mobilePercentage?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>
              {searchInsights.topOutcomes && searchInsights.topOutcomes.length > 0 && (
                <PieChart
                  data={searchInsights.topOutcomes.map((o: any) => ({ label: o.outcome, value: o.count }))}
                  title="Search Outcomes"
                  valueFormatter={formatNumber}
                />
              )}
            </div>
            {searchInsights.topSearches && searchInsights.topSearches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Searches</h3>
                <div className="space-y-2">
                  {searchInsights.topSearches.slice(0, 10).map((search: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-white">{search.searchTerm}</span>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{formatNumber(search.searchCount)} searches</span>
                        <span>{search.successfulSearches} successful</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Wishlist Metrics */}
        {wishlistMetrics && (
          <section aria-labelledby="wishlist-metrics-heading" className="mb-8">
            <h2 id="wishlist-metrics-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-brand-orange" />
              Wishlist Engagement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Wishlists"
                value={wishlistMetrics.totalWishlists || 0}
                valueFormatter={formatNumber}
                icon={<Heart className="w-8 h-8" />}
              />
              <StatCard
                title="Total Items"
                value={wishlistMetrics.totalItems || 0}
                valueFormatter={formatNumber}
              />
              <StatCard
                title="Unique Users"
                value={wishlistMetrics.uniqueUsers || 0}
                valueFormatter={formatNumber}
              />
              <StatCard
                title="Avg Items/Wishlist"
                value={wishlistMetrics.avgItemsPerWishlist || 0}
                valueFormatter={(v) => v.toFixed(1)}
              />
            </div>
          </section>
        )}

        {/* Workflow Performance */}
        {workflowMetrics && workflowMetrics.totalWorkflows > 0 && (
          <section aria-labelledby="workflow-metrics-heading" className="mb-8">
            <h2 id="workflow-metrics-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Workflow className="w-6 h-6 text-brand-orange" />
              Workflow Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard
                title="Total Workflows"
                value={workflowMetrics.totalWorkflows || 0}
                valueFormatter={formatNumber}
                icon={<Workflow className="w-8 h-8" />}
              />
              <StatCard
                title="Active Workflows"
                value={workflowMetrics.activeWorkflows || 0}
                valueFormatter={formatNumber}
              />
              <StatCard
                title="Total Executions"
                value={workflowMetrics.totalExecutions || 0}
                valueFormatter={formatNumber}
              />
            </div>
            {workflowMetrics.topWorkflows && workflowMetrics.topWorkflows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Performing Workflows</h3>
                <TopItemsChart
                  items={workflowMetrics.topWorkflows.map((w: any) => ({
                    name: w.workflowName,
                    value: w.executionCount,
                    label: `${w.successRate.toFixed(1)}% success`,
                  }))}
                  title=""
                  valueFormatter={formatNumber}
                />
              </div>
            )}
          </section>
        )}

        {/* Sales by Category */}
        {salesByCategory && salesByCategory.length > 0 && (
          <section aria-labelledby="sales-category-heading" className="mb-8">
            <h2 id="sales-category-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-brand-orange" />
              Sales by Category
            </h2>
            <TopItemsChart
              items={salesByCategory.map(c => ({
                name: c.categoryName,
                value: c.revenue,
                label: `${formatNumber(c.quantitySold)} sold`,
              }))}
              title="Revenue by Category"
              valueFormatter={formatCurrency}
            />
          </section>
        )}

        {/* Customer Lifetime Value */}
        {customerLTV && (
          <section aria-labelledby="customer-ltv-heading" className="mb-8">
            <h2 id="customer-ltv-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Lifetime Value
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <StatCard
                title="Average LTV"
                value={customerLTV.avgLTV || 0}
                valueFormatter={formatCurrency}
              />
              <StatCard
                title="Median LTV"
                value={customerLTV.medianLTV || 0}
                valueFormatter={formatCurrency}
              />
            </div>
            {customerLTV.topCustomers && customerLTV.topCustomers.length > 0 && (
              <DataTable
                title="Top Customers by Lifetime Value"
                columns={[
                  { key: 'customerName', label: 'Customer' },
                  { key: 'email', label: 'Email' },
                  { key: 'totalSpent', label: 'Total Spent', formatter: formatCurrency },
                  { key: 'orderCount', label: 'Orders', formatter: formatNumber },
                  { key: 'avgOrderValue', label: 'Avg Order', formatter: formatCurrency },
                ]}
                data={customerLTV.topCustomers}
              />
            )}
          </section>
        )}

        {/* Hourly Sales Distribution */}
        {hourlySales && hourlySales.length > 0 && (
          <section aria-labelledby="hourly-sales-heading" className="mb-8">
            <h2 id="hourly-sales-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-brand-orange" />
              Hourly Sales Distribution
            </h2>
            <LineChart
              data={hourlySales.map(h => ({
                date: `${h.hour}:00`,
                value: h.revenue,
              }))}
              title="Revenue by Hour of Day"
              valueFormatter={formatCurrency}
              color="#054f97"
            />
          </section>
        )}
      </div>
    </div>
  );
}

