'use client';

import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { paypalConfig } from '@/lib/paypal';
import { useCart } from '@/lib/cart-context';

interface PayPalButtonProps {
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

function PayPalButtonContent({ onSuccess, onError, disabled }: PayPalButtonProps) {
  const { items, total } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to create order');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      const captureData = await response.json();

      if (!response.ok) {
        throw new Error(captureData.error || 'Failed to capture PayPal order');
      }

      onSuccess?.(data.orderID);
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error('PayPal error:', err);
    onError?.(err.message || 'Payment failed');
  };

  if (isPending) {
    return (
      <div className="w-full h-12 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handlePayPalError}
        disabled={disabled || isProcessing || items.length === 0}
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 45,
        }}
      />
      {isProcessing && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Processing payment...
        </div>
      )}
    </div>
  );
}

export default function PayPalButton(props: PayPalButtonProps) {
  if (!paypalConfig.clientId) {
    return (
      <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        PayPal not configured
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={paypalConfig}>
      <PayPalButtonContent {...props} />
    </PayPalScriptProvider>
  );
}
