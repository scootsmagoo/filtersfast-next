'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface Shipment {
  idShipment: number;
  shipmentNumber: string;
  supplierName: string;
  supplierPO: string | null;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  expectedDate: string | null;
  receivedDate: string | null;
  createdDate: string;
  trackingNumber: string | null;
  carrier: string | null;
  totalItems: number;
  totalCost: number;
  itemCount: number;
  totalExpectedQty: number;
  totalReceivedQty: number;
  createdByUsername: string;
}

interface ShipmentsResponse {
  success: boolean;
  data: Shipment[];
  statusSummary: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Load shipments
  const loadShipments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/inventory/shipments?${params}`);
      if (!response.ok) throw new Error('Failed to load shipments');

      const data: ShipmentsResponse = await response.json();
      setShipments(data.data);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error loading shipments:', error);
      alert('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [page, search, statusFilter]);

  // Status badge component
  const StatusBadge = ({ status }: { status: Shipment['status'] }) => {
    const configs = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock,
        label: 'Pending'
      },
      in_transit: { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Truck,
        label: 'In Transit'
      },
      received: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        label: 'Received'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        label: 'Cancelled'
      }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb items={[
            { label: 'Products', href: '/admin/products', icon: Package }
          ]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Inbound Shipments
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage incoming inventory shipments from suppliers
              </p>
            </div>
            <Link href="/admin/products/shipments/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Shipment
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="shipment-search" className="sr-only">
                Search shipments
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <input
                  id="shipment-search"
                  type="text"
                  placeholder="Search by shipment number, supplier, or PO..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                  aria-label="Search shipments by number, supplier, or PO"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-label="Filter shipments by status"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Shipments Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4" aria-hidden="true"></div>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading shipments...</p>
              <span className="sr-only">Loading shipments, please wait</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="p-12 text-center" role="status">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                No shipments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                {search || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first inbound shipment to get started'}
              </p>
              <Link href="/admin/products/shipments/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  New Shipment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Inbound shipments list">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Shipment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {shipments.map((shipment) => (
                    <tr key={shipment.idShipment} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                            {shipment.shipmentNumber}
                          </div>
                          {shipment.supplierPO && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                              PO: {shipment.supplierPO}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {shipment.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {shipment.status === 'received' 
                          ? `${shipment.totalReceivedQty} received`
                          : `${shipment.totalExpectedQty} expected`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        {shipment.expectedDate 
                          ? new Date(shipment.expectedDate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors">
                        ${shipment.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/products/shipments/${shipment.idShipment}`}>
                          <Button variant="secondary" size="sm" aria-label={`View shipment ${shipment.shipmentNumber}`}>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav 
              className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
              aria-label="Shipment pagination"
            >
              <div className="text-sm text-gray-700 dark:text-gray-300 transition-colors" role="status" aria-live="polite">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} shipments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Go to previous page"
                  aria-disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Go to next page"
                  aria-disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </Card>
      </div>
    </div>
  );
}

