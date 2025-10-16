export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
  }>;
}

export interface PayPalConfig {
  clientId: string;
  currency: string;
  intent: 'capture' | 'authorize';
  environment: 'sandbox' | 'production';
}

export const paypalConfig: PayPalConfig = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'USD',
  intent: 'capture',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
};

export const formatAmountForPayPal = (amount: number): string => {
  return amount.toFixed(2);
};

export const createPayPalOrder = async (items: any[], total: number) => {
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

  if (!response.ok) {
    throw new Error('Failed to create PayPal order');
  }

  return response.json();
};

export const capturePayPalOrder = async (orderId: string) => {
  const response = await fetch('/api/paypal/capture-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error('Failed to capture PayPal order');
  }

  return response.json();
};
