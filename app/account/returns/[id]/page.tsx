/**
 * Return Details Page
 * View detailed information about a specific return request
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReturnRequest } from '@/lib/types/returns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReturnDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  const fetchReturnDetails = async () => {
    try {
      const response = await fetch(`/api/returns/${returnId}`);
      if (!response.ok) throw new Error('Failed to fetch return details');
      
      const data = await response.json();
      setReturnRequest(data.returnRequest);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading return details...</div>
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Return not found'}
        </div>
        <Link href="/account/returns" className="mt-4 inline-block">
          <Button variant="outline">← Back to Returns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/account/returns">
          <Button variant="outline">← Back to Returns</Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Return #{returnRequest.id.slice(-8).toUpperCase()}
        </h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>Order {returnRequest.orderNumber}</span>
          <span>•</span>
          <span className={`font-medium ${getStatusColor(returnRequest.status)}`}>
            {getStatusText(returnRequest.status)}
          </span>
        </div>
      </div>

      {/* Return Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Return Status</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
            <div>
              <p className="font-medium text-gray-900">Return Requested</p>
              <p className="text-sm text-gray-600">
                {new Date(returnRequest.requestedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {returnRequest.approvedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
              <div>
                <p className="font-medium text-gray-900">Return Approved</p>
                <p className="text-sm text-gray-600">
                  {new Date(returnRequest.approvedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {returnRequest.labelSentAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
              <div>
                <p className="font-medium text-gray-900">Return Label Sent</p>
                <p className="text-sm text-gray-600">
                  {new Date(returnRequest.labelSentAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {returnRequest.shippedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
              <div>
                <p className="font-medium text-gray-900">Package Shipped</p>
                <p className="text-sm text-gray-600">
                  {new Date(returnRequest.shippedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {returnRequest.receivedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
              <div>
                <p className="font-medium text-gray-900">Return Received</p>
                <p className="text-sm text-gray-600">
                  {new Date(returnRequest.receivedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {returnRequest.completedAt && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
              <div>
                <p className="font-medium text-gray-900">Refund Processed</p>
                <p className="text-sm text-gray-600">
                  {new Date(returnRequest.completedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Return Items */}
      <Card className="p-6 mb-6">
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
                <h3 className="font-medium text-gray-900 mb-1">{item.productName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                </p>
                <div className="text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Reason:</span> {getStatusText(item.reason)}
                  </p>
                  {item.reasonNotes && (
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">Notes:</span> {item.reasonNotes}
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

      {/* Refund Summary */}
      <Card className="p-6 mb-6">
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
            Refund Method: {getStatusText(returnRequest.refundMethod)}
          </p>
        </div>
      </Card>

      {/* Shipping Information */}
      {returnRequest.trackingNumber && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Carrier</p>
              <p className="font-medium">{returnRequest.carrier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tracking Number</p>
              <p className="font-medium">{returnRequest.trackingNumber}</p>
            </div>
            {returnRequest.freeReturnShipping && (
              <p className="text-sm text-green-600 font-medium mt-2">
                ✓ Free return shipping
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {(returnRequest.customerNotes || returnRequest.adminNotes) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          {returnRequest.customerNotes && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Your Notes</p>
              <p className="text-gray-800">{returnRequest.customerNotes}</p>
            </div>
          )}
          {returnRequest.adminNotes && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Support Team Notes</p>
              <p className="text-gray-800">{returnRequest.adminNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Action Button */}
      {(returnRequest.status === 'approved' || returnRequest.status === 'label_sent') && 
        returnRequest.labelUrl && (
        <div className="mt-6">
          <a
            href={`/api/returns/${returnRequest.id}/label`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" className="w-full">
              Download Return Label
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}

