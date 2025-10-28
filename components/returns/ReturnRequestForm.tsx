/**
 * Return Request Form Component
 * Allows customers to request returns for order items
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReturnReason, RefundMethod, ReturnEligibility } from '@/lib/types/returns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface ReturnRequestFormProps {
  orderId: string;
  orderNumber: string;
  orderItems: OrderItem[];
  onSuccess?: () => void;
}

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  reason: ReturnReason;
  reasonNotes: string;
}

export function ReturnRequestForm({
  orderId,
  orderNumber,
  orderItems,
  onSuccess
}: ReturnRequestFormProps) {
  const router = useRouter();
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('original_payment');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const returnReasons: { value: ReturnReason; label: string }[] = [
    { value: 'defective', label: 'Defective or Not Working' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'wrong_size', label: 'Wrong Size/Dimensions' },
    { value: 'damaged_shipping', label: 'Damaged During Shipping' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'no_longer_needed', label: 'No Longer Needed' },
    { value: 'ordered_by_mistake', label: 'Ordered by Mistake' },
    { value: 'better_price', label: 'Found Better Price' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    checkEligibility();
  }, [orderId]);

  const checkEligibility = async () => {
    try {
      const response = await fetch(`/api/returns/eligibility?orderId=${orderId}`);
      const data = await response.json();
      setEligibility(data.eligibility);
    } catch (err) {
      setError('Failed to check return eligibility');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const toggleItem = (item: OrderItem) => {
    const newSelected = new Map(selectedItems);
    
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, {
        orderItemId: item.id,
        quantity: item.quantity,
        reason: 'no_longer_needed',
        reasonNotes: ''
      });
    }
    
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    if (item) {
      item.quantity = quantity;
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const updateItemReason = (itemId: string, reason: ReturnReason) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    if (item) {
      item.reason = reason;
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    if (item) {
      item.reasonNotes = notes;
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const calculateRefundAmount = () => {
    let subtotal = 0;
    selectedItems.forEach((selectedItem) => {
      const orderItem = orderItems.find(oi => oi.id === selectedItem.orderItemId);
      if (orderItem) {
        subtotal += orderItem.price * selectedItem.quantity;
      }
    });
    const tax = subtotal * 0.09; // Approximate tax
    return subtotal + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.size === 0) {
      setError('Please select at least one item to return');
      return;
    }

    // Validate that all selected items have a reason
    for (const item of selectedItems.values()) {
      if (!item.reason) {
        setError('Please select a reason for each item');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          items: Array.from(selectedItems.values()),
          refundMethod,
          customerNotes: customerNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit return request');
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/account/returns/${data.returnRequest.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingEligibility) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600" role="status" aria-live="polite">
          <span className="sr-only">Checking return eligibility</span>
          <span aria-hidden="true">Checking return eligibility...</span>
        </p>
      </Card>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <Card className="p-6">
        <div className="text-center" role="alert" aria-live="assertive">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
            role="img"
          >
            <title>Warning icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Return Not Available</h2>
          <p className="text-gray-600">{eligibility?.reason}</p>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Return request form">
      <div className="space-y-6">
        {/* Order Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Return Request for Order {orderNumber}</h2>
          {eligibility.daysRemaining !== undefined && (
            <p className="text-sm text-gray-600">
              You have {eligibility.daysRemaining} days remaining in your return window
            </p>
          )}
        </Card>

        {/* Select Items */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4" id="select-items-heading">Select Items to Return</h3>
          
          {error && (
            <div 
              className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" 
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            {orderItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedItem = selectedItems.get(item.id);

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={isSelected}
                      onChange={() => toggleItem(item)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select ${item.productName} for return`}
                      aria-describedby={`item-${item.id}-details`}
                    />
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={`${item.productName} product image`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1" id={`item-${item.id}-details`}>
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} × {item.quantity} = ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {isSelected && selectedItem && (
                    <div className="ml-8 space-y-4 mt-4 pt-4 border-t">
                      <div>
                        <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity to Return
                        </label>
                        <select
                          id={`quantity-${item.id}`}
                          value={selectedItem.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          aria-label={`Select quantity to return for ${item.productName}`}
                        >
                          {Array.from({ length: item.quantity }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`reason-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Return <span className="text-red-600" aria-label="required">*</span>
                        </label>
                        <select
                          id={`reason-${item.id}`}
                          value={selectedItem.reason}
                          onChange={(e) => updateItemReason(item.id, e.target.value as ReturnReason)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                          aria-required="true"
                          aria-label={`Select return reason for ${item.productName}`}
                        >
                          {returnReasons.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`notes-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Details (Optional)
                        </label>
                        <textarea
                          id={`notes-${item.id}`}
                          value={selectedItem.reasonNotes}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          rows={2}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Please provide any additional details..."
                          aria-label={`Additional details for returning ${item.productName}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Refund Method */}
        {selectedItems.size > 0 && (
          <>
            <Card className="p-6">
              <fieldset>
                <legend className="font-semibold text-lg mb-4">Refund Method</legend>
                <div className="space-y-3" role="radiogroup" aria-label="Choose refund method">
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="radio"
                      id="refund-original"
                      name="refundMethod"
                      value="original_payment"
                      checked={refundMethod === 'original_payment'}
                      onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Original Payment Method</p>
                      <p className="text-sm text-gray-600">
                        Refund to your original payment method (3-5 business days)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="radio"
                      id="refund-credit"
                      name="refundMethod"
                      value="store_credit"
                      checked={refundMethod === 'store_credit'}
                      onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Store Credit</p>
                      <p className="text-sm text-gray-600">
                        Get store credit immediately (faster processing)
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>
            </Card>

            {/* Additional Notes */}
            <Card className="p-6">
              <label htmlFor="customer-notes" className="font-semibold text-lg mb-4 block">
                Additional Notes (Optional)
              </label>
              <textarea
                id="customer-notes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Any additional information about your return..."
                aria-label="Additional notes about your return"
              />
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-gray-50" role="region" aria-labelledby="summary-heading">
              <h3 id="summary-heading" className="font-semibold text-lg mb-4">Return Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>{selectedItems.size} item(s) selected</span>
                  <span className="font-medium" aria-label={`Estimated refund amount: ${calculateRefundAmount().toFixed(2)} dollars`}>
                    ${calculateRefundAmount().toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Estimated refund amount (including tax). Original shipping costs are not refundable.
                </p>
                <p className="text-sm text-green-600 font-medium" role="note">
                  <span aria-hidden="true">✓</span> Free return shipping included
                </p>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
                className="flex-1"
                aria-label="Cancel return request"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || selectedItems.size === 0}
                className="flex-1"
                aria-label={submitting ? 'Submitting return request' : 'Submit return request'}
                aria-disabled={submitting || selectedItems.size === 0}
              >
                {submitting ? (
                  <>
                    <span className="sr-only">Submitting return request, please wait</span>
                    <span aria-hidden="true">Submitting...</span>
                  </>
                ) : (
                  'Submit Return Request'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

