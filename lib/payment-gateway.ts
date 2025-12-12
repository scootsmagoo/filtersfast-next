/**
 * Payment Gateway Abstraction Layer
 * 
 * Unified interface for all payment gateways (Stripe, PayPal, Authorize.Net, CyberSource)
 * Handles gateway selection, failover, and transaction processing
 */

import type {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentGatewayType,
  TransactionStatus,
} from './types/payment-gateway';

import {
  getPrimaryPaymentGateway,
  getBackupPaymentGateway,
  getPaymentGatewayByType,
  getActivePaymentGateways,
  logPaymentGatewayTransaction,
} from './db/payment-gateways';

import { StripeGateway } from './payment-gateways/stripe-gateway';
import { PayPalGateway } from './payment-gateways/paypal-gateway';
import { AuthorizeNetGateway } from './payment-gateways/authorizenet-gateway';
import { CyberSourceGateway } from './payment-gateways/cybersource-gateway';

/**
 * Payment Gateway Manager
 * 
 * Manages payment processing across multiple gateways with automatic failover
 */
export class PaymentGatewayManager {
  private gateways: Map<PaymentGatewayType, IPaymentGateway> = new Map();

  constructor() {
    this.initializeGateways();
  }

  /**
   * Initialize all available payment gateways
   */
  private initializeGateways(): void {
    try {
      this.gateways.set('stripe', new StripeGateway());
    } catch (error) {
      console.warn('Stripe gateway initialization failed:', error);
    }

    try {
      this.gateways.set('paypal', new PayPalGateway());
    } catch (error) {
      console.warn('PayPal gateway initialization failed:', error);
    }

    try {
      this.gateways.set('authorizenet', new AuthorizeNetGateway());
    } catch (error) {
      console.warn('Authorize.Net gateway initialization failed:', error);
    }

    try {
      this.gateways.set('cybersource', new CyberSourceGateway());
    } catch (error) {
      console.warn('CyberSource gateway initialization failed:', error);
    }
  }

  /**
   * Get gateway instance
   */
  private getGateway(type: PaymentGatewayType): IPaymentGateway | null {
    return this.gateways.get(type) || null;
  }

  /**
   * Select appropriate gateway for processing
   */
  private async selectGateway(preferredGateway?: PaymentGatewayType): Promise<{
    gateway: IPaymentGateway;
    type: PaymentGatewayType;
  } | null> {
    // If preferred gateway is specified and available, use it
    if (preferredGateway) {
      const gatewayConfig = getPaymentGatewayByType(preferredGateway);
      if (gatewayConfig && gatewayConfig.status === 'active') {
        const gateway = this.getGateway(preferredGateway);
        if (gateway) {
          return { gateway, type: preferredGateway };
        }
      }
    }

    // Otherwise, use primary gateway
    const primaryConfig = getPrimaryPaymentGateway();
    if (primaryConfig) {
      const gateway = this.getGateway(primaryConfig.gateway_type);
      if (gateway) {
        return { gateway, type: primaryConfig.gateway_type };
      }
    }

    // Fall back to any active gateway
    const gateways = [
      { type: 'stripe' as PaymentGatewayType, instance: this.gateways.get('stripe') },
      { type: 'paypal' as PaymentGatewayType, instance: this.gateways.get('paypal') },
      { type: 'authorizenet' as PaymentGatewayType, instance: this.gateways.get('authorizenet') },
      { type: 'cybersource' as PaymentGatewayType, instance: this.gateways.get('cybersource') },
    ];

    for (const { type, instance } of gateways) {
      if (instance) {
        const config = getPaymentGatewayByType(type);
        if (config && config.status === 'active') {
          return { gateway: instance, type };
        }
      }
    }

    return null;
  }

