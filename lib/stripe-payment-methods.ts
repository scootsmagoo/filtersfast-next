/**
 * Stripe Payment Methods Utilities
 * 
 * Secure payment method management with Stripe API
 * PCI compliant - all card data handled by Stripe
 */

import { stripe } from './stripe';
import { getStripeCustomerIdByUserId } from './db/payment-methods';
import Stripe from 'stripe';

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const existingCustomerId = getStripeCustomerIdByUserId(userId);
  
  if (existingCustomerId) {
    try {
      // Verify the customer still exists in Stripe
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch (error) {
      // Customer doesn't exist in Stripe, create a new one
      console.warn(`Stripe customer ${existingCustomerId} not found, creating new one`);
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  });

  return customer.id;
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethodToCustomer(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethodFromCustomer(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Get payment method details from Stripe
 */
export async function getStripePaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * List all payment methods for a customer
 */
export async function listCustomerPaymentMethods(
  customerId: string,
  type: 'card' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });

  return paymentMethods.data;
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Create a payment intent with a saved payment method
 */
export async function createPaymentIntentWithSavedMethod(
  amount: number,
  currency: string,
  customerId: string,
  paymentMethodId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata,
  });
}

/**
 * Validate a payment method belongs to a customer
 */
export async function validatePaymentMethodOwnership(
  paymentMethodId: string,
  customerId: string
): Promise<boolean> {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod.customer === customerId;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a card is expired
 */
export function isCardExpired(expMonth: number, expYear: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed to 1-indexed

  if (expYear < currentYear) {
    return true;
  }
  
  if (expYear === currentYear && expMonth < currentMonth) {
    return true;
  }

  return false;
}

/**
 * Format card brand for display
 */
export function formatCardBrand(brand: string): string {
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };

  return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

/**
 * Get card brand icon/emoji
 */
export function getCardBrandIcon(brand: string): string {
  const iconMap: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳',
    unionpay: '💳',
  };

  return iconMap[brand.toLowerCase()] || '💳';
}

/**
 * Create a SetupIntent for adding a new payment method
 */
export async function createSetupIntent(
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.SetupIntent> {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata,
  });
}

