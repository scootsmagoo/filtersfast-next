/**
 * Payment Gateway Type Definitions
 * 
 * Multi-gateway payment processing with Stripe, PayPal, Authorize.Net support
 */

export type PaymentGatewayType = 'stripe' | 'paypal' | 'authorizenet' | 'cybersource';

export type PaymentGatewayStatus = 'active' | 'inactive' | 'testing';

export type PaymentMethodType = 'card' | 'paypal' | 'venmo' | 'ach';

export type TransactionType = 
  | 'authorize' 
  | 'capture' 
  | 'auth_capture' 
  | 'void' 
  | 'refund' 
  | 'verify';

export type TransactionStatus = 
  | 'pending' 
  | 'approved' 
  | 'declined' 
  | 'error' 
  | 'voided' 
  | 'refunded' 
  | 'partial_refund';

/**
 * Base Payment Gateway Configuration
 */
export interface PaymentGatewayConfig {
  id: number;
  gateway_type: PaymentGatewayType;
  gateway_name: string;
  status: PaymentGatewayStatus;
  is_primary: boolean;
  is_backup: boolean;
  priority: number; // 1 = highest priority
  
  // Credentials (encrypted in database)
  credentials: {
    [key: string]: string;
  };
  
  // Settings
  test_mode: boolean;
  capture_method: 'automatic' | 'manual';
  supported_currencies: string[];
  supported_countries: string[];
  min_amount?: number;
  max_amount?: number;
  
  // Features
  supports_tokenization: boolean;
  supports_3ds: boolean;
  supports_refunds: boolean;
  supports_partial_refunds: boolean;
  supports_subscriptions: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  // Amount
  amount: number;
  currency: string;
  
  // Customer
  customer_email: string;
  customer_name?: string;
  customer_id?: string;
  
  // Payment Method
  payment_method?: string; // Token or payment method ID
  card_number?: string; // For non-tokenized payments
  card_exp_month?: string;
  card_exp_year?: string;
  card_cvv?: string;
  
  // Billing Address
  billing_address?: {
    name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  
  // Shipping Address
  shipping_address?: {
    name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  
  // Order Details
  order_id?: string;
  description?: string;
  invoice_number?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    sku?: string;
  }>;
  
  // Transaction Settings
  transaction_type: TransactionType;
  capture_now?: boolean;
  save_payment_method?: boolean;
  
  // 3D Secure
  three_d_secure?: boolean;
  return_url?: string;
  
  // IP & User Agent
  ip_address?: string;
  user_agent?: string;
  
  // Metadata
  metadata?: Record<string, string | number>;
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  authorization_code?: string;
  
  // Transaction Details
  status: TransactionStatus;
  amount: number;
  currency: string;
  
  // Gateway Info
  gateway: PaymentGatewayType;
  gateway_transaction_id: string;
  
  // Payment Method
  payment_method_type?: PaymentMethodType;
  payment_method_token?: string;
  card_last4?: string;
  card_brand?: string;
  
  // 3D Secure
  requires_action?: boolean;
  action_url?: string;
  
  // Fraud Detection
  avs_result?: string;
  cvv_result?: string;
  risk_score?: number;
  
  // Error Handling
  error_code?: string;
  error_message?: string;
  decline_reason?: string;
  
  // Metadata
  raw_response?: any;
  processed_at: string;
}

/**
 * Refund Request
 */
export interface RefundRequest {
  transaction_id: string;
  amount?: number; // Omit for full refund
  reason?: string;
  metadata?: Record<string, string>;
}

/**
 * Refund Response
 */
export interface RefundResponse {
  success: boolean;
  refund_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  error_message?: string;
  processed_at: string;
}

/**
 * Payment Gateway Transaction Log
 */
export interface PaymentGatewayTransaction {
  id: number;
  order_id?: number;
  gateway_type: PaymentGatewayType;
  transaction_type: TransactionType;
  transaction_id: string;
  gateway_transaction_id: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Status
  status: TransactionStatus;
  authorization_code?: string;
  
  // Customer
  customer_email?: string;
  customer_id?: string;
  
  // Payment Method
  payment_method_type?: PaymentMethodType;
  payment_method_token?: string;
  card_last4?: string;
  card_brand?: string;
  
  // Fraud Detection
  avs_result?: string;
  cvv_result?: string;
  risk_score?: number;
  
  // Error Handling
  error_code?: string;
  error_message?: string;
  
  // Logging
  raw_request?: any;
  raw_response?: any;
  ip_address?: string;
  user_agent?: string;
  
  // Metadata
  created_at: string;
  updated_at?: string;
}

/**
 * Payment Gateway Statistics
 */
export interface PaymentGatewayStats {
  gateway_type: PaymentGatewayType;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_volume: number;
  average_amount: number;
  success_rate: number;
  last_transaction_at?: string;
}

/**
 * Payment Gateway Interface
 * 
 * All payment gateways must implement this interface
 */
export interface IPaymentGateway {
  /**
   * Process a payment
   */
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  /**
   * Refund a payment
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;
  
  /**
   * Void an authorization
   */
  voidTransaction(transactionId: string): Promise<PaymentResponse>;
  
  /**
   * Capture an authorization
   */
  captureAuthorization(transactionId: string, amount?: number): Promise<PaymentResponse>;
  
  /**
   * Tokenize a payment method
   */
  tokenizePaymentMethod?(request: PaymentRequest): Promise<{
    token: string;
    card_last4?: string;
    card_brand?: string;
    expires?: string;
  }>;
  
  /**
   * Verify a payment method
   */
  verifyPaymentMethod?(paymentMethodToken: string): Promise<{
    valid: boolean;
    error?: string;
  }>;
}

/**
 * Create Payment Request (from checkout)
 */
export interface CreatePaymentRequest {
  // Gateway Selection
  gateway?: PaymentGatewayType; // If omitted, uses primary gateway
  
  // Payment Details
  amount: number;
  currency?: string;
  
  // Customer
  customer_email: string;
  customer_name?: string;
  user_id?: string;
  is_guest?: boolean;
  
  // Payment Method
  payment_method_id?: string; // For saved payment methods
  payment_method_token?: string; // For tokenized payments
  
  // Card Details (for new cards)
  card?: {
    number: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
  };
  
  // Addresses
  billing_address: {
    name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  
  shipping_address?: {
    name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  
  // Order Details
  order_items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    image?: string;
  }>;
  
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount?: number;
  donation_amount?: number;
  insurance_amount?: number;
  
  // Order Metadata
  promo_code?: string;
  customer_notes?: string;
  shipping_method?: string;
  
  // Payment Options
  save_payment_method?: boolean;
  capture_immediately?: boolean;
  
  // Source
  source?: 'web' | 'mobile' | 'admin';
  ip_address?: string;
  user_agent?: string;
}

/**
 * Payment Gateway Feature Flags
 */
export interface PaymentGatewayFeatures {
  stripe: {
    enabled: boolean;
    supports_payment_intents: boolean;
    supports_payment_methods: boolean;
    supports_3ds: boolean;
    supports_subscriptions: boolean;
  };
  paypal: {
    enabled: boolean;
    express_checkout: boolean;
    guest_checkout: boolean;
    venmo_enabled: boolean;
    credit_enabled: boolean;
  };
  authorizenet: {
    enabled: boolean;
    accepts_customer_info: boolean;
    accepts_3ds: boolean;
    customer_profiles: boolean;
    tokenization: boolean;
  };
}



