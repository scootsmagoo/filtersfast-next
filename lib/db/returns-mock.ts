/**
 * Mock Database for Returns & Exchanges
 * Simulates return request storage and management
 * Replace with actual database queries in production
 */

import { 
  ReturnRequest, 
  ReturnStatus, 
  ReturnReason,
  ReturnEligibility,
  ReturnPolicy,
  CreateReturnRequest,
  UpdateReturnStatus,
  ReturnStatistics
} from '../types/returns';

// Mock data store (in production, this would be your database)
let returns: ReturnRequest[] = [
  {
    id: 'ret_001',
    orderId: 'ord_12345',
    orderNumber: 'FF-12345',
    customerId: 'cust_001',
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    status: 'approved',
    refundMethod: 'original_payment',
    items: [
      {
        id: 'ritem_001',
        returnId: 'ret_001',
        orderItemId: 'oitem_001',
        productId: 'prod_001',
        productName: 'FiltersFast 16x25x4 MERV 11 Air Filter',
        productImage: '/products/filter-16x25x4.jpg',
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98,
        reason: 'wrong_size',
        reasonNotes: 'Ordered wrong size by mistake',
        condition: 'unopened'
      }
    ],
    subtotal: 59.98,
    tax: 5.40,
    shippingRefund: 0,
    restockingFee: 0,
    refundAmount: 65.38,
    returnShippingCost: 0,
    freeReturnShipping: true,
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    labelUrl: '/api/returns/ret_001/label',
    requestedAt: new Date('2024-10-15T10:30:00'),
    approvedAt: new Date('2024-10-15T14:20:00'),
    labelSentAt: new Date('2024-10-15T14:20:00'),
    customerNotes: 'Need to exchange for correct size',
    adminNotes: 'Approved - customer error',
    createdAt: new Date('2024-10-15T10:30:00'),
    updatedAt: new Date('2024-10-15T14:20:00')
  }
];

// Default return policy
const DEFAULT_RETURN_POLICY: ReturnPolicy = {
  returnWindowDays: 365,
  freeReturnShipping: true,
  restockingFeePercent: 0,
  nonReturnableCategories: ['custom-filters'],
  requiresOriginalPackaging: false,
  inspectionRequired: true
};

/**
 * Check if an order is eligible for return
 */
