/**
 * Utility functions for analytics calculations and formatting
 */

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage with + or - sign
 */
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get date range for a given period
 */
export function getDateRange(period: 'today' | '7days' | '30days' | '90days' | 'year' | 'custom', customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;

  switch (period) {
    case 'today':
      startDate = endDate;
      break;
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date range requires both start and end dates');
      }
      startDate = customStart;
      return { startDate, endDate: customEnd };
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(current: number, previous: number): {
  value: number;
  percentage: number;
  isPositive: boolean;
} {
  const diff = current - previous;
  const percentage = calculatePercentageChange(current, previous);
  
  return {
    value: diff,
    percentage,
    isPositive: diff >= 0,
  };
}

/**
 * Group data by time period
 */
export function groupByPeriod<T extends { date: string }>(
  data: T[],
  period: 'day' | 'week' | 'month'
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * Prepare chart data for visualization
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

export function prepareChartData(
  data: { period: string; value: number }[],
  label: string,
  color: string
): ChartData {
  return {
    labels: data.map(d => d.period),
    datasets: [
      {
        label,
        data: data.map(d => d.value),
        borderColor: color,
        backgroundColor: color + '20', // Add transparency
      },
    ],
  };
}

/**
 * Calculate order statistics
 */
export function calculateOrderStats(orders: { total: number }[]): {
  total: number;
  average: number;
  median: number;
  min: number;
  max: number;
} {
  if (orders.length === 0) {
    return { total: 0, average: 0, median: 0, min: 0, max: 0 };
  }

  const totals = orders.map(o => o.total).sort((a, b) => a - b);
  const sum = totals.reduce((acc, val) => acc + val, 0);

  return {
    total: sum,
    average: sum / totals.length,
    median: totals[Math.floor(totals.length / 2)],
    min: totals[0],
    max: totals[totals.length - 1],
  };
}

/**
 * Get color for chart based on index
 */
export function getChartColor(index: number): string {
  const colors = [
    '#f26722', // Orange (primary)
    '#054f97', // Blue (secondary)
    '#37b033', // Green (success)
    '#fbbf24', // Yellow
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange-red
  ];
  
  return colors[index % colors.length];
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateStr: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
  const date = new Date(dateStr);
  
  switch (period) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'year':
      return date.getFullYear().toString();
    default:
      return dateStr;
  }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return { valid: false, error: 'Date range cannot exceed 1 year' };
  }
  
  return { valid: true };
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    ),
  ];
  
  return csvRows.join('\n');
}

