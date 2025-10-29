/**
 * Returns & Exchanges Type Definitions
 * Defines the data structures for return requests, items, and processing
 */

export type ReturnStatus = 
  | 'pending'           // Return requested, awaiting approval
  | 'approved'          // Return approved, label sent
  | 'label_sent'        // Return label emailed to customer
  | 'in_transit'        // Customer shipped return, in transit
  | 'received'          // Return received at warehouse
  | 'inspecting'        // Return being inspected
  | 'completed'         // Return processed, refund issued
  | 'rejected'          // Return request rejected
  | 'cancelled';        // Return cancelled by customer

export type ReturnReason = 
  | 'defective'
  | 'wrong_item'
  | 'wrong_size'
  | 'no_longer_needed'
  | 'better_price'
  | 'damaged_shipping'
  | 'not_as_described'
  | 'ordered_by_mistake'
  | 'other';

export type RefundMethod = 
  | 'original_payment'  // Refund to original payment method
  | 'store_credit'      // Issue store credit
  | 'exchange';         // Exchange for different product

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: ReturnReason;
  reasonNotes?: string;
  condition?: 'unopened' | 'opened' | 'used' | 'damaged';
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: ReturnStatus;
  refundMethod: RefundMethod;
  
  // Return items
  items: ReturnItem[];
  
  // Financial details
  subtotal: number;           // Sum of returned items
  tax: number;                // Tax to refund
  shippingRefund: number;     // Original shipping (usually 0)
  restockingFee: number;      // Restocking fee if applicable
  refundAmount: number;       // Total refund amount
  
  // Shipping details
  returnShippingCost: number; // Cost of return shipping
  freeReturnShipping: boolean;// Whether return shipping is free
  trackingNumber?: string;    // Return shipment tracking
  carrier?: string;           // Return carrier (UPS, USPS, etc)
  labelUrl?: string;          // URL to download return label
  
  // Timeline
  requestedAt: Date;
  approvedAt?: Date;
  labelSentAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
  
  // Notes and communication
  customerNotes?: string;
  adminNotes?: string;
  inspectionNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnRequest {
  orderId: string;
  items: {
    orderItemId: string;
    quantity: number;
    reason: ReturnReason;
    reasonNotes?: string;
  }[];
  refundMethod: RefundMethod;
  customerNotes?: string;
}

export interface UpdateReturnStatus {
  status: ReturnStatus;
  trackingNumber?: string;
  carrier?: string;
  adminNotes?: string;
  inspectionNotes?: string;
  refundAmount?: number;
}

export interface ReturnEligibility {
  eligible: boolean;
  reason?: string;
  daysRemaining?: number;
  returnWindowDays: number;
}

export interface ReturnPolicy {
  returnWindowDays: number;           // Default 365 days
  freeReturnShipping: boolean;        // Default true
  restockingFeePercent: number;       // Default 0%
  nonReturnableCategories: string[];  // e.g., ['custom-filters']
  requiresOriginalPackaging: boolean;
  inspectionRequired: boolean;
}

export interface ReturnStatistics {
  totalReturns: number;
  pendingReturns: number;
  processingReturns: number;
  completedReturns: number;
  totalRefundAmount: number;
  averageProcessingDays: number;
  returnRate: number; // Percentage of orders returned
  topReturnReasons: Array<{
    reason: ReturnReason;
    count: number;
    percentage: number;
  }>;
}

