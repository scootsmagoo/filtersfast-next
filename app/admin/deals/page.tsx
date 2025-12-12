'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import Link from 'next/link';
import type { Deal } from '@/lib/types/deal';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

interface DealListResponse {
  success: boolean;
  deals: Deal[];
  total: number;
}

export default function AdminDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<Set<number>>(new Set());

  // Load deals
  const loadDeals = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/deals');
      if (!response.ok) throw new Error('Failed to load deals');

      const data: DealListResponse = await response.json();
      setDeals(data.deals);
    } catch (error) {
      console.error('Error loading deals:', error);
      alert('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
    
    // Check for message in URL
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
      setMessage(decodeURIComponent(msg));
      // Clear from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleDelete = async (iddeal: number, description: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the deal "${description}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/deals/${iddeal}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete deal');
      }

      loadDeals();
      const successMsg = 'Deal deleted successfully';
      setMessage(successMsg);
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = successMsg;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Error deleting deal:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete deal';
      // Use accessible error notification
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
      alert(errorMsg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) {
      // Use accessible error notification
      const errorMsg = 'Please select at least one deal to delete';
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
      alert(errorMsg);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDeals.size} deal(s)? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const ids = Array.from(selectedDeals);
      const response = await fetch(`/api/admin/deals?ids=${ids.join(',')}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete deals');
      }

      setSelectedDeals(new Set());
      loadDeals();
      const successMsg = `${ids.length} deal(s) deleted successfully`;
      setMessage(successMsg);
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = successMsg;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Error deleting deals:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete deals';
      // Use accessible error notification
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'sr-only';
      errorDiv.textContent = errorMsg;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 1000);
      alert(errorMsg);
    }
  };

  const toggleSelectDeal = (iddeal: number) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(iddeal)) {
      newSelected.delete(iddeal);
    } else {
      newSelected.add(iddeal);
    }
    setSelectedDeals(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDeals.size === filteredDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map(d => d.iddeal)));
    }
  };

  const isDealActive = (deal: Deal) => {
    if (deal.active === 0) return false;
    const now = Date.now();
    if (deal.validFrom && now < deal.validFrom) return false;
    if (deal.validTo && now > deal.validTo) return false;
    return true;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'No limit';
    return new Date(timestamp).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.dealdiscription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"
          role="status"
          aria-label="Loading deals"
        >
          <span className="sr-only">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBreadcrumb />
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Deals & Special Offers
              </h1>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">
                Manage special offers and deals based on cart total
              </p>
            </div>
            
            <Link href="/admin/deals/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Deal
              </Button>
            </Link>
          </div>

          {/* Message */}
          {message && (
            <div 
              className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded"
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {/* Search and Bulk Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-label="Search deals"
              />
            </div>
            
            {selectedDeals.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                variant="danger"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedDeals.size})
              </Button>
            )}
          </div>
        </div>

        {/* Deals List */}
        <Card>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm ? 'No deals match your search' : 'No deals found'}
              </p>
              {!searchTerm && (
                <Link href="/admin/deals/new">
                  <Button>Create Your First Deal</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th scope="col" className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDeals.size === filteredDeals.length && filteredDeals.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all deals"
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Price Range
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Free Units
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Valid From
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Valid To
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => {
                    const active = isDealActive(deal);
                    return (
                      <tr
                        key={deal.iddeal}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDeals.has(deal.iddeal)}
                            onChange={() => toggleSelectDeal(deal.iddeal)}
                            aria-label={`Select deal ${deal.dealdiscription}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {deal.dealdiscription}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatPrice(deal.startprice)} - {formatPrice(deal.endprice)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {deal.units} unit{deal.units !== 1 ? 's' : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(deal.validFrom)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(deal.validTo)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              active
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {active ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/deals/${deal.iddeal}`}>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(deal.iddeal, deal.dealdiscription)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              aria-label={`Delete deal ${deal.dealdiscription}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-8">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
              How Deals Work
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Deals are special offers that automatically apply when a customer's cart total falls within a specified price range.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>Price Range:</strong> Set a start price and end price. When the cart total is within this range, the deal applies.</li>
                <li><strong>Free Units:</strong> Specify how many units (products) the customer will receive for free when the deal applies.</li>
                <li><strong>Date Range:</strong> Optionally set valid from/to dates to schedule deals for specific time periods.</li>
                <li><strong>Active Status:</strong> Toggle deals on or off without deleting them.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>Note:</strong> Make sure price ranges don't overlap, or customers may receive multiple deals. The system will apply the deal with the highest start price that matches the cart total.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

