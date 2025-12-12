'use client';

import React, { useMemo } from 'react';
import { formatCurrency, formatNumber, getChartColor } from '@/lib/analytics-utils';

interface RevenueChartProps {
  data: { period: string; revenue: number; orderCount: number }[];
  title: string;
}

export function RevenueChart({ data, title }: RevenueChartProps) {
  const maxRevenue = useMemo(() => Math.max(...data.map(d => d.revenue), 1), [data]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h3>
      <div 
        className="space-y-3"
        role="list"
        aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {data.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available for selected period</p>
        ) : (
          data.map((item, index) => (
            <div key={index} className="space-y-1" role="listitem">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{item.period}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
              <div 
                className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden"
                role="progressbar"
                aria-valuenow={item.revenue}
                aria-valuemin={0}
                aria-valuemax={maxRevenue}
                aria-label={`${item.period}: ${formatCurrency(item.revenue)} from ${item.orderCount} orders`}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#f26722] to-[#ff8c4a] transition-all duration-500"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                >
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium" aria-hidden="true">
                    {item.orderCount} orders
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface TopItemsChartProps {
  items: { name: string; value: number; label?: string }[];
  title: string;
  valueFormatter?: (value: number) => string;
}

export function TopItemsChart({ items, title, valueFormatter = formatNumber }: TopItemsChartProps) {
  const maxValue = useMemo(() => Math.max(...items.map(d => d.value), 1), [items]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h3>
      <div 
        className="space-y-3"
        role="list"
        aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available for selected period</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="space-y-1" role="listitem">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 truncate max-w-[60%]">
                  {index + 1}. {item.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {valueFormatter(item.value)}
                </span>
              </div>
              <div 
                className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden"
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-label={`${item.name}: ${valueFormatter(item.value)}${item.label ? `, ${item.label}` : ''}`}
              >
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-500"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: getChartColor(index),
                  }}
                >
                  {item.label && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium" aria-hidden="true">
                      {item.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: { label: string; value: number }[];
  title: string;
  valueFormatter?: (value: number) => string;
}

export function PieChart({ data, title, valueFormatter = formatNumber }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h3>
      <div 
        className="space-y-3"
        role="list"
        aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {data.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available for selected period</p>
        ) : (
          data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center justify-between" role="listitem">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: getChartColor(index) }}
                    role="img"
                    aria-label={`Color indicator for ${item.label}`}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {valueFormatter(item.value)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Horizontal stacked bar */}
      {data.length > 0 && (
        <div 
          className="mt-4 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex"
          role="img"
          aria-label={`Distribution: ${data.map(item => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return `${item.label} ${percentage.toFixed(1)}%`;
          }).join(', ')}`}
        >
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={index}
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: getChartColor(index),
                }}
                title={`${item.label}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface LineChartProps {
  data: { date: string; value: number }[];
  title: string;
  valueFormatter?: (value: number) => string;
  color?: string;
}

export function LineChart({ 
  data, 
  title, 
  valueFormatter = formatCurrency,
  color = '#f26722',
}: LineChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const minValue = useMemo(() => Math.min(...data.map(d => d.value), 0), [data]);
  const range = maxValue - minValue;
  
  const points = useMemo(() => {
    const width = 100;
    const height = 100;
    const segmentWidth = width / Math.max(data.length - 1, 1);
    
    return data.map((item, index) => {
      const x = index * segmentWidth;
      const normalizedValue = range > 0 ? ((item.value - minValue) / range) : 0.5;
      const y = height - (normalizedValue * height);
      return { x, y, value: item.value, date: item.date };
    });
  }, [data, minValue, range]);
  
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    const startPoint = points[0];
    let path = `M ${startPoint.x} ${startPoint.y}`;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      path += ` L ${point.x} ${point.y}`;
    }
    
    return path;
  }, [points]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h3>
      
      <div className="relative">
        {data.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">No data available for selected period</p>
        ) : (
          <>
            {/* SVG Chart */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-48"
              preserveAspectRatio="none"
              role="img"
              aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
              aria-describedby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}-desc`}
            >
              <title id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}-desc`}>
                Line chart showing trend from {data[0]?.date} to {data[data.length - 1]?.date}
              </title>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-gray-200 dark:text-gray-700"
                />
              ))}
              
              {/* Area under the line */}
              {points.length > 0 && (
                <path
                  d={`${pathD} L ${points[points.length - 1].x} 100 L 0 100 Z`}
                  fill={`${color}20`}
                />
              )}
              
              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Data points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill={color}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            
            {/* Date range labels */}
            <div className="mt-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>
      
      {/* Stats */}
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Min</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {valueFormatter(minValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {valueFormatter(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Max</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {valueFormatter(maxValue)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  valueFormatter?: (value: number) => string;
}

export function StatCard({ title, value, change, icon, valueFormatter }: StatCardProps) {
  const formattedValue = typeof value === 'number' && valueFormatter 
    ? valueFormatter(value) 
    : value;
  
  const changeColor = change !== undefined
    ? change >= 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
    : '';
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      role="article"
      aria-label={`${title} statistic`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white" aria-live="polite">
            {formattedValue}
          </p>
          {change !== undefined && (
            <p className={`mt-2 text-sm ${changeColor}`} aria-live="polite">
              <span aria-hidden="true">{change >= 0 ? '↑' : '↓'}</span>
              <span className="sr-only">{change >= 0 ? 'Increased' : 'Decreased'} by</span>
              {' '}{Math.abs(change).toFixed(1)}% from previous period
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-[#f26722]" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface DataTableProps {
  columns: { key: string; label: string; formatter?: (value: any) => string }[];
  data: any[];
  title: string;
}

export function DataTable({ columns, data, title }: DataTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 id={`table-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          aria-labelledby={`table-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available for selected period
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {column.formatter
                        ? column.formatter(row[column.key])
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

