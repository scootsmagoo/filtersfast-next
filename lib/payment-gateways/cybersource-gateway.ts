/**
 * CyberSource Payment Gateway Implementation
 *
 * Provides Authorize.Net failover parity by routing payments through
 * CyberSource's REST (PTS) API using HTTP Signature authentication.
 */

import crypto from 'node:crypto';
import type {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentGatewayType,
} from '../types/payment-gateway';
import { normalizeTransactionStatus, determinePaymentMethodType } from '../payment-gateway';

type HttpMethod = 'POST' | 'GET' | 'PUT';

interface CyberSourceConfig {
  merchantId: string;
  apiKeyId: string;
  apiSecret: string;
  host: string;
}

interface CyberSourcePaymentResponse {
  id?: string;
  status?: string;
  submitTimeUtc?: string;
  clientReferenceInformation?: {
    code?: string;
  };
  orderInformation?: {
    amountDetails?: {
      totalAmount?: string;
      currency?: string;
    };
  };
  paymentInformation?: {
    card?: {
      suffix?: string;
      type?: string;
    };
  };
  processorInformation?: {
    approvalCode?: string;
    responseCode?: string;
    avs?: {
      code?: string;
    };
    cardVerification?: {
      resultCode?: string;
    };
  };
  errorInformation?: {
    reason?: string;
    message?: string;
    details?: Array<{ message?: string }>;
  };
}

const SUCCESS_STATUSES = new Set([
  'AUTHORIZED',
  'PENDING',
  'PENDING_REVIEW',
  'SETTLED',
  'SETTLEMENT_PENDING',
  'CAPTURED',
  'PARTIAL_CAPTURE',
]);

const DECLINE_STATUSES = new Set(['DECLINED', 'REJECTED']);

export class CyberSourceGateway implements IPaymentGateway {
  private config: CyberSourceConfig;

  constructor() {
    const merchantId = process.env.CYBERSOURCE_MERCHANT_ID;
    const apiKeyId = process.env.CYBERSOURCE_API_KEY_ID;
    const apiSecret = process.env.CYBERSOURCE_API_SECRET;
    const explicitHost = process.env.CYBERSOURCE_HOST;
    const environment = (process.env.CYBERSOURCE_ENVIRONMENT || '').toLowerCase();

    if (!merchantId || !apiKeyId || !apiSecret) {
      throw new Error('CyberSource credentials not configured');
    }

    let host = explicitHost;
    if (!host) {
      const isProductionEnv =
        environment === 'production' ||
        environment === 'live' ||
        process.env.NODE_ENV === 'production';
      host = isProductionEnv ? 'api.cybersource.com' : 'apitest.cybersource.com';
    }

    this.config = {
      merchantId,
      apiKeyId,
      apiSecret,
      host,
    };
  }