  /**
   * Process payment with automatic gateway selection and failover
   */
  async processPayment(
    request: PaymentRequest,
    preferredGateway?: PaymentGatewayType
  ): Promise<PaymentResponse> {
    const selectedGateway = await this.selectGateway(preferredGateway);

    if (!selectedGateway) {
      throw new Error('No active payment gateway available');
    }

    const attempted = new Set<PaymentGatewayType>();
    const errors: Array<{ type: PaymentGatewayType; error: unknown }> = [];

    const activeConfigs = getActivePaymentGateways();
    const backupConfig = getBackupPaymentGateway();

    const queue: PaymentGatewayType[] = [];

    // Start with preferred/primary selection
    queue.push(selectedGateway.type);

    // Explicit backup (if configured)
    if (backupConfig && !queue.includes(backupConfig.gateway_type)) {
      queue.push(backupConfig.gateway_type);
    }

    // Add remaining active gateways not already queued
    for (const config of activeConfigs) {
      if (!queue.includes(config.gateway_type)) {
        queue.push(config.gateway_type);
      }
    }

    // Finally, add any gateways we initialized but are inactive (best-effort fallback)
    for (const type of ['stripe', 'paypal', 'authorizenet', 'cybersource'] as PaymentGatewayType[]) {
      if (!queue.includes(type)) {
        queue.push(type);
      }
    }

    for (const type of queue) {
      if (attempted.has(type)) continue;
      attempted.add(type);

      const gateway = this.getGateway(type);
      if (!gateway) continue;

      if (
        type === 'cybersource' &&
        (!request.card_number || !request.card_exp_month || !request.card_exp_year)
      ) {
        console.warn(
          'Skipping CyberSource failover: required card details are not present on the payment request.',
        );
        continue;
      }

      try {
        if (attempted.size > 1) {
          console.log(`Attempting gateway failover to ${type}...`);
        }

        const response = await gateway.processPayment(request);
        this.logTransaction(type, request, response);
        return response;
      } catch (error) {
        console.error(`Payment attempt failed with ${type}:`, error);
        errors.push({ type, error });
      }
    }

    const lastError = errors[errors.length - 1]?.error;
    throw new Error(
      lastError instanceof Error
        ? lastError.message
        : 'Payment processing failed across all gateways. Please try again.',
    );
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    request: RefundRequest,
    gateway?: PaymentGatewayType
  ): Promise<RefundResponse> {
    if (!gateway) {
      // Try to determine gateway from transaction ID
      // This would require looking up the transaction in the database
      throw new Error('Gateway type must be specified for refunds');
    }

    const gatewayInstance = this.getGateway(gateway);
    if (!gatewayInstance) {
      throw new Error(`Gateway ${gateway} not available`);
    }

    try {
      const response = await gatewayInstance.refundPayment(request);
      return response;
    } catch (error) {
      console.error(`Refund failed with ${gateway}:`, error);
      throw error;
    }
  }

  /**
   * Void a transaction
   */
  async voidTransaction(
    transactionId: string,
    gateway: PaymentGatewayType
  ): Promise<PaymentResponse> {
    const gatewayInstance = this.getGateway(gateway);
    if (!gatewayInstance) {
      throw new Error(`Gateway ${gateway} not available`);
    }

    try {
      const response = await gatewayInstance.voidTransaction(transactionId);
      return response;
    } catch (error) {
      console.error(`Void failed with ${gateway}:`, error);
      throw error;
    }
  }

  /**
   * Capture an authorization
   */
  async captureAuthorization(
    transactionId: string,
    gateway: PaymentGatewayType,
    amount?: number
  ): Promise<PaymentResponse> {
    const gatewayInstance = this.getGateway(gateway);
    if (!gatewayInstance) {
      throw new Error(`Gateway ${gateway} not available`);
    }

    try {
      const response = await gatewayInstance.captureAuthorization(transactionId, amount);
      return response;
    } catch (error) {
      console.error(`Capture failed with ${gateway}:`, error);
      throw error;
    }
  }

  /**
   * Tokenize payment method
   */
  async tokenizePaymentMethod(
    request: PaymentRequest,
    gateway: PaymentGatewayType
  ): Promise<{
    token: string;
    card_last4?: string;
    card_brand?: string;
    expires?: string;
  }> {
    const gatewayInstance = this.getGateway(gateway);
    if (!gatewayInstance || !gatewayInstance.tokenizePaymentMethod) {
      throw new Error(`Gateway ${gateway} does not support tokenization`);
    }

    try {
      const response = await gatewayInstance.tokenizePaymentMethod(request);
      return response;
    } catch (error) {
      console.error(`Tokenization failed with ${gateway}:`, error);
      throw error;
    }
  }

