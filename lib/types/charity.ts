/**
 * Charity and Donation Types
 * 
 * Defines the structure for charitable organizations and donation tracking
 */

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  logo: string;
  website: string;
  taxId?: string; // EIN for tax receipts
  active: boolean;
  featured: boolean;
  category: 'water' | 'health' | 'housing' | 'environment' | 'education' | 'other';
  
  // Campaign scheduling
  startDate?: Date | string; // When to start showing this charity
  endDate?: Date | string; // When to stop showing this charity
  
  // Display settings
  displayOrder: number;
  color?: string; // Brand color for UI
  
  // Donation settings
  suggestedAmounts: number[]; // e.g., [1, 2, 5, 10]
  allowCustomAmount: boolean;
  allowRoundUp: boolean;
  minDonation?: number;
  maxDonation?: number;
  
  // Tracking
  totalDonations: number;
  donationCount: number;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Donation {
  id: string;
  orderId: string;
  charityId: string;
  charityName: string; // Denormalized for historical accuracy
  amount: number;
  donationType: 'fixed' | 'roundup' | 'custom';
  
  // Customer info (optional for tax receipts)
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  
  // Tracking
  createdAt: Date | string;
  
  // Tax receipt
  taxReceiptSent: boolean;
  taxReceiptSentAt?: Date | string;
}

export interface CharityStats {
  charityId: string;
  charityName: string;
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  periodStart: Date | string;
  periodEnd: Date | string;
}

export interface DonationSelection {
  charityId: string;
  amount: number;
  type: 'fixed' | 'roundup' | 'custom';
}

export interface CheckoutWithDonation {
  donation?: DonationSelection;
}

// Form validation
export interface DonationFormData {
  charityId: string;
  donationType: 'fixed' | 'roundup' | 'custom';
  amount?: number; // Required for custom donations
}

export interface DonationFormErrors {
  charityId?: string;
  amount?: string;
}