  /**
   * Process payment using CyberSource Payments REST API.
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.card_number || !request.card_exp_month || !request.card_exp_year) {
      return {
        success: false,
        transaction_id: `cybersource_error_${Date.now()}`,
        gateway_transaction_id: `cybersource_error_${Date.now()}`,
        status: 'error',
        amount: request.amount,
        currency: request.currency || 'USD',
        gateway: 'cybersource',
        error_code: 'missing_card_details',
        error_message:
          'CyberSource fallback requires direct card details. Please retry with card number, expiry, and CVV.',
        processed_at: new Date().toISOString(),
      };
    }

    const captureImmediately =
      request.transaction_type === 'auth_capture' || request.capture_now !== false;

    const body = {
      clientReferenceInformation: {
        code: request.order_id || `FF-${Date.now()}`,
      },
      processingInformation: {
        commerceIndicator: 'internet',
        capture: captureImmediately,
      },
      paymentInformation: {
        card: {
          number: request.card_number,
          expirationMonth: request.card_exp_month.padStart(2, '0'),
          expirationYear: this.normalizeExpirationYear(request.card_exp_year),
          securityCode: request.card_cvv,
        },
      },
      orderInformation: {
        amountDetails: {
          totalAmount: request.amount.toFixed(2),
          currency: (request.currency || 'USD').toUpperCase(),
        },
        billTo: this.buildBillTo(request),
        shipTo: this.buildShipTo(request) ?? undefined,
      },
      deviceInformation: request.ip_address
        ? {
            ipAddress: request.ip_address,
          }
        : undefined,
    };

    const response = await this.sendRequest<CyberSourcePaymentResponse>(
      '/pts/v2/payments',
      'POST',
      body,
    );

    const status = response.status || 'ERROR';
    const normalizedStatus = normalizeTransactionStatus(status, 'cybersource');
    const success = SUCCESS_STATUSES.has(status.toUpperCase());

    if (!success && DECLINE_STATUSES.has(status.toUpperCase())) {
      return {
        success: false,
        transaction_id: response.id || `cybersource_decline_${Date.now()}`,
        gateway_transaction_id: response.id || `cybersource_decline_${Date.now()}`,
        status: 'declined',
        amount: request.amount,
        currency: (request.currency || 'USD').toUpperCase(),
        gateway: 'cybersource',
        payment_method_type: 'card',
        card_last4: request.card_number.slice(-4),
        card_brand: response.paymentInformation?.card?.type,
        avs_result: response.processorInformation?.avs?.code,
        cvv_result: response.processorInformation?.cardVerification?.resultCode,
        error_code: response.processorInformation?.responseCode || response.errorInformation?.reason || status,
        error_message:
          response.errorInformation?.message ||
          response.errorInformation?.details?.map((d) => d.message).join('; ') ||
          'Payment was declined by CyberSource.',
        decline_reason: response.errorInformation?.message,
        raw_response: response,
        processed_at: new Date().toISOString(),
      };
    }

    if (!success) {
      const errorMessage =
        response.errorInformation?.message ||
        response.errorInformation?.details?.map((d) => d.message).join('; ') ||
        `CyberSource payment failed with status ${status}`;
      throw Object.assign(new Error(errorMessage), { response });
    }

    const totalAmount =
      Number(response.orderInformation?.amountDetails?.totalAmount) || request.amount;
    const currency =
      response.orderInformation?.amountDetails?.currency || (request.currency || 'USD').toUpperCase();

    return {
      success: true,
      transaction_id: response.id || `cybersource_${Date.now()}`,
      gateway_transaction_id: response.id || `cybersource_${Date.now()}`,
      authorization_code: response.processorInformation?.approvalCode,
      status: normalizedStatus,
      amount: totalAmount,
      currency,
      gateway: 'cybersource',
      payment_method_type: determinePaymentMethodType(response.paymentInformation?.card?.type),
      card_last4: response.paymentInformation?.card?.suffix || request.card_number.slice(-4),
      card_brand: response.paymentInformation?.card?.type,
      avs_result: response.processorInformation?.avs?.code,
      cvv_result: response.processorInformation?.cardVerification?.resultCode,
      raw_response: response,
      processed_at: response.submitTimeUtc || new Date().toISOString(),
    };
  }

  /**
   * Issue a refund against a CyberSource payment.
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    const amount = request.amount ?? 0;
    const body = {
      clientReferenceInformation: {
        code: request.metadata?.refund_reference || `FF-REF-${Date.now()}`,
      },
      orderInformation: {
        amountDetails: {
          totalAmount: amount.toFixed(2),
          currency: (request.metadata?.currency as string | undefined)?.toUpperCase() || 'USD',
        },
      },
    };

    const response = await this.sendRequest<CyberSourcePaymentResponse>(
      `/pts/v2/payments/${encodeURIComponent(request.transaction_id)}/refunds`,
      'POST',
      body,
    );

    const status = response.status || 'PENDING';
    const success = SUCCESS_STATUSES.has(status.toUpperCase());

    return {
      success,
      refund_id: response.id || `cybersource_refund_${Date.now()}`,
      transaction_id: request.transaction_id,
      amount,
      currency:
        response.orderInformation?.amountDetails?.currency ||
        (request.metadata?.currency as string | undefined) ||
        'USD',
      status: success ? 'succeeded' : 'failed',
      error_message: success ? undefined : response.errorInformation?.message,
      processed_at: response.submitTimeUtc || new Date().toISOString(),
    };
  }

  /**
   * Void a CyberSource authorization by issuing a reversal.
   */
  async voidTransaction(transactionId: string): Promise<PaymentResponse> {
    const response = await this.sendRequest<CyberSourcePaymentResponse>(
      `/pts/v2/payments/${encodeURIComponent(transactionId)}/reversals`,
      'POST',
      {
        clientReferenceInformation: {
          code: `FF-VOID-${Date.now()}`,
        },
      },
    );

    const status = response.status || 'PENDING';
    const success = SUCCESS_STATUSES.has(status.toUpperCase());

    return {
      success,
      transaction_id: transactionId,
      gateway_transaction_id: response.id || transactionId,
      status: success ? 'voided' : 'error',
      amount: 0,
      currency: 'USD',
      gateway: 'cybersource',
      error_message: success ? undefined : response.errorInformation?.message,
      raw_response: response,
      processed_at: response.submitTimeUtc || new Date().toISOString(),
    };
  }

