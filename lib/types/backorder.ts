/**
 * Backorder Notification Types
 */

export interface BackorderNotification {
  id: number;
  productId: string;
  productName?: string | null;
  productSku?: string | null;
  optionId: string | null;
  optionLabel: string | null;
  email: string;
  requestedAt: string;
  reminderCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedNote: string | null;
  requestSource: string | null;
}

export interface BackorderSummary {
  productId: string;
  productName: string;
  productSku: string;
  optionId: string | null;
  optionLabel: string | null;
  openRequests: number;
  firstRequestedAt: string;
  lastRequestedAt: string;
  productInventoryQuantity: number;
  allowBackorder: boolean;
  trackInventory: boolean;
  optionStock: number | null;
  optionActualInventory: number | null;
  optionIgnoreStock: boolean | null;
  readyForNotification: boolean;
}

export interface BackorderMeta {
  canComplete: boolean;
}



