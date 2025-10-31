/**
 * B2B Portal Types
 * Types and interfaces for wholesale/business customer portal
 */

export type B2BAccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type B2BAccountType = 'reseller' | 'distributor' | 'corporate' | 'government' | 'nonprofit';
export type PaymentTerms = 'net-15' | 'net-30' | 'net-45' | 'net-60' | 'prepay';
export type QuoteStatus = 'draft' | 'submitted' | 'quoted' | 'accepted' | 'declined' | 'expired';
export type PricingTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'custom';

/**
 * B2B Account
 */
export interface B2BAccount {
  id: string;
  userId: string;
  
  // Company Information
  companyName: string;
  businessType: B2BAccountType;
  taxId?: string; // EIN/Tax ID for tax exemption
  businessLicense?: string;
  yearsInBusiness?: number;
  annualRevenue?: string;
  numberOfEmployees?: string;
  
  // Contact Information
  contactName: string;
  contactTitle?: string;
  contactPhone: string;
  contactEmail: string;
  
  // Billing Address
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Shipping Address (if different)
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Account Status
  status: B2BAccountStatus;
  approvedAt?: number;
  rejectedAt?: number;
  rejectionReason?: string;
  suspendedAt?: number;
  suspensionReason?: string;
  
  // Pricing & Terms
  pricingTier: PricingTier;
  discountPercentage: number; // Global discount (e.g., 15% off all products)
  paymentTerms: PaymentTerms;
  creditLimit?: number; // For net-terms customers
  creditUsed: number;
  
  // Account Manager
  salesRepId?: string;
  salesRepName?: string;
  salesRepEmail?: string;
  
  // References (for application)
  references?: Array<{
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
  }>;
  
  // Metadata
  applicationNotes?: string; // Why they want B2B account
  internalNotes?: string; // Admin notes
  createdAt: number;
  updatedAt: number;
}

/**
 * Tier Pricing Structure
 * Volume-based pricing for products
 */
export interface TierPricing {
  id: string;
  productId?: string; // null = global tier pricing
  sku?: string;
  categoryId?: string; // Apply to entire category
  
  tiers: Array<{
    minQuantity: number;
    maxQuantity?: number; // null = unlimited
    discountPercentage?: number; // e.g., 10% off
    discountAmount?: number; // e.g., $5 off per unit
    fixedPrice?: number; // Override price completely
  }>;
  
  createdAt: number;
  updatedAt: number;
}

/**
 * Quote Request
 * Custom quotes for bulk/special orders
 */
export interface QuoteRequest {
  id: string;
  b2bAccountId: string;
  userId: string;
  companyName: string;
  
  // Quote Details
  quoteNumber: string; // e.g., "Q-2024-001"
  status: QuoteStatus;
  
  // Items Requested
  items: Array<{
    productId?: string;
    sku?: string;
    description: string;
    quantity: number;
    requestedPrice?: number;
    notes?: string;
  }>;
  
  // Quote Response (from sales team)
  quotedItems?: Array<{
    productId?: string;
    sku?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
  
  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  
  // Terms
  validUntil?: number; // Quote expiration date
  paymentTerms?: PaymentTerms;
  deliveryTerms?: string;
  
  // Communication
  customerMessage?: string;
  salesNotes?: string;
  adminResponse?: string;
  
  // Metadata
  submittedAt?: number;
  quotedAt?: number;
  acceptedAt?: number;
  declinedAt?: number;
  expiresAt?: number;
  
  // Assigned sales rep
  assignedTo?: string;
  assignedToName?: string;
  
  createdAt: number;
  updatedAt: number;
}

/**
 * B2B Order
 * Enhanced order for B2B customers with net terms
 */
export interface B2BOrder {
  id: string;
  orderId: string; // Regular order ID
  b2bAccountId: string;
  quoteId?: string; // If created from quote
  
  // Payment Terms
  paymentTerms: PaymentTerms;
  dueDate: number;
  paidDate?: number;
  
  // Invoice
  invoiceNumber: string;
  invoiceUrl?: string;
  
  // PO Number (customer's purchase order)
  poNumber?: string;
  
  // Account Balance
  amountDue: number;
  amountPaid: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

/**
 * Product with B2B Pricing
 */
export interface ProductWithB2BPricing {
  id: number;
  name: string;
  sku: string;
  regularPrice: number;
  
  // B2B Pricing
  b2bPrice?: number; // Account-specific discount applied
  tierPricing?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    price: number;
  }>;
  
  // Minimum order quantity for B2B
  moq?: number;
  
  // Case pack information
  caseQuantity?: number;
  casePrice?: number;
}

/**
 * B2B Dashboard Stats
 */
export interface B2BDashboardStats {
  // Account Info
  accountStatus: B2BAccountStatus;
  pricingTier: PricingTier;
  discountPercentage: number;
  
  // Credit/Terms
  creditLimit?: number;
  creditUsed: number;
  creditAvailable: number;
  
  // Orders
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  
  // Outstanding Balance
  outstandingBalance: number;
  overdueAmount: number;
  
  // Quotes
  activeQuotes: number;
  acceptedQuotes: number;
  
  // Sales Rep
  salesRep?: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * B2B Application Form Data
 */
export interface B2BApplicationForm {
  // Company Information
  companyName: string;
  businessType: B2BAccountType;
  taxId?: string;
  businessLicense?: string;
  yearsInBusiness?: number;
  annualRevenue?: string;
  numberOfEmployees?: string;
  website?: string;
  
  // Contact Information
  contactName: string;
  contactTitle?: string;
  contactPhone: string;
  contactEmail: string;
  
  // Address
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  shippingDifferent: boolean;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Business Details
  resaleCertificate?: string; // For resellers
  currentSuppliers?: string;
  estimatedMonthlyVolume?: string;
  reasonForApplying: string;
  
  // References
  references?: Array<{
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
  }>;
  
  // Terms Agreement
  agreeToTerms: boolean;
  agreeToCredit: boolean;
}

/**
 * Tier Pricing Calculation Result
 */
export interface TierPricingResult {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tierApplied: {
    minQuantity: number;
    maxQuantity?: number;
    discountPercentage?: number;
    discountAmount?: number;
  } | null;
  savings: number;
  savingsPercentage: number;
}

