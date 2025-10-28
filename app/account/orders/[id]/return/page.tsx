/**
 * New Return Request Page
 * Page for initiating a return for a specific order
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ReturnRequestForm } from '@/components/returns/ReturnRequestForm';
import Button from '@/components/ui/Button';

export default function NewReturnPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      // TODO: Replace with actual order fetch
      // For now, using mock data
      setOrder({
        id: orderId,
        orderNumber: `FF-${orderId.slice(-5)}`,
        items: [
          {
            id: 'item1',
            productId: 'prod1',
            productName: 'FiltersFast 16x25x4 MERV 11 Air Filter',
            productImage: '/products/filter-16x25x4.jpg',
            quantity: 2,
            price: 29.99,
            totalPrice: 59.98
          },
          {
            id: 'item2',
            productId: 'prod2',
            productName: 'FiltersFast 20x20x1 MERV 8 Air Filter (6-Pack)',
            quantity: 1,
            price: 49.99,
            totalPrice: 49.99
          }
        ]
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Order not found'}
        </div>
        <Link href="/account/orders">
          <Button variant="outline">← Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/account/orders/${orderId}`}>
          <Button variant="outline">← Back to Order</Button>
        </Link>
      </div>

      <ReturnRequestForm
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderItems={order.items}
      />
    </div>
  );
}

