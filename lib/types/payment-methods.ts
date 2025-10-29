/**
 * Type definitions for Saved Payment Methods (Payment Vault)
 */

export interface SavedPaymentMethod {
  id: number;
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  card_brand: string; // visa, mastercard, amex, discover, etc.
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  billing_name: string | null;
  billing_email: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_address_city: string | null;
  billing_address_state: string | null;
  billing_address_zip: string | null;
  billing_address_country: string;
  created_at: string;
  last_used_at: string | null;
}

export interface CreatePaymentMethodRequest {
  stripe_payment_method_id: string;
  is_default?: boolean;
}

export interface UpdatePaymentMethodRequest {
  is_default?: boolean;
  billing_name?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_zip?: string;
  billing_address_country?: string;
}

export interface PaymentMethodResponse {
  id: number;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  is_expired: boolean;
  billing_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

