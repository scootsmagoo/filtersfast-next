'use client';

import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { paypalConfig } from '@/lib/paypal';

interface PayPalButtonProps {
  // Order data
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  handling?: number;
  donation?: number;
  insurance?: number;
  total: number;
  
  // Customer & shipping info
  shippingAddress: any;
  billingAddress?: any;
  customerEmail: string;
  customerName: string;
  userId?: string;
  isGuest?: boolean;
  
  // Optional metadata
  promoCode?: string;
  promoDiscount?: number;
  donationCharityId?: string;
  customerNotes?: string;
  shippingMethod?: string;
  
  // Callbacks
  onSuccess?: (data: { orderId: string; orderNumber?: string; paymentSource: string }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

function PayPalButtonContent({ 
  items,
  subtotal,
  shipping,
  tax,
  discount = 0,
  handling = 0,
  donation = 0,
  insurance = 0,
  total,
  shippingAddress,
  billingAddress,
  customerEmail,
  customerName,
  userId,
  isGuest = true,
  promoCode,
  promoDiscount = 0,
  donationCharityId,
  customerNotes,
  shippingMethod,
  onSuccess,
  onError,
  disabled,
}: PayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage('Creating PayPal order...'); // WCAG: Status announcement
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          subtotal,
          shipping,
          tax,
          discount,
          handling,
          donation,
          insurance,
          total,
          shippingAddress,
          customerEmail,
          customerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      setStatusMessage('PayPal order created'); // WCAG: Status announcement
      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create order';
      setStatusMessage(`Error: ${errorMsg}`); // WCAG: Error announcement
      onError?.(errorMsg);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setIsProcessing(true);
      setStatusMessage('Processing payment...'); // WCAG: Status announcement
      
      // Prepare order data for capture
      const orderData = {
        items,
        subtotal,
        shipping,
        tax,
        discount,
        donation,
        insurance,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        customerEmail,
        customerName,
        userId,
        isGuest,
        promoCode,
        promoDiscount,
        donationCharityId,
        customerNotes,
        shippingMethod,
      };

      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
          orderData,
        }),
      });

      const captureData = await response.json();

      if (!response.ok) {
        throw new Error(captureData.error || 'Failed to capture PayPal order');
      }

      setStatusMessage('Payment successful!'); // WCAG: Success announcement
      onSuccess?.({
        orderId: captureData.orderId || data.orderID,
        orderNumber: captureData.orderNumber,
        paymentSource: captureData.paymentSource || 'paypal',
      });
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      setStatusMessage(`Payment failed: ${errorMsg}`); // WCAG: Error announcement
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error('PayPal error:', err);
    const errorMsg = err.message || 'Payment failed';
    setStatusMessage(`Error: ${errorMsg}`); // WCAG: Error announcement
    onError?.(errorMsg);
  };

  if (isPending) {
    return (
      <div 
        className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
        role="status"
        aria-label="Loading PayPal payment options"
        aria-live="polite"
      >
        <div 
          className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
          aria-hidden="true"
        ></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading PayPal...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* WCAG: Screen reader announcements for status changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      
      <div
        role="region"
        aria-label="PayPal payment options"
      >
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
          // Enable Venmo
          fundingSource={undefined} // Allow all funding sources
          // WCAG: Ensure buttons are keyboard accessible (PayPal SDK handles this)
        />
      </div>
      
      {/* WCAG: Visible status with proper contrast */}
      {isProcessing && (
        <div 
          className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300 transition-colors"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2">
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing payment...
          </span>
        </div>
      )}
    </div>
  );
}

export default function PayPalButton(props: PayPalButtonProps) {
  if (!paypalConfig.clientId) {
    return (
      <div 
        className="w-full h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
        role="alert"
        aria-live="polite"
      >
        PayPal not configured
      </div>
    );
  }

  return (
    <PayPalScriptProvider 
      options={{
        ...paypalConfig,
        // Enable Venmo
        'enable-funding': 'venmo',
        // Disable card and credit options (handled by Stripe)
        'disable-funding': 'card,credit',
      }}
    >
      <PayPalButtonContent {...props} />
    </PayPalScriptProvider>
  );
}