  /**
   * Capture a previous authorization.
   */
  async captureAuthorization(transactionId: string, amount?: number): Promise<PaymentResponse> {
    const body = {
      clientReferenceInformation: {
        code: `FF-CAPTURE-${Date.now()}`,
      },
      orderInformation: amount
        ? {
            amountDetails: {
              totalAmount: amount.toFixed(2),
            },
          }
        : undefined,
    };

    const response = await this.sendRequest<CyberSourcePaymentResponse>(
      `/pts/v2/payments/${encodeURIComponent(transactionId)}/captures`,
      'POST',
      body,
    );

    const status = response.status || 'PENDING';
    const success = SUCCESS_STATUSES.has(status.toUpperCase());

    return {
      success,
      transaction_id: transactionId,
      gateway_transaction_id: response.id || transactionId,
      authorization_code: response.processorInformation?.approvalCode,
      status: success ? 'approved' : 'error',
      amount: amount ?? Number(response.orderInformation?.amountDetails?.totalAmount) || 0,
      currency: response.orderInformation?.amountDetails?.currency || 'USD',
      gateway: 'cybersource',
      error_message: success ? undefined : response.errorInformation?.message,
      raw_response: response,
      processed_at: response.submitTimeUtc || new Date().toISOString(),
    };
  }

  /**
   * CyberSource does not expose a public tokenization endpoint for this flow.
   * The legacy platform performed tokenization server-side; leave unimplemented.
   */
  async tokenizePaymentMethod(): Promise<{
    token: string;
    card_last4?: string;
    card_brand?: string;
    expires?: string;
  }> {
    throw new Error('CyberSource tokenization is not supported in this integration.');
  }

  private buildBillTo(request: PaymentRequest) {
    const billing = request.billing_address;
    const name = billing?.name || request.customer_name || '';
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.length > 0 ? rest.join(' ') : firstName;

    return {
      firstName: firstName || 'Customer',
      lastName: lastName || 'FiltersFast',
      address1: billing?.address_line1 || 'Unknown',
      address2: billing?.address_line2,
      locality: billing?.city || 'Unknown',
      administrativeArea: billing?.state || 'NA',
      postalCode: billing?.postal_code || '00000',
      country: (billing?.country || 'US').toUpperCase(),
      email: request.customer_email,
      phoneNumber: billing?.phone,
    };
  }

  private buildShipTo(request: PaymentRequest) {
    const shipping = request.shipping_address;
    if (!shipping) return null;

    const name = shipping.name || request.customer_name || '';
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.length > 0 ? rest.join(' ') : firstName;

    return {
      firstName: firstName || 'Customer',
      lastName: lastName || 'FiltersFast',
      address1: shipping.address_line1,
      address2: shipping.address_line2,
      locality: shipping.city,
      administrativeArea: shipping.state,
      postalCode: shipping.postal_code,
      country: shipping.country?.toUpperCase() || 'US',
      phoneNumber: shipping.phone,
    };
  }

  private normalizeExpirationYear(year: string): string {
    if (year.length === 2) {
      return `20${year}`;
    }
    return year;
  }

  private async sendRequest<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
    const url = `https://${this.config.host}${path}`;
    const bodyString = body ? JSON.stringify(body) : '';
    const date = new Date().toUTCString();
    const requestTarget = `${method.toLowerCase()} ${path}`;

    const headers: Record<string, string> = {
      host: this.config.host,
      date,
      'v-c-merchant-id': this.config.merchantId,
      'content-type': 'application/json',
      accept: 'application/json',
    };

    const headerNames: string[] = ['host', 'date', '(request-target)'];
    let signatureString = `host: ${this.config.host}\n`;
    signatureString += `date: ${date}\n`;
    signatureString += `(request-target): ${requestTarget}`;

    if (bodyString) {
      const digest = crypto.createHash('sha256').update(bodyString, 'utf8').digest('base64');
      headers.digest = `SHA-256=${digest}`;
      headerNames.push('digest');
      signatureString += `\ndigest: ${headers.digest}`;
    }

    headerNames.push('v-c-merchant-id');
    signatureString += `\nv-c-merchant-id: ${this.config.merchantId}`;

    const signature = crypto
      .createHmac('sha256', Buffer.from(this.config.apiSecret, 'base64'))
      .update(signatureString)
      .digest('base64');

    headers.signature = `keyid="${this.config.apiKeyId}", algorithm="HmacSHA256", headers="${headerNames.join(
      ' ',
    )}", signature="${signature}"`;

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined,
    });

    const text = await response.text();

    let json: any = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
    }

    if (!response.ok) {
      const message =
        json?.errorInformation?.message ||
        json?.errorInformation?.details?.map((d: any) => d.message).join('; ') ||
        response.statusText ||
        'CyberSource request failed';
      const error = new Error(message);
      (error as any).status = response.status;
      (error as any).details = json;
      throw error;
    }

    return json as T;
  }
}



