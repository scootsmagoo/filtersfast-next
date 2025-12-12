/**
 * TaxJar Integration Library
 * Handles tax rate calculation and order reporting to TaxJar for sales tax compliance
 */

import Taxjar from 'taxjar';

// Initialize TaxJar client
const taxjar = new Taxjar({
  apiKey: process.env.TAXJAR_API_KEY || '',
  apiUrl: process.env.NODE_ENV === 'production' 
    ? Taxjar.DEFAULT_API_URL 
    : Taxjar.SANDBOX_API_URL,
});

// US states with no sales tax (excluding territories)
const NO_TAX_STATES = ['DE', 'MT', 'NH', 'OR'];

export interface TaxJarAddress {
  country: string;
  zip: string;
  state: string;
  city: string;
  street?: string;
}

export interface TaxCalculationRequest {
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city: string;
  to_street?: string;
  amount: number;
  shipping: number;
  line_items?: Array<{
    id?: string;
    quantity: number;
    product_tax_code?: string;
    unit_price: number;
    discount?: number;
  }>;
}

export interface TaxCalculationResponse {
  rate: number;
  amount_to_collect: number;
  taxable_amount: number;
  shipping_taxable: boolean;
  has_nexus: boolean;
}

export interface TaxJarOrderData {
  transaction_id: string;
  transaction_date: string;
  customer_id?: string;
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city: string;
  to_street?: string;
  amount: number;
  shipping: number;
  sales_tax: number;
  exemption_type?: 'wholesale' | 'government' | 'other' | 'non_exempt';
  line_items: Array<{
    id?: string;
    quantity: number;
    product_identifier?: string;
    description: string;
    unit_price: number;
    discount?: number;
    sales_tax?: number;
  }>;
}

/**
 * Normalize US state code to 2-letter abbreviation
 */
export function normalizeStateCode(state: string): string {
  if (!state || state.length === 2) return state.toUpperCase();
  
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'district of columbia': 'DC', 'florida': 'FL', 'georgia': 'GA', 'guam': 'GU',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN',
    'iowa': 'IA', 'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA',
    'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI',
    'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT',
    'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
    'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
    'puerto rico': 'PR', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
    'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI',
    'wyoming': 'WY'
  };

  const normalized = state.toLowerCase().replace('.', '');
  return stateMap[normalized] || state.toUpperCase();
}

/**
 * Normalize US zip code (add hyphen if 9-digit format)
 */
export function normalizeZipCode(zip5: string, zip4?: string): string {
  if (!zip5) return '';
  
  if (zip4 && zip4.length === 4 && /^\d+$/.test(zip4) && !zip5.includes('-')) {
    return `${zip5}-${zip4}`;
  }
  
  return zip5;
}

/**
 * Calculate sales tax rate for a given address
 * Returns the tax rate as a percentage (e.g., 8.5 for 8.5%)
 */
export async function calculateTaxRate(
  params: TaxCalculationRequest
): Promise<TaxCalculationResponse> {
  try {
    // Normalize state code
    const state = normalizeStateCode(params.to_state);
    
    // Check if state has no sales tax
    if (NO_TAX_STATES.includes(state)) {
      return {
        rate: 0,
        amount_to_collect: 0,
        taxable_amount: 0,
        shipping_taxable: false,
        has_nexus: false,
      };
    }
    
    // Normalize country code
    const country = params.to_country === 'USA' ? 'US' : params.to_country;
    
    // Only calculate tax for US addresses
    if (country !== 'US') {
      return {
        rate: 0,
        amount_to_collect: 0,
        taxable_amount: 0,
        shipping_taxable: false,
        has_nexus: false,
      };
    }

    // Call TaxJar API
    const response = await taxjar.taxForOrder({
      to_country: country,
      to_zip: params.to_zip,
      to_state: state,
      to_city: params.to_city,
      to_street: params.to_street,
      amount: params.amount,
      shipping: params.shipping,
      line_items: params.line_items,
    });

    return {
      rate: response.tax.rate,
      amount_to_collect: response.tax.amount_to_collect,
      taxable_amount: response.tax.taxable_amount,
      shipping_taxable: response.tax.freight_taxable,
      has_nexus: response.tax.has_nexus,
    };
  } catch (error: any) {
    console.error('TaxJar API Error:', error.message);
    
    // Return zero tax on error to avoid blocking checkout
    // Error should be logged for review
    return {
      rate: 0,
      amount_to_collect: 0,
      taxable_amount: 0,
      shipping_taxable: false,
      has_nexus: false,
    };
  }
}

/**
 * Report an order to TaxJar for compliance tracking
 * This should be called after an order is paid/completed
 */
