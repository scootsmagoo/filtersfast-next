'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  XCircle, 
  CheckCircle, 
  BarChart3,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Smartphone,
  Monitor,
  Users
} from 'lucide-react';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type DatePeriod = '7days' | '30days' | '90days' | 'year' | 'custom';

interface SearchStats {
  totalSearches: number;
  uniqueSearchers: number;
  uniqueTerms: number;
  avgResultsPerSearch: number;
  successRate: number;
  mobilePercentage: number;
  topOutcomes: Array<{ outcome: string; count: number }>;
}

interface TopSearch {
  searchTerm: string;
  searchTermNormalized: string;
  searchCount: number;
  uniqueUsers: number;
  avgResults: number;
  successfulSearches: number;
  failedSearches: number;
  lastSearched: string;
}

interface FailedSearch {
  searchTerm: string;
  searchTermNormalized: string;
  failureCount: number;
  uniqueUsers: number;
  lastSearched: string;
  searchTypes: string;
}

interface SearchTrend {
  searchDay: string;
  totalSearches: number;
  uniqueSearchers: number;
  uniqueTerms: number;
  avgResultsPerSearch: number;
  successfulSearches: number;
  failedSearches: number;
  mobileSearches: number;
}

export default function SearchAnalyticsPage() {
  const [period, setPeriod] = useState<DatePeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'top-searches' | 'failed' | 'trends' | 'recent'>('overview');
  const [searchTermFilter, setSearchTermFilter] = useState('');

  // State for analytics data
  const [stats, setStats] = useState<SearchStats>({
    totalSearches: 0,
    uniqueSearchers: 0,
    uniqueTerms: 0,
    avgResultsPerSearch: 0,
    successRate: 0,
    mobilePercentage: 0,
    topOutcomes: []
  });
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [failedSearches, setFailedSearches] = useState<FailedSearch[]>([]);
  const [trends, setTrends] = useState<SearchTrend[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(period === 'custom' && customStartDate && customEndDate && {
          startDate: customStartDate,
          endDate: customEndDate,
        }),
        ...(period !== 'custom' && {
          days: period === '7days' ? '7' : period === '30days' ? '30' : period === '90days' ? '90' : '365'
        })
      });

      // Fetch stats
      const statsRes = await fetch(`/api/admin/search-analytics?type=stats&${params}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch top searches
      const topRes = await fetch(`/api/admin/search-analytics?type=top-searches&limit=50&${params}`);
      const topData = await topRes.json();
      setTopSearches(topData);

      // Fetch failed searches
      const failedRes = await fetch(`/api/admin/search-analytics?type=failed&limit=50&${params}`);
      const failedData = await failedRes.json();
      setFailedSearches(failedData);

      // Fetch trends
      const trendsRes = await fetch(`/api/admin/search-analytics?type=trends&${params}`);
      const trendsData = await trendsRes.json();
      setTrends(trendsData);

      // Fetch recent searches if on recent tab
      if (activeTab === 'recent') {
        const recentParams = new URLSearchParams({
          limit: '100',
          ...(searchTermFilter && { searchTerm: searchTermFilter })
        });
        const recentRes = await fetch(`/api/admin/search-analytics?type=recent&${recentParams}`);
        const recentData = await recentRes.json();
        setRecentSearches(recentData);
      }
    } catch (error) {
      console.error('Error fetching search analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchAnalytics();
    }
  }, [activeTab, searchTermFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOutcomeLabel = (outcome: string) => {
    const labels: Record<string, string> = {
      'results_found': 'Results Found',
      'no_results': 'No Results',
      'redirect': 'Redirected',
      'error': 'Error'
    };
    return labels[outcome] || outcome;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-6">
        <AdminBreadcrumb items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Search Analytics', href: '/admin/search-analytics' }
        ]} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
            Search Analytics & Catalog Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors">
            Track search queries, identify trends, and discover catalog gaps
          </p>
        </div>

        {/* Date Filter */}
        <Card className="mb-6 p-4" role="region" aria-label="Date range filter">
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
              Period:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as DatePeriod)}
              aria-label="Select time period for analytics"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="year">Last year</option>
              <option value="custom">Custom range</option>
            </select>
            {period === 'custom' && (
              <>
                <label htmlFor="start-date" className="sr-only">Start date</label>
                <input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  aria-label="Start date for custom range"
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                />
                <span className="text-gray-600 dark:text-gray-400" aria-hidden="true">to</span>
                <label htmlFor="end-date" className="sr-only">End date</label>
                <input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  aria-label="End date for custom range"
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                />
              </>
            )}
            <Button 
              onClick={fetchAnalytics} 
              disabled={loading}
              aria-label={loading ? 'Loading analytics data' : 'Refresh analytics data'}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 transition-colors" role="tablist" aria-label="Search analytics tabs">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'top-searches', label: 'Top Searches', icon: TrendingUp },
              { id: 'failed', label: 'Failed Searches', icon: AlertTriangle },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'recent', label: 'Recent Searches', icon: Eye }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${
                    isActive
                      ? 'border-brand-orange text-brand-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading state with aria-live */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {loading && 'Loading search analytics data'}
          {!loading && `Showing ${activeTab} analytics data`}
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto" aria-hidden="true"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              <span className="sr-only">Loading</span>
              <span aria-hidden="true">Loading analytics...</span>
            </p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Search analytics summary">
                  <Card className="p-6" role="region" aria-label="Total searches">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Searches</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Total searches: ${stats.totalSearches.toLocaleString()}`}>
                          {stats.totalSearches.toLocaleString()}
                        </p>
                      </div>
                      <Search className="w-8 h-8 text-brand-orange" aria-hidden="true" />
                    </div>
                  </Card>

                  <Card className="p-6" role="region" aria-label="Unique searchers">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Searchers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Unique searchers: ${stats.uniqueSearchers.toLocaleString()}`}>
                          {stats.uniqueSearchers.toLocaleString()}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" aria-hidden="true" />
                    </div>
                  </Card>

                  <Card className="p-6" role="region" aria-label="Search success rate">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Success rate: ${stats.successRate.toFixed(1)} percent`}>
                          {stats.successRate.toFixed(1)}%
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
                    </div>
                  </Card>

                  <Card className="p-6" role="region" aria-label="Average results per search">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Results</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Average results per search: ${stats.avgResultsPerSearch.toFixed(1)}`}>
                          {stats.avgResultsPerSearch.toFixed(1)}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" aria-hidden="true" />
                    </div>
                  </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Additional search statistics">
                  <Card className="p-6" role="region" aria-label="Unique search terms">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Search Terms</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Unique search terms: ${stats.uniqueTerms.toLocaleString()}`}>
                      {stats.uniqueTerms.toLocaleString()}
                    </p>
                  </Card>

                  <Card className="p-6" role="region" aria-label="Mobile searches percentage">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobile Searches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Mobile searches: ${stats.mobilePercentage.toFixed(1)} percent`}>
                      {stats.mobilePercentage.toFixed(1)}%
                    </p>
                  </Card>

                  <Card className="p-6" role="region" aria-label="Desktop searches percentage">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Desktop Searches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1" aria-label={`Desktop searches: ${(100 - stats.mobilePercentage).toFixed(1)} percent`}>
                      {(100 - stats.mobilePercentage).toFixed(1)}%
                    </p>
                  </Card>
                </div>

                {/* Outcome Breakdown */}
                <Card className="p-6" role="region" aria-label="Search outcomes breakdown">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Search Outcomes</h2>
                  <div className="space-y-3" role="list" aria-label="Search outcome statistics">
                    {stats.topOutcomes.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No outcome data available</p>
                    ) : (
                      stats.topOutcomes.map(outcome => {
                        const percentage = stats.totalSearches > 0 
                          ? ((outcome.count / stats.totalSearches) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <div key={outcome.outcome} className="flex items-center justify-between" role="listitem">
                            <span className="text-gray-700 dark:text-gray-300">
                              {getOutcomeLabel(outcome.outcome)}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                {outcome.count.toLocaleString()}
                              </span>
                              <div 
                                className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                                role="progressbar"
                                aria-valuenow={parseFloat(percentage)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${getOutcomeLabel(outcome.outcome)}: ${percentage}%`}
                              >
                                <div
                                  className="bg-brand-orange h-2 rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`
                                  }}
                                  aria-hidden="true"
                                ></div>
                              </div>
                              <span className="text-gray-600 dark:text-gray-400 text-sm w-12 text-right" aria-hidden="true">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>
              </div>
            )}

            {/* Top Searches Tab */}
            {activeTab === 'top-searches' && (
              <div role="tabpanel" id="tabpanel-top-searches" aria-labelledby="tab-top-searches">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Search Terms</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full" role="table" aria-label="Top search terms table">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Search Term</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Searches</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Unique Users</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Results</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Success Rate</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Last Searched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSearches.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-600 dark:text-gray-400">
                              No search data available for the selected period
                            </td>
                          </tr>
                        ) : (
                          topSearches.map((search, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4">
                                <a
                                  href={`/search?q=${encodeURIComponent(search.searchTerm)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-orange hover:underline focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
                                  aria-label={`View search results for ${search.searchTerm}`}
                                >
                                  {search.searchTerm}
                                </a>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{search.searchCount.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{search.uniqueUsers.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{search.avgResults.toFixed(1)}</td>
                              <td className="text-right py-3 px-4">
                                <span className={`font-semibold ${search.successfulSearches > search.failedSearches ? 'text-green-600' : 'text-red-600'}`}>
                                  {((search.successfulSearches / search.searchCount) * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                                <time dateTime={search.lastSearched}>{formatDate(search.lastSearched)}</time>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Failed Searches Tab */}
            {activeTab === 'failed' && (
              <div role="tabpanel" id="tabpanel-failed" aria-labelledby="tab-failed">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Failed Searches (Catalog Gaps)
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    These searches returned no results. Consider adding these products to your catalog.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full" role="table" aria-label="Failed searches table">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Search Term</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Failures</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Unique Users</th>
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Search Types</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Last Searched</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failedSearches.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-600 dark:text-gray-400">
                              No failed searches found for the selected period
                            </td>
                          </tr>
                        ) : (
                          failedSearches.map((search, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{search.searchTerm}</td>
                              <td className="text-right py-3 px-4 text-red-600 font-semibold">{search.failureCount.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{search.uniqueUsers.toLocaleString()}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{search.searchTypes}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                                <time dateTime={search.lastSearched}>{formatDate(search.lastSearched)}</time>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div role="tabpanel" id="tabpanel-trends" aria-labelledby="tab-trends">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Search Trends Over Time</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full" role="table" aria-label="Search trends over time table">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Searches</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Unique Searchers</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Unique Terms</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Results</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Success Rate</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trends.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-600 dark:text-gray-400">
                              No trend data available for the selected period
                            </td>
                          </tr>
                        ) : (
                          trends.map((trend, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                                <time dateTime={trend.searchDay}>{formatDate(trend.searchDay)}</time>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{trend.totalSearches.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{trend.uniqueSearchers.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{trend.uniqueTerms.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">{trend.avgResultsPerSearch.toFixed(1)}</td>
                              <td className="text-right py-3 px-4">
                                <span className={`font-semibold ${((trend.successfulSearches / trend.totalSearches) * 100) > 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {((trend.successfulSearches / trend.totalSearches) * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                                {((trend.mobileSearches / trend.totalSearches) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Recent Searches Tab */}
            {activeTab === 'recent' && (
              <div role="tabpanel" id="tabpanel-recent" aria-labelledby="tab-recent">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Searches</h2>
                    <label htmlFor="search-term-filter" className="sr-only">Filter by search term</label>
                    <input
                      id="search-term-filter"
                      type="text"
                      placeholder="Filter by search term..."
                      value={searchTermFilter}
                      onChange={(e) => setSearchTermFilter(e.target.value)}
                      aria-label="Filter recent searches by search term"
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" role="table" aria-label="Recent searches table">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Search Term</th>
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                          <th scope="col" className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Results</th>
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Outcome</th>
                          <th scope="col" className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Device</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSearches.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-600 dark:text-gray-400">
                              {searchTermFilter ? 'No searches found matching filter' : 'No recent searches available'}
                            </td>
                          </tr>
                        ) : (
                          recentSearches.map((search) => (
                            <tr key={search.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                                <time dateTime={search.searchDate}>{formatDate(search.searchDate)}</time>
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`/search?q=${encodeURIComponent(search.searchTerm)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-orange hover:underline focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 rounded"
                                  aria-label={`View search results for ${search.searchTerm}`}
                                >
                                  {search.searchTerm}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{search.searchType || '-'}</td>
                              <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">{search.resultCount.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span 
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    search.outcome === 'results_found' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    search.outcome === 'no_results' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}
                                  aria-label={`Search outcome: ${getOutcomeLabel(search.outcome)}`}
                                >
                                  {getOutcomeLabel(search.outcome)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {search.mobile ? (
                                  <>
                                    <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                                    <span className="sr-only">Mobile device</span>
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                                    <span className="sr-only">Desktop device</span>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

