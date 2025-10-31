/**
 * Admin Returns Management Page
 * View and manage all customer return requests
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReturnRequest, ReturnStatus, ReturnStatistics } from '@/lib/types/returns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [statistics, setStatistics] = useState<ReturnStatistics | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statusOptions: Array<{ value: ReturnStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Returns' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'label_sent', label: 'Label Sent' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'received', label: 'Received' },
    { value: 'inspecting', label: 'Inspecting' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchReturns();
  }, [selectedStatus]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      params.append('includeStats', 'true');

      const response = await fetch(`/api/admin/returns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch returns');
      
      const data = await response.json();
      setReturns(data.returns);
      if (data.statistics) {
        setStatistics(data.statistics);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: ReturnStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'approved':
      case 'label_sent':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'in_transit':
      case 'received':
      case 'inspecting':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Returns Management</h1>
        <p className="text-gray-600 dark:text-gray-300 transition-colors">Manage customer return requests and refunds</p>
      </div>

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Returns</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{statistics.totalReturns}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-colors">{statistics.pendingReturns}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">In Process</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 transition-colors">{statistics.processingReturns}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Refunded</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-colors">
              ${statistics.totalRefundAmount.toFixed(0)}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Filter by Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ReturnStatus | 'all')}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={fetchReturns}
            className="ml-auto"
          >
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded transition-colors">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 transition-colors">Loading returns...</p>
        </Card>
      ) : returns.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 transition-colors">No returns found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <Card key={returnRequest.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                      Return #{returnRequest.id.slice(-8).toUpperCase()}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${getStatusBadgeColor(
                        returnRequest.status
                      )}`}
                    >
                      {getStatusText(returnRequest.status)}
                    </span>
                    {returnRequest.status === 'pending' && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium rounded transition-colors">
                        NEEDS ATTENTION
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 transition-colors">
                    <p>Order: {returnRequest.orderNumber}</p>
                    <p>
                      Customer: {returnRequest.customerName} ({returnRequest.customerEmail})
                    </p>
                    <p>
                      Requested: {new Date(returnRequest.requestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                    ${returnRequest.refundAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Refund Amount</p>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 mb-4 transition-colors">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  {returnRequest.items.length} Item(s)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {returnRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      {item.quantity}x {item.productName.substring(0, 30)}...
                    </div>
                  ))}
                </div>
              </div>

              {returnRequest.customerNotes && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-4 transition-colors">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Customer Notes:</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 transition-colors">{returnRequest.customerNotes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t dark:border-gray-700 transition-colors">
                <Link href={`/admin/returns/${returnRequest.id}`} className="flex-1">
                  <Button variant="primary" className="w-full">
                    View & Process
                  </Button>
                </Link>
                <Link href={`/account/orders/${returnRequest.orderId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Order
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Return Reasons Analytics */}
      {statistics && statistics.topReturnReasons.length > 0 && (
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 transition-colors">Top Return Reasons</h2>
          <div className="space-y-3">
            {statistics.topReturnReasons.map((reasonData) => (
              <div key={reasonData.reason} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                      {getStatusText(reasonData.reason)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                      {reasonData.count} ({reasonData.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 transition-colors">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-colors"
                      style={{ width: `${reasonData.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

