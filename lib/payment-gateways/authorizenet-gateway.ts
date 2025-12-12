/**
 * Authorize.Net Payment Gateway Implementation
 * 
 * Implements IPaymentGateway interface for Authorize.Net (AIM/Accept.js)
 * Backup payment processor for FiltersFast
 */

import type {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment-gateway';
import { normalizeTransactionStatus } from '../payment-gateway';

interface AuthorizeNetConfig {
  apiLoginId: string;
  transactionKey: string;
  environment: 'sandbox' | 'production';
}

export class AuthorizeNetGateway implements IPaymentGateway {
  private config: AuthorizeNetConfig;
  private apiUrl: string;

  constructor() {
    this.config = {
      apiLoginId: process.env.AUTHORIZENET_API_LOGIN_ID || '',
      transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY || '',
      environment:
        process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    };

    this.apiUrl =
      this.config.environment === 'production'
        ? 'https://api.authorize.net/xml/v1/request.api'
        : 'https://apitest.authorize.net/xml/v1/request.api';

    if (!this.config.apiLoginId || !this.config.transactionKey) {
      throw new Error('Authorize.Net credentials not configured');
    }
  }

  /**
   * Process payment with Authorize.Net
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionType = this.getTransactionType(request);

      const payload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: this.config.apiLoginId,
            transactionKey: this.config.transactionKey,
          },
          refId: request.order_id || `${Date.now()}`,
          transactionRequest: {
            transactionType,
            amount: request.amount.toFixed(2),
            payment: this.buildPaymentData(request),
            customer: {
              email: request.customer_email,
            },
            billTo: request.billing_address
              ? {
                  firstName: request.billing_address.name?.split(' ')[0] || '',
                  lastName: request.billing_address.name?.split(' ').slice(1).join(' ') || '',
                  address: request.billing_address.address_line1,
                  city: request.billing_address.city,
                  state: request.billing_address.state,
                  zip: request.billing_address.postal_code,
                  country: request.billing_address.country,
                  phoneNumber: request.billing_address.phone,
                }
              : undefined,
            shipTo: request.shipping_address
              ? {
                  firstName: request.shipping_address.name?.split(' ')[0] || '',
                  lastName: request.shipping_address.name?.split(' ').slice(1).join(' ') || '',
                  address: request.shipping_address.address_line1,
                  city: request.shipping_address.city,
                  state: request.shipping_address.state,
                  zip: request.shipping_address.postal_code,
                  country: request.shipping_address.country,
                }
              : undefined,
            lineItems: this.buildLineItems(request),
            customerIP: request.ip_address,
            userFields: request.metadata
              ? Object.entries(request.metadata).map(([name, value]) => ({
                  name,
                  value: String(value),
                }))
              : undefined,
          },
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authorize.Net API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const transactionResponse = data.transactionResponse;

      if (!transactionResponse) {
        const messages = data.messages?.message;
        const errorMessage = Array.isArray(messages)
          ? messages.map((m: any) => m.text).join(', ')
          : 'Unknown error';
        throw new Error(errorMessage);
      }

      // Parse response code
      // 1 = Approved, 2 = Declined, 3 = Error, 4 = Held for Review
      const responseCode = transactionResponse.responseCode;
      const success = responseCode === '1';
      const status = this.parseResponseCode(responseCode);

      return {
        success,
        transaction_id: transactionResponse.transId || `error_${Date.now()}`,
        gateway_transaction_id: transactionResponse.transId || `error_${Date.now()}`,
        authorization_code: transactionResponse.authCode,
        status,
        amount: request.amount,
        currency: 'USD', // Authorize.Net only supports USD
        gateway: 'authorizenet',
        payment_method_type: 'card',
        payment_method_token: transactionResponse.accountNumber,
        card_last4: transactionResponse.accountNumber
          ? transactionResponse.accountNumber.replace(/X/g, '').slice(-4)
          : undefined,
        card_brand: transactionResponse.accountType,
        avs_result: transactionResponse.avsResultCode,
        cvv_result: transactionResponse.cvvResultCode,
        error_code: !success ? transactionResponse.errors?.[0]?.errorCode : undefined,
        error_message: !success ? transactionResponse.errors?.[0]?.errorText : undefined,
        decline_reason: !success ? transactionResponse.responseReasonText : undefined,
        raw_response: data,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Authorize.Net payment error:', error);

      return {
        success: false,
        transaction_id: `error_${Date.now()}`,
        gateway_transaction_id: `error_${Date.now()}`,
        status: 'error',
        amount: request.amount,
        currency: 'USD',
        gateway: 'authorizenet',
        error_message: error.message || 'Payment processing failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const payload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: this.config.apiLoginId,
            transactionKey: this.config.transactionKey,
          },
          refId: `refund_${Date.now()}`,
          transactionRequest: {
            transactionType: 'refundTransaction',
            amount: request.amount ? request.amount.toFixed(2) : undefined,
            refTransId: request.transaction_id,
          },
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authorize.Net API error: ${response.status}`);
      }

      const data = await response.json();
      const transactionResponse = data.transactionResponse;

      const success = transactionResponse?.responseCode === '1';

      return {
        success,
        refund_id: transactionResponse?.transId || `error_${Date.now()}`,
        transaction_id: request.transaction_id,
        amount: request.amount || 0,
        currency: 'USD',
        status: success ? 'succeeded' : 'failed',
        error_message: !success ? transactionResponse?.errors?.[0]?.errorText : undefined,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Authorize.Net refund error:', error);

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
      const payload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: this.config.apiLoginId,
            transactionKey: this.config.transactionKey,
          },
          refId: `void_${Date.now()}`,
          transactionRequest: {
            transactionType: 'voidTransaction',
            refTransId: transactionId,
          },
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authorize.Net API error: ${response.status}`);
      }

      const data = await response.json();
      const transactionResponse = data.transactionResponse;

      const success = transactionResponse?.responseCode === '1';

      return {
        success,
        transaction_id: transactionId,
        gateway_transaction_id: transactionResponse?.transId || transactionId,
        status: success ? 'voided' : 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'authorizenet',
        error_message: !success ? transactionResponse?.errors?.[0]?.errorText : undefined,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Authorize.Net void error:', error);

      return {
        success: false,
        transaction_id: transactionId,
        gateway_transaction_id: transactionId,
        status: 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'authorizenet',
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
      const payload = {
        createTransactionRequest: {
          merchantAuthentication: {
            name: this.config.apiLoginId,
            transactionKey: this.config.transactionKey,
          },
          refId: `capture_${Date.now()}`,
          transactionRequest: {
            transactionType: 'priorAuthCaptureTransaction',
            amount: amount ? amount.toFixed(2) : undefined,
            refTransId: transactionId,
          },
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authorize.Net API error: ${response.status}`);
      }

      const data = await response.json();
      const transactionResponse = data.transactionResponse;

      const success = transactionResponse?.responseCode === '1';

      return {
        success,
        transaction_id: transactionId,
        gateway_transaction_id: transactionResponse?.transId || transactionId,
        status: success ? 'approved' : 'error',
        amount: amount || 0,
        currency: 'USD',
        gateway: 'authorizenet',
        authorization_code: transactionResponse?.authCode,
        error_message: !success ? transactionResponse?.errors?.[0]?.errorText : undefined,
        processed_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Authorize.Net capture error:', error);

      return {
        success: false,
        transaction_id: transactionId,
        gateway_transaction_id: transactionId,
        status: 'error',
        amount: 0,
        currency: 'USD',
        gateway: 'authorizenet',
        error_message: error.message || 'Capture failed',
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Tokenize payment method (Customer Information Manager - CIM)
   */
  async tokenizePaymentMethod(request: PaymentRequest): Promise<{
    token: string;
    card_last4?: string;
    card_brand?: string;
    expires?: string;
  }> {
    try {
      // Create customer profile with payment profile
      const payload = {
        createCustomerProfileRequest: {
          merchantAuthentication: {
            name: this.config.apiLoginId,
            transactionKey: this.config.transactionKey,
          },
          profile: {
            email: request.customer_email,
            paymentProfiles: {
              customerType: 'individual',
              billTo: request.billing_address
                ? {
                    firstName: request.billing_address.name?.split(' ')[0] || '',
                    lastName: request.billing_address.name?.split(' ').slice(1).join(' ') || '',
                    address: request.billing_address.address_line1,
                    city: request.billing_address.city,
                    state: request.billing_address.state,
                    zip: request.billing_address.postal_code,
                    country: request.billing_address.country,
                  }
                : undefined,
              payment: {
                creditCard: {
                  cardNumber: request.card_number,
                  expirationDate: `${request.card_exp_year}-${request.card_exp_month}`,
                  cardCode: request.card_cvv,
                },
              },
            },
          },
          validationMode: 'liveMode',
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authorize.Net API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.messages?.resultCode !== 'Ok') {
        const errorMessage = data.messages?.message?.[0]?.text || 'Tokenization failed';
        throw new Error(errorMessage);
      }

      const customerProfileId = data.customerProfileId;
      const customerPaymentProfileId = data.customerPaymentProfileIdList?.[0];

      return {
        token: `${customerProfileId}:${customerPaymentProfileId}`,
        card_last4: request.card_number?.slice(-4),
        expires: `${request.card_exp_month}/${request.card_exp_year}`,
      };
    } catch (error: any) {
      console.error('Authorize.Net tokenization error:', error);
      throw new Error(error.message || 'Failed to tokenize payment method');
    }
  }

  /**
   * Helper: Build payment data from request
   */
  private buildPaymentData(request: PaymentRequest): any {
    if (request.payment_method) {
      // Use tokenized payment method (CIM)
      const [customerProfileId, customerPaymentProfileId] = request.payment_method.split(':');
      return {
        profile: {
          customerProfileId,
          paymentProfile: {
            paymentProfileId: customerPaymentProfileId,
          },
        },
      };
    }

    if (request.card_number) {
      // Use credit card
      return {
        creditCard: {
          cardNumber: request.card_number,
          expirationDate: `${request.card_exp_year}-${request.card_exp_month}`,
          cardCode: request.card_cvv,
        },
      };
    }

    throw new Error('No payment method provided');
  }

  /**
   * Helper: Build line items
   */
  private buildLineItems(request: PaymentRequest): any[] | undefined {
    if (!request.items || request.items.length === 0) {
      return undefined;
    }

    return request.items.map((item, index) => ({
      itemId: item.sku || `${index + 1}`,
      name: item.name.substring(0, 31), // Max 31 chars
      description: item.name.substring(0, 255),
      quantity: item.quantity,
      unitPrice: item.unit_price.toFixed(2),
    }));
  }

  /**
   * Helper: Get transaction type
   */
  private getTransactionType(request: PaymentRequest): string {
    switch (request.transaction_type) {
      case 'authorize':
        return 'authOnlyTransaction';
      case 'capture':
        return 'priorAuthCaptureTransaction';
      case 'auth_capture':
        return 'authCaptureTransaction';
      case 'void':
        return 'voidTransaction';
      case 'refund':
        return 'refundTransaction';
      default:
        return request.capture_now === false ? 'authOnlyTransaction' : 'authCaptureTransaction';
    }
  }

  /**
   * Helper: Parse response code to status
   */
  private parseResponseCode(code: string): any {
    switch (code) {
      case '1':
        return 'approved';
      case '2':
        return 'declined';
      case '3':
        return 'error';
      case '4':
        return 'pending'; // Held for review
      default:
        return 'error';
    }
  }
}