export async function checkReturnEligibility(
  orderId: string
): Promise<ReturnEligibility> {
  // In production, fetch actual order data from database
  const mockOrder = {
    id: orderId,
    orderDate: new Date('2024-10-01T10:00:00'),
    status: 'delivered',
    hasCustomFilters: false
  };

  const daysSinceOrder = Math.floor(
    (Date.now() - mockOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (mockOrder.hasCustomFilters) {
    return {
      eligible: false,
      reason: 'Custom filters are not eligible for return',
      returnWindowDays: DEFAULT_RETURN_POLICY.returnWindowDays
    };
  }

  if (daysSinceOrder > DEFAULT_RETURN_POLICY.returnWindowDays) {
    return {
      eligible: false,
      reason: `Return window of ${DEFAULT_RETURN_POLICY.returnWindowDays} days has expired`,
      returnWindowDays: DEFAULT_RETURN_POLICY.returnWindowDays
    };
  }

  return {
    eligible: true,
    daysRemaining: DEFAULT_RETURN_POLICY.returnWindowDays - daysSinceOrder,
    returnWindowDays: DEFAULT_RETURN_POLICY.returnWindowDays
  };
}

/**
 * Create a new return request
 */
export async function createReturnRequest(
  customerId: string,
  data: CreateReturnRequest
): Promise<ReturnRequest> {
  // In production, validate order ownership and item details from database
  const newReturn: ReturnRequest = {
    id: `ret_${Date.now()}`,
    orderId: data.orderId,
    orderNumber: `FF-${data.orderId.slice(-5)}`,
    customerId,
    customerEmail: 'customer@example.com', // Fetch from user session
    customerName: 'Customer Name', // Fetch from user session
    status: 'pending',
    refundMethod: data.refundMethod,
    items: data.items.map((item, idx) => ({
      id: `ritem_${Date.now()}_${idx}`,
      returnId: `ret_${Date.now()}`,
      orderItemId: item.orderItemId,
      productId: 'prod_placeholder', // Fetch from order items
      productName: 'Product Name', // Fetch from order items
      quantity: item.quantity,
      unitPrice: 29.99, // Fetch from order items
      totalPrice: 29.99 * item.quantity,
      reason: item.reason,
      reasonNotes: item.reasonNotes
    })),
    subtotal: 0, // Calculate from items
    tax: 0, // Calculate proportionally
    shippingRefund: 0, // Usually 0 per policy
    restockingFee: 0,
    refundAmount: 0, // Calculate total
    returnShippingCost: 0,
    freeReturnShipping: DEFAULT_RETURN_POLICY.freeReturnShipping,
    customerNotes: data.customerNotes,
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Calculate totals
  newReturn.subtotal = newReturn.items.reduce((sum, item) => sum + item.totalPrice, 0);
  newReturn.tax = newReturn.subtotal * 0.09; // Calculate proportional tax
  newReturn.refundAmount = newReturn.subtotal + newReturn.tax - newReturn.restockingFee;

  returns.push(newReturn);
  return newReturn;
}

/**
 * Get all returns for a customer
 */
export async function getCustomerReturns(
  customerId: string
): Promise<ReturnRequest[]> {
  return returns.filter(ret => ret.customerId === customerId);
}

/**
 * Get a specific return by ID
 */
export async function getReturnById(
  returnId: string,
  customerId?: string
): Promise<ReturnRequest | null> {
  const returnRequest = returns.find(ret => ret.id === returnId);
  
  if (!returnRequest) {
    return null;
  }

  // If customerId provided, verify ownership
  if (customerId && returnRequest.customerId !== customerId) {
    return null;
  }

  return returnRequest;
}

/**
 * Update return status (admin only)
 */
export async function updateReturnStatus(
  returnId: string,
  update: UpdateReturnStatus
): Promise<ReturnRequest | null> {
  const returnIndex = returns.findIndex(ret => ret.id === returnId);
  
  if (returnIndex === -1) {
    return null;
  }

  const returnRequest = returns[returnIndex];
  const now = new Date();

  // Update status and related fields
  returnRequest.status = update.status;
  returnRequest.updatedAt = now;

  if (update.trackingNumber) {
    returnRequest.trackingNumber = update.trackingNumber;
    returnRequest.carrier = update.carrier;
  }

  if (update.adminNotes) {
    returnRequest.adminNotes = update.adminNotes;
  }

  if (update.inspectionNotes) {
    returnRequest.inspectionNotes = update.inspectionNotes;
  }

  if (update.refundAmount !== undefined) {
    returnRequest.refundAmount = update.refundAmount;
  }

  // Update timeline based on status
  switch (update.status) {
    case 'approved':
      returnRequest.approvedAt = now;
      break;
    case 'label_sent':
      returnRequest.labelSentAt = now;
      break;
    case 'in_transit':
      returnRequest.shippedAt = now;
      break;
    case 'received':
      returnRequest.receivedAt = now;
      break;
    case 'completed':
      returnRequest.completedAt = now;
      break;
  }

  returns[returnIndex] = returnRequest;
  return returnRequest;
}

/**
 * Cancel a return request (customer only, before approved)
 */
export async function cancelReturnRequest(
  returnId: string,
  customerId: string
): Promise<ReturnRequest | null> {
  const returnRequest = returns.find(
    ret => ret.id === returnId && ret.customerId === customerId
  );

  if (!returnRequest) {
    return null;
  }

  if (returnRequest.status !== 'pending') {
    throw new Error('Can only cancel pending returns');
  }

  returnRequest.status = 'cancelled';
  returnRequest.updatedAt = new Date();

  return returnRequest;
}

/**
 * Get all returns (admin only)
 */
export async function getAllReturns(
  filters?: {
    status?: ReturnStatus;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ReturnRequest[]> {
  let filtered = [...returns];

  if (filters?.status) {
    filtered = filtered.filter(ret => ret.status === filters.status);
  }

  if (filters?.customerId) {
    filtered = filtered.filter(ret => ret.customerId === filters.customerId);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(ret => ret.requestedAt >= filters.startDate!);
  }

  if (filters?.endDate) {
    filtered = filtered.filter(ret => ret.requestedAt <= filters.endDate!);
  }

  return filtered.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
}

/**
 * Get return statistics (admin only)
 */
export async function getReturnStatistics(): Promise<ReturnStatistics> {
  const totalReturns = returns.length;
  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const processingReturns = returns.filter(r => 
    ['approved', 'label_sent', 'in_transit', 'received', 'inspecting'].includes(r.status)
  ).length;
  const completedReturns = returns.filter(r => r.status === 'completed').length;
  
  const totalRefundAmount = returns
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  // Calculate average processing days
  const completedWithDates = returns.filter(r => 
    r.status === 'completed' && r.completedAt && r.requestedAt
  );
  const averageProcessingDays = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, r) => {
        const days = Math.floor(
          (r.completedAt!.getTime() - r.requestedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / completedWithDates.length
    : 0;

  // Count return reasons
  const reasonCounts = new Map<ReturnReason, number>();
  returns.forEach(ret => {
    ret.items.forEach(item => {
      reasonCounts.set(item.reason, (reasonCounts.get(item.reason) || 0) + 1);
    });
  });

  const totalReasonCount = Array.from(reasonCounts.values()).reduce((sum, count) => sum + count, 0);
  const topReturnReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: (count / totalReasonCount) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalReturns,
    pendingReturns,
    processingReturns,
    completedReturns,
    totalRefundAmount,
    averageProcessingDays,
    returnRate: 0, // Would calculate based on total orders
    topReturnReasons
  };
}

/**
 * Get return policy
 */
export async function getReturnPolicy(): Promise<ReturnPolicy> {
  return DEFAULT_RETURN_POLICY;
}

