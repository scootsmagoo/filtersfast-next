/**
 * PayPal Payment Gateway Implementation
 * 
 * Implements IPaymentGateway interface for PayPal
 */

import type {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment-gateway';
import { normalizeTransactionStatus } from '../payment-gateway';

export class PayPalGateway implements IPaymentGateway {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal credentials not configured');
    }
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal auth error: ${error.error_description || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Process payment with PayPal
   * 
   * Note: PayPal payments are typically created via client-side SDK,
   * then captured on server-side. This method handles the capture flow.
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();

      // If we have a payment_method (PayPal order ID), capture it
      if (request.payment_method) {
        return await this.captureOrder(request.payment_method, accessToken);
      }

      // Otherwise, create a new order (for server-side integration)
      const orderData = await this.createOrder(request, accessToken);

      return {
        success: false, // Not yet captured, requires approval
        transaction_id: orderData.id,
        gateway_transaction_id: orderData.id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency || 'USD',
        gateway: 'paypal',
        requires_action: true,
        action_url: orderData.links.find((l: any) => l.rel === 'approve')?.href,
        raw_response: orderData,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('PayPal payment error:', error);

      return {
        success: false,
        transaction_id: `error_${Date.now()}`,
        gateway_transaction_id: `error_${Date.now()}`,
        status: 'error',
        amount: request.amount,
        currency: request.currency || 'USD',
        gateway: 'paypal',
        error_message: error.message || 'Payment processing failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Create PayPal order
   */
  private async createOrder(request: PaymentRequest, accessToken: string): Promise<any> {
    const orderPayload: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: request.order_id || 'default',
          invoice_id: request.invoice_number || `INV-${Date.now()}`,
          amount: {
            currency_code: request.currency || 'USD',
            value: request.amount.toFixed(2),
          },
          description: request.description,
        },
      ],
      application_context: {
        brand_name: 'FiltersFast',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: request.return_url || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      },
    };

    // Add items if provided
    if (request.items && request.items.length > 0) {
      orderPayload.purchase_units[0].items = request.items.map((item) => ({
        name: item.name.substring(0, 127),
        unit_amount: {
          currency_code: request.currency || 'USD',
          value: item.unit_price.toFixed(2),
        },
        quantity: item.quantity.toString(),
        sku: item.sku,
        category: 'PHYSICAL_GOODS',
      }));
    }

    // Add shipping address if provided
    if (request.shipping_address) {
      orderPayload.purchase_units[0].shipping = {
        name: {
          full_name: request.shipping_address.name || request.customer_name || '',
        },
        address: {
          address_line_1: request.shipping_address.address_line1,
          address_line_2: request.shipping_address.address_line2 || undefined,
          admin_area_2: request.shipping_address.city,
          admin_area_1: request.shipping_address.state,
          postal_code: request.shipping_address.postal_code,
          country_code: request.shipping_address.country,
        },
      };
    }

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal order error: ${error.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Capture PayPal order
   */
  private async captureOrder(orderId: string, accessToken: string): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal capture error: ${error.message || 'Unknown error'}`);
    }

    const captureData = await response.json();
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = captureData.payer;
    const amount = capture?.amount;

    const success = captureData.status === 'COMPLETED';

    return {
      success,
      transaction_id: orderId,
      gateway_transaction_id: capture?.id || orderId,
      authorization_code: capture?.id,
      status: normalizeTransactionStatus(captureData.status, 'paypal'),
      amount: parseFloat(amount?.value || '0'),
      currency: amount?.currency_code || 'USD',
      gateway: 'paypal',
      payment_method_type: captureData.payment_source?.venmo ? 'venmo' : 'paypal',
      raw_response: captureData,
      processed_at: new Date().toISOString(),
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const refundPayload: any = {
        amount: request.amount
          ? {
              value: request.amount.toFixed(2),
              currency_code: 'USD',
            }
          : undefined,
        note_to_payer: request.reason,
      };

      const response = await fetch(
        `${this.baseUrl}/v2/payments/captures/${request.transaction_id}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(refundPayload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal refund error: ${error.message || 'Unknown error'}`);
      }

      const refundData = await response.json();

      return {
        success: refundData.status === 'COMPLETED',
        refund_id: refundData.id,
        transaction_id: request.transaction_id,
        amount: parseFloat(refundData.amount?.value || '0'),
        currency: refundData.amount?.currency_code || 'USD',
        status: refundData.status === 'COMPLETED' ? 'succeeded' : 'pending',
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('PayPal refund error:', error);

      return {
        success: false,
        refund_id: `error_${Date.now()}`,
        transaction_id: request.transaction_id,
        amount: request.amount || 0,
        currency: 'USD',
        status: 'failed',
        error_message: error.message || 'Refund failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Void transaction (not directly supported by PayPal - use refund)
   */
  async voidTransaction(transactionId: string): Promise<PaymentResponse> {
    // PayPal doesn't have a direct "void" - must use full refund
    const refund = await this.refundPayment({
      transaction_id: transactionId,
    });

    return {
      success: refund.success,
      transaction_id: transactionId,
      gateway_transaction_id: refund.refund_id,
      status: refund.success ? 'voided' : 'error',
      amount: refund.amount,
      currency: refund.currency,
      gateway: 'paypal',
      error_message: refund.error_message,
      processed_at: new Date().toISOString(),
    };
  }

  /**
   * Capture authorization (same as processPayment for PayPal)
   */
  async captureAuthorization(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      return await this.captureOrder(transactionId, accessToken);
    } catch (error: any) {
      console.error('PayPal capture error:', error);

      return {
        success: false,
        transaction_id: transactionId,
        gateway_transaction_id: transactionId,
        status: 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'paypal',
        error_message: error.message || 'Capture failed',
        processed_at: new Date().toISOString(),
      };
    }
  }
}

