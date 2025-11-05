/**
 * Stripe Payment Gateway Implementation
 * 
 * Implements IPaymentGateway interface for Stripe
 */

import { getStripeOrThrow } from '../stripe';
import type {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment-gateway';
import { normalizeTransactionStatus, determinePaymentMethodType } from '../payment-gateway';

export class StripeGateway implements IPaymentGateway {
  private stripe;

  constructor() {
    this.stripe = getStripeOrThrow();
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amountInCents = Math.round(request.amount * 100);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: request.currency?.toLowerCase() || 'usd',
        customer: request.customer_id,
        payment_method: request.payment_method,
        confirm: true,
        capture_method: request.capture_now === false ? 'manual' : 'automatic',
        description: request.description,
        metadata: {
          order_id: request.order_id || '',
          ...request.metadata,
        },
        receipt_email: request.customer_email,
        ...(request.billing_address && {
          billing_details: {
            name: request.customer_name,
            email: request.customer_email,
            address: {
              line1: request.billing_address.address_line1,
              line2: request.billing_address.address_line2 || undefined,
              city: request.billing_address.city,
              state: request.billing_address.state,
              postal_code: request.billing_address.postal_code,
              country: request.billing_address.country,
            },
          },
        }),
        ...(request.shipping_address && {
          shipping: {
            name: request.shipping_address.name || request.customer_name || '',
            phone: request.shipping_address.phone,
            address: {
              line1: request.shipping_address.address_line1,
              line2: request.shipping_address.address_line2 || undefined,
              city: request.shipping_address.city,
              state: request.shipping_address.state,
              postal_code: request.shipping_address.postal_code,
              country: request.shipping_address.country,
            },
          },
        }),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      // Check if requires action (3D Secure)
      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
        return {
          success: false,
          transaction_id: paymentIntent.id,
          gateway_transaction_id: paymentIntent.id,
          status: 'pending',
          amount: request.amount,
          currency: request.currency || 'USD',
          gateway: 'stripe',
          requires_action: true,
          action_url: paymentIntent.next_action?.redirect_to_url?.url,
          processed_at: new Date().toISOString(),
        };
      }

      // Check payment status
      const success = paymentIntent.status === 'succeeded';
      const status = normalizeTransactionStatus(paymentIntent.status, 'stripe');

      // Get payment method details
      let cardLast4: string | undefined;
      let cardBrand: string | undefined;
      let paymentMethodToken: string | undefined;

      if (paymentIntent.payment_method) {
        const paymentMethod = typeof paymentIntent.payment_method === 'string'
          ? await this.stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          : paymentIntent.payment_method;

        if (paymentMethod.card) {
          cardLast4 = paymentMethod.card.last4;
          cardBrand = paymentMethod.card.brand;
        }

        paymentMethodToken = typeof paymentIntent.payment_method === 'string'
          ? paymentIntent.payment_method
          : paymentIntent.payment_method.id;
      }

      return {
        success,
        transaction_id: paymentIntent.id,
        gateway_transaction_id: paymentIntent.id,
        authorization_code: paymentIntent.id,
        status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        gateway: 'stripe',
        payment_method_type: determinePaymentMethodType(cardBrand),
        payment_method_token: paymentMethodToken,
        card_last4: cardLast4,
        card_brand: cardBrand,
        error_code: !success ? paymentIntent.last_payment_error?.code : undefined,
        error_message: !success ? paymentIntent.last_payment_error?.message : undefined,
        raw_response: paymentIntent,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Stripe payment error:', error);

      return {
        success: false,
        transaction_id: `error_${Date.now()}`,
        gateway_transaction_id: `error_${Date.now()}`,
        status: 'error',
        amount: request.amount,
        currency: request.currency || 'USD',
        gateway: 'stripe',
        error_code: error.code || 'unknown_error',
        error_message: error.message || 'Payment processing failed',
        decline_reason: error.decline_code,
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: request.transaction_id,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as any,
        metadata: request.metadata,
      });

      return {
        success: refund.status === 'succeeded',
        refund_id: refund.id,
        transaction_id: request.transaction_id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Stripe refund error:', error);

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
   * Void transaction
   */
  async voidTransaction(transactionId: string): Promise<PaymentResponse> {
    try {
      // In Stripe, void is done by canceling the payment intent
      const paymentIntent = await this.stripe.paymentIntents.cancel(transactionId);

      return {
        success: true,
        transaction_id: paymentIntent.id,
        gateway_transaction_id: paymentIntent.id,
        status: 'voided',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        gateway: 'stripe',
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Stripe void error:', error);

      return {
        success: false,
        transaction_id: transactionId,
        gateway_transaction_id: transactionId,
        status: 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'stripe',
        error_message: error.message || 'Void failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Capture authorization
   */
  async captureAuthorization(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(transactionId, {
        amount_to_capture: amount ? Math.round(amount * 100) : undefined,
      });

      const success = paymentIntent.status === 'succeeded';

      return {
        success,
        transaction_id: paymentIntent.id,
        gateway_transaction_id: paymentIntent.id,
        status: normalizeTransactionStatus(paymentIntent.status, 'stripe'),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        gateway: 'stripe',
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Stripe capture error:', error);

      return {
        success: false,
        transaction_id: transactionId,
        gateway_transaction_id: transactionId,
        status: 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'stripe',
        error_message: error.message || 'Capture failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Tokenize payment method
   */
  async tokenizePaymentMethod(request: PaymentRequest): Promise<{
    token: string;
    card_last4?: string;
    card_brand?: string;
    expires?: string;
  }> {
    try {
      // Create customer if needed
      let customerId = request.customer_id;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: request.customer_email,
          name: request.customer_name,
        });
        customerId = customer.id;
      }

      // Create payment method
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: request.card_number!,
          exp_month: parseInt(request.card_exp_month!),
          exp_year: parseInt(request.card_exp_year!),
          cvc: request.card_cvv,
        },
        billing_details: request.billing_address ? {
          name: request.billing_address.name || request.customer_name,
          email: request.customer_email,
          address: {
            line1: request.billing_address.address_line1,
            line2: request.billing_address.address_line2 || undefined,
            city: request.billing_address.city,
            state: request.billing_address.state,
            postal_code: request.billing_address.postal_code,
            country: request.billing_address.country,
          },
        } : undefined,
      });

      // Attach to customer
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      return {
        token: paymentMethod.id,
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
        expires: paymentMethod.card
          ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`
          : undefined,
      };
    } catch (error: any) {
      console.error('Stripe tokenization error:', error);
      throw new Error(error.message || 'Failed to tokenize payment method');
    }
  }

  /**
   * Verify payment method
   */
  async verifyPaymentMethod(paymentMethodToken: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodToken);

      return {
        valid: paymentMethod && paymentMethod.id === paymentMethodToken,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Payment method not found',
      };
    }
  }
}