export async function reportOrderToTaxJar(
  orderData: TaxJarOrderData
): Promise<{ success: boolean; status: number; response: any }> {
  try {
    // Normalize state code
    const state = normalizeStateCode(orderData.to_state);
    
    // Normalize country code
    const country = orderData.to_country === 'USA' ? 'US' : orderData.to_country;
    
    // Only report US orders
    if (country !== 'US') {
      return {
        success: false,
        status: 0,
        response: { error: 'Non-US orders not reported to TaxJar' },
      };
    }

    // Create order transaction in TaxJar
    const response = await taxjar.createOrder({
      transaction_id: orderData.transaction_id,
      transaction_date: orderData.transaction_date,
      customer_id: orderData.customer_id,
      to_country: country,
      to_zip: orderData.to_zip,
      to_state: state,
      to_city: orderData.to_city,
      to_street: orderData.to_street,
      amount: orderData.amount,
      shipping: orderData.shipping,
      sales_tax: orderData.sales_tax,
      exemption_type: orderData.exemption_type,
      line_items: orderData.line_items,
    });

    return {
      success: true,
      status: 201,
      response,
    };
  } catch (error: any) {
    console.error('TaxJar Order Post Error:', error.message);
    
    return {
      success: false,
      status: error.status || 500,
      response: { error: error.message, detail: error.detail },
    };
  }
}

/**
 * Update an existing TaxJar order transaction
 */
export async function updateTaxJarOrder(
  transactionId: string,
  orderData: Partial<TaxJarOrderData>
): Promise<{ success: boolean; status: number; response: any }> {
  try {
    const updateData: any = {
      transaction_id: transactionId,
    };

    if (orderData.amount !== undefined) updateData.amount = orderData.amount;
    if (orderData.shipping !== undefined) updateData.shipping = orderData.shipping;
    if (orderData.sales_tax !== undefined) updateData.sales_tax = orderData.sales_tax;
    if (orderData.line_items) updateData.line_items = orderData.line_items;
    if (orderData.customer_id) updateData.customer_id = orderData.customer_id;

    const response = await taxjar.updateOrder(updateData);

    return {
      success: true,
      status: 200,
      response,
    };
  } catch (error: any) {
    console.error('TaxJar Order Update Error:', error.message);
    
    return {
      success: false,
      status: error.status || 500,
      response: { error: error.message },
    };
  }
}

/**
 * Delete/Cancel an order from TaxJar (for cancelled orders within same month)
 */
export async function deleteTaxJarOrder(
  transactionId: string
): Promise<{ success: boolean; status: number; response: any }> {
  try {
    const response = await taxjar.deleteOrder(transactionId);

    return {
      success: true,
      status: 200,
      response,
    };
  } catch (error: any) {
    console.error('TaxJar Order Delete Error:', error.message);
    
    return {
      success: false,
      status: error.status || 500,
      response: { error: error.message },
    };
  }
}

/**
 * Report a refund to TaxJar
 */
export async function reportRefundToTaxJar(
  refundData: TaxJarOrderData & {
    transaction_reference_id: string;
  }
): Promise<{ success: boolean; status: number; response: any }> {
  try {
    // Normalize state code
    const state = normalizeStateCode(refundData.to_state);
    
    // Normalize country code
    const country = refundData.to_country === 'USA' ? 'US' : refundData.to_country;
    
    // Only report US refunds
    if (country !== 'US') {
      return {
        success: false,
        status: 0,
        response: { error: 'Non-US refunds not reported to TaxJar' },
      };
    }

    // Create refund transaction in TaxJar
    const response = await taxjar.createRefund({
      transaction_id: refundData.transaction_id,
      transaction_reference_id: refundData.transaction_reference_id,
      transaction_date: refundData.transaction_date,
      customer_id: refundData.customer_id,
      to_country: country,
      to_zip: refundData.to_zip,
      to_state: state,
      to_city: refundData.to_city,
      to_street: refundData.to_street,
      amount: -Math.abs(refundData.amount), // Negative amount for refunds
      shipping: -Math.abs(refundData.shipping),
      sales_tax: -Math.abs(refundData.sales_tax),
      line_items: refundData.line_items.map(item => ({
        ...item,
        unit_price: -Math.abs(item.unit_price),
        sales_tax: item.sales_tax ? -Math.abs(item.sales_tax) : undefined,
      })),
    });

    return {
      success: true,
      status: 201,
      response,
    };
  } catch (error: any) {
    console.error('TaxJar Refund Post Error:', error.message);
    
    return {
      success: false,
      status: error.status || 500,
      response: { error: error.message },
    };
  }
}

/**
 * Validate a customer's tax exemption certificate
 */
export async function validateTaxExemption(
  customerId: string,
  exemptionType: 'wholesale' | 'government' | 'other'
): Promise<boolean> {
  try {
    // This would typically validate against TaxJar's exemption certificate API
    // For now, we'll return false as this requires additional setup
    // In production, you would integrate with TaxJar's certificate validation
    return false;
  } catch (error: any) {
    console.error('TaxJar Exemption Validation Error:', error.message);
    return false;
  }
}

