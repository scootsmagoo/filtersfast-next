/**
 * Admin Return Details & Processing Page
 * Detailed view of a return request with status management
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReturnRequest, ReturnStatus, UpdateReturnStatus } from '@/lib/types/returns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

export default function AdminReturnDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [newStatus, setNewStatus] = useState<ReturnStatus>('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('UPS');
  const [adminNotes, setAdminNotes] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const statusOptions: Array<{ value: ReturnStatus; label: string; description: string }> = [
    { value: 'pending', label: 'Pending', description: 'Awaiting approval' },
    { value: 'approved', label: 'Approved', description: 'Return approved, ready for label' },
    { value: 'label_sent', label: 'Label Sent', description: 'Return label sent to customer' },
    { value: 'in_transit', label: 'In Transit', description: 'Package on the way back' },
    { value: 'received', label: 'Received', description: 'Package received at warehouse' },
    { value: 'inspecting', label: 'Inspecting', description: 'Items being inspected' },
    { value: 'completed', label: 'Completed', description: 'Refund processed' },
    { value: 'rejected', label: 'Rejected', description: 'Return request denied' },
    { value: 'cancelled', label: 'Cancelled', description: 'Cancelled by customer' }
  ];

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  useEffect(() => {
    if (returnRequest) {
      setNewStatus(returnRequest.status);
      setTrackingNumber(returnRequest.trackingNumber || '');
      setCarrier(returnRequest.carrier || 'UPS');
      setAdminNotes(returnRequest.adminNotes || '');
      setInspectionNotes(returnRequest.inspectionNotes || '');
      setRefundAmount(returnRequest.refundAmount.toString());
    }
  }, [returnRequest]);

  const fetchReturnDetails = async () => {
    try {
      const response = await fetch(`/api/admin/returns/${returnId}`);
      if (!response.ok) throw new Error('Failed to fetch return details');
      
      const data = await response.json();
      setReturnRequest(data.returnRequest);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const update: UpdateReturnStatus = {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
        inspectionNotes: inspectionNotes.trim() || undefined,
        refundAmount: parseFloat(refundAmount) || undefined
      };

      if (trackingNumber.trim()) {
        update.trackingNumber = trackingNumber.trim();
        update.carrier = carrier;
      }

      const response = await fetch(`/api/admin/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...update,
          previousStatus: returnRequest?.status
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update return');
      }

      // Refresh the return details
      await fetchReturnDetails();
      
      alert('Return updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
      case 'label_sent':
        return 'text-blue-600';
      case 'in_transit':
      case 'received':
      case 'inspecting':
        return 'text-purple-600';
      case 'completed':
        return 'text-green-600';
      case 'rejected':
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">Loading return details...</div>
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Return not found'}
        </div>
        <Link href="/admin/returns">
          <Button variant="outline">← Back to Returns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/returns">
          <Button variant="outline">← Back to Returns</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Return Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Return #{returnRequest.id.slice(-8).toUpperCase()}
                </h1>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Order: {returnRequest.orderNumber}</p>
                  <p>Customer: {returnRequest.customerName}</p>
                  <p>Email: {returnRequest.customerEmail}</p>
                  <p>
                    Requested: {new Date(returnRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-semibold ${getStatusColor(returnRequest.status)}`}>
                {getStatusText(returnRequest.status)}
              </span>
            </div>
          </Card>

          {/* Return Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Return Items</h2>
            <div className="space-y-4">
              {returnRequest.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {getStatusText(item.reason)}
                      </p>
                      {item.reasonNotes && (
                        <p className="text-sm">
                          <span className="font-medium">Notes:</span> {item.reasonNotes}
                        </p>
                      )}
                      {item.condition && (
                        <p className="text-sm">
                          <span className="font-medium">Condition:</span> {item.condition}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Notes */}
          {returnRequest.customerNotes && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Customer Notes</h2>
              <p className="text-gray-700 bg-gray-50 p-4 rounded">
                {returnRequest.customerNotes}
              </p>
            </Card>
          )}

          {/* Refund Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Refund Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${returnRequest.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax</span>
                <span>${returnRequest.tax.toFixed(2)}</span>
              </div>
              {returnRequest.shippingRefund > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Shipping Refund</span>
                  <span>${returnRequest.shippingRefund.toFixed(2)}</span>
                </div>
              )}
              {returnRequest.restockingFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Restocking Fee</span>
                  <span>-${returnRequest.restockingFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                <span>Total Refund</span>
                <span>${returnRequest.refundAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Method: {getStatusText(returnRequest.refundMethod)}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column - Status Management */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Process Return</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReturnStatus)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {(newStatus === 'label_sent' || newStatus === 'in_transit') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter tracking number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carrier
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="FedEx">FedEx</option>
                      <option value="DHL">DHL</option>
                    </select>
                  </div>
                </>
              )}

              {newStatus === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Refund Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Internal notes..."
                />
              </div>

              {(newStatus === 'inspecting' || newStatus === 'completed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspection Notes
                  </label>
                  <textarea
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Item condition, packaging notes..."
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={updating}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Return Status'}
              </Button>
            </form>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/account/orders/${returnRequest.orderId}`}>
                <Button variant="outline" className="w-full">
                  View Original Order
                </Button>
              </Link>
              <Link href={`/admin/customers/${returnRequest.customerId}`}>
                <Button variant="outline" className="w-full">
                  View Customer Profile
                </Button>
              </Link>
              {returnRequest.labelUrl && (
                <a
                  href={returnRequest.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    View Return Label
                  </Button>
                </a>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Requested</p>
                <p className="text-gray-600">
                  {new Date(returnRequest.requestedAt).toLocaleString()}
                </p>
              </div>
              {returnRequest.approvedAt && (
                <div>
                  <p className="font-medium text-gray-900">Approved</p>
                  <p className="text-gray-600">
                    {new Date(returnRequest.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {returnRequest.labelSentAt && (
                <div>
                  <p className="font-medium text-gray-900">Label Sent</p>
                  <p className="text-gray-600">
                    {new Date(returnRequest.labelSentAt).toLocaleString()}
                  </p>
                </div>
              )}
              {returnRequest.receivedAt && (
                <div>
                  <p className="font-medium text-gray-900">Received</p>
                  <p className="text-gray-600">
                    {new Date(returnRequest.receivedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {returnRequest.completedAt && (
                <div>
                  <p className="font-medium text-gray-900">Completed</p>
                  <p className="text-gray-600">
                    {new Date(returnRequest.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