  /**
   * Verify payment method
   */
  async verifyPaymentMethod(
    paymentMethodToken: string,
    gateway: PaymentGatewayType
  ): Promise<{ valid: boolean; error?: string }> {
    const gatewayInstance = this.getGateway(gateway);
    if (!gatewayInstance || !gatewayInstance.verifyPaymentMethod) {
      throw new Error(`Gateway ${gateway} does not support verification`);
    }

    try {
      const response = await gatewayInstance.verifyPaymentMethod(paymentMethodToken);
      return response;
    } catch (error) {
      console.error(`Verification failed with ${gateway}:`, error);
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Log transaction to database
   */
  private logTransaction(
    gatewayType: PaymentGatewayType,
    request: PaymentRequest,
    response: PaymentResponse
  ): void {
    try {
      logPaymentGatewayTransaction({
        order_id: request.order_id ? parseInt(request.order_id) : undefined,
        gateway_type: gatewayType,
        transaction_type: request.transaction_type,
        transaction_id: response.transaction_id,
        gateway_transaction_id: response.gateway_transaction_id,
        amount: response.amount,
        currency: response.currency,
        status: response.status,
        authorization_code: response.authorization_code,
        customer_email: request.customer_email,
        customer_id: request.customer_id,
        payment_method_type: response.payment_method_type,
        payment_method_token: response.payment_method_token,
        card_last4: response.card_last4,
        card_brand: response.card_brand,
        avs_result: response.avs_result,
        cvv_result: response.cvv_result,
        risk_score: response.risk_score,
        error_code: response.error_code,
        error_message: response.error_message,
        raw_request: this.sanitizeRequest(request),
        raw_response: this.sanitizeResponse(response.raw_response),
        ip_address: request.ip_address,
        user_agent: request.user_agent,
      });
    } catch (error) {
      console.error('Failed to log transaction:', error);
      // Don't throw - logging failure shouldn't break payment processing
    }
  }

  /**
   * Sanitize request for logging (remove sensitive data)
   * OWASP A09: Security Logging - Remove PII and sensitive data
   */
  private sanitizeRequest(request: PaymentRequest): any {
    const sanitized = { ...request };
    
    // OWASP A02: Remove all card data completely
    if (sanitized.card_number) {
      // Only keep last 4 digits, mask the rest
      sanitized.card_number = `****-****-****-${sanitized.card_number.slice(-4)}`;
    }
    if (sanitized.card_cvv) {
      sanitized.card_cvv = '***';
    }
    
    // Remove full customer name (keep only first name initial)
    if (sanitized.customer_name) {
      const names = sanitized.customer_name.split(' ');
      sanitized.customer_name = names[0] ? `${names[0][0]}***` : '***';
    }
    
    // Mask email (keep domain for debugging)
    if (sanitized.customer_email) {
      const [local, domain] = sanitized.customer_email.split('@');
      sanitized.customer_email = local ? `${local[0]}***@${domain}` : '***@***';
    }
    
    // Remove address details (keep only city/state for fraud analysis)
    if (sanitized.billing_address) {
      sanitized.billing_address = {
        ...sanitized.billing_address,
        address_line1: '***',
        address_line2: undefined,
        name: undefined,
        phone: undefined,
      };
    }
    
    if (sanitized.shipping_address) {
      sanitized.shipping_address = {
        ...sanitized.shipping_address,
        address_line1: '***',
        address_line2: undefined,
        name: undefined,
        phone: undefined,
      };
    }
    
    return sanitized;
  }

  /**
   * Sanitize response for logging (remove sensitive data)
   */
  private sanitizeResponse(response: any): any {
    if (!response) return response;
    
    const sanitized = { ...response };
    
    // Remove any PII or sensitive data
    if (sanitized.customer_email) {
      const [local, domain] = sanitized.customer_email.split('@');
      sanitized.customer_email = `${local[0]}***@${domain}`;
    }
    
    return sanitized;
  }
}

/**
 * Singleton instance
 */
let paymentGatewayManagerInstance: PaymentGatewayManager | null = null;

/**
 * Get payment gateway manager instance
 */
export function getPaymentGatewayManager(): PaymentGatewayManager {
  if (!paymentGatewayManagerInstance) {
    paymentGatewayManagerInstance = new PaymentGatewayManager();
  }
  return paymentGatewayManagerInstance;
}

/**
 * Helper: Convert transaction status to standardized format
 */
export function normalizeTransactionStatus(
  gatewayStatus: string,
  gatewayType: PaymentGatewayType
): TransactionStatus {
  const status = gatewayStatus.toLowerCase();

  // Common success statuses
  if (
    status.includes('approved') ||
    status.includes('succeeded') ||
    status.includes('success') ||
    status.includes('completed')
  ) {
    return 'approved';
  }

  // Common decline statuses
  if (
    status.includes('declined') ||
    status.includes('rejected') ||
    status.includes('failed')
  ) {
    return 'declined';
  }

  // Voided
  if (status.includes('void') || status.includes('cancel')) {
    return 'voided';
  }

  // Refunded
  if (status.includes('refund')) {
    return 'refunded';
  }

  // Pending
  if (status.includes('pending') || status.includes('processing')) {
    return 'pending';
  }

  // Error
  if (status.includes('error') || status.includes('exception')) {
    return 'error';
  }

  // Default to error if unknown
  return 'error';
}

/**
 * Helper: Determine payment method type from card brand
 */
export function determinePaymentMethodType(cardBrand?: string): 'card' | 'paypal' | 'venmo' | 'ach' {
  if (!cardBrand) return 'card';

  const brand = cardBrand.toLowerCase();

  if (brand.includes('paypal')) return 'paypal';
  if (brand.includes('venmo')) return 'venmo';
  if (brand.includes('ach') || brand.includes('bank')) return 'ach';

  return 'card';
}

