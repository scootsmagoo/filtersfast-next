/**
 * Customer Returns Page
 * View all return requests and their status
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReturnRequest } from '@/lib/types/returns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/returns');
      if (!response.ok) throw new Error('Failed to fetch returns');
      
      const data = await response.json();
      setReturns(data.returns);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'label_sent':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
      case 'received':
      case 'inspecting':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelingReturnId, setCancelingReturnId] = useState<string | null>(null);

  const initiateCancelReturn = (returnId: string) => {
    setCancelingReturnId(returnId);
    setShowCancelDialog(true);
  };

  const confirmCancelReturn = async () => {
    if (!cancelingReturnId) return;

    try {
      const response = await fetch(`/api/returns/${cancelingReturnId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to cancel return');

      setShowCancelDialog(false);
      setCancelingReturnId(null);
      // Refresh the list
      fetchReturns();
    } catch (err: any) {
      setError(err.message);
      setShowCancelDialog(false);
      setCancelingReturnId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center" role="status" aria-live="polite">
          <span className="sr-only">Loading returns</span>
          <p aria-hidden="true">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Returns</h1>
        <p className="text-gray-600">
          View and manage your return requests
        </p>
      </div>

      {error && (
        <div 
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {returns.length === 0 ? (
        <Card className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
            role="img"
          >
            <title>No returns icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No returns yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't requested any returns. Need to return an order?
          </p>
          <Link href="/account/orders">
            <Button variant="primary">View Orders</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <Card key={returnRequest.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      Return #{returnRequest.id.slice(-8).toUpperCase()}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                        returnRequest.status
                      )}`}
                    >
                      {getStatusText(returnRequest.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Order: {returnRequest.orderNumber} • Requested{' '}
                    {new Date(returnRequest.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${returnRequest.refundAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Refund Amount</p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Return Items</h4>
                <div className="space-y-2">
                  {returnRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-gray-600">
                            Qty: {item.quantity} • Reason: {getStatusText(item.reason)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {returnRequest.trackingNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Tracking Information
                  </p>
                  <p className="text-sm text-blue-700">
                    {returnRequest.carrier}: {returnRequest.trackingNumber}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Link href={`/account/returns/${returnRequest.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                
                {(returnRequest.status === 'approved' || 
                  returnRequest.status === 'label_sent') && 
                  returnRequest.labelUrl && (
                  <a
                    href={`/api/returns/${returnRequest.id}/label`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="primary" className="w-full">
                      Download Label
                    </Button>
                  </a>
                )}

                {returnRequest.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => initiateCancelReturn(returnRequest.id)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Cancel return request ${returnRequest.id.slice(-8).toUpperCase()}`}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <section className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6" aria-labelledby="return-policy-heading">
        <h2 id="return-policy-heading" className="font-semibold text-blue-900 mb-2">Return Policy</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>365-day return window from original ship date</li>
          <li>Free return shipping on all eligible items</li>
          <li>Refund to original payment method</li>
          <li>Custom filters are not eligible for return</li>
          <li>Items damaged during installation cannot be returned</li>
        </ul>
      </section>

      {/* Accessible Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-description"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 id="cancel-dialog-title" className="text-xl font-semibold text-gray-900 mb-4">
              Cancel Return Request
            </h2>
            <p id="cancel-dialog-description" className="text-gray-700 mb-6">
              Are you sure you want to cancel this return request? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelingReturnId(null);
                }}
                autoFocus
              >
                No, Keep Request
              </Button>
              <Button
                variant="primary"
                onClick={confirmCancelReturn}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Cancel Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

