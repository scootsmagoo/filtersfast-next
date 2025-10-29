/**
 * Mock Charity Database
 * 
 * In production, this would be replaced with actual database queries
 */

import { Charity, Donation, CharityStats } from '@/lib/types/charity';

// Mock charities based on FiltersFast legacy system
export const mockCharities: Charity[] = [
  {
    id: 'wine-to-water',
    name: 'Wine to Water',
    slug: 'wine-to-water',
    description: 'Wine To Water is a water charity and certified WASH (Water, Sanitation And Hygiene) organization located in Boone, NC. Wine To Water is committed to supporting life and dignity through the power of clean water. Since 2011, FiltersFast.com has partnered with Wine To Water to work towards one mission: to end the global water crisis.',
    shortDescription: 'Supporting life and dignity through the power of clean water',
    logo: 'https://www.filtersfast.com/w3/resources/w2w.png',
    website: 'https://winetowater.org',
    taxId: '20-8412139',
    active: true,
    featured: true,
    category: 'water',
    displayOrder: 1,
    color: '#0066cc',
    suggestedAmounts: [1, 2, 5, 10],
    allowCustomAmount: true,
    allowRoundUp: true,
    minDonation: 0.5,
    maxDonation: 100,
    totalDonations: 0,
    donationCount: 0,
    createdAt: new Date('2011-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'cystic-fibrosis',
    name: 'Cystic Fibrosis Foundation - Xtreme Hike',
    slug: 'cystic-fibrosis',
    description: 'Cystic Fibrosis is an inherited, life-threatening disease that causes severe damage to the lungs, digestive system, and other organs in the body. Help fund research to find a cure by donating in support of our Founder and CEO, Ray, who will be participating in the Cystic Fibrosis Foundation - Xtreme Hike for the Cure.',
    shortDescription: 'Fighting for a cure for Cystic Fibrosis',
    logo: 'https://www.filtersfast.com/images/xtreme-hike-logo.png',
    website: 'https://www.cff.org',
    taxId: '13-1930701',
    active: true,
    featured: false,
    category: 'health',
    startDate: new Date(new Date().getFullYear(), 8, 1), // September 1
    endDate: new Date(new Date().getFullYear(), 9, 18), // October 18
    displayOrder: 2,
    color: '#9b59b6',
    suggestedAmounts: [1, 2, 5, 10],
    allowCustomAmount: true,
    allowRoundUp: true,
    minDonation: 0.5,
    maxDonation: 100,
    totalDonations: 0,
    donationCount: 0,
    createdAt: new Date('2015-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'habitat-for-humanity',
    name: 'Habitat for Humanity',
    slug: 'habitat-for-humanity',
    description: 'Habitat for Humanity brings people together to build homes, communities, and hope. Help families achieve strength, stability, and self-reliance through shelter.',
    shortDescription: 'Building homes, communities, and hope',
    logo: 'https://www.habitat.org/sites/default/files/hfh-logo.png',
    website: 'https://www.habitat.org',
    taxId: '91-1914868',
    active: true,
    featured: false,
    category: 'housing',
    displayOrder: 3,
    color: '#005eb8',
    suggestedAmounts: [1, 2, 5, 10],
    allowCustomAmount: true,
    allowRoundUp: true,
    minDonation: 0.5,
    maxDonation: 100,
    totalDonations: 0,
    donationCount: 0,
    createdAt: new Date('2018-01-01'),
    updatedAt: new Date(),
  },
];

// Mock donations storage (in-memory)
let mockDonations: Donation[] = [];
let nextDonationId = 1;

/**
 * Get all active charities
 */
export async function getActiveCharities(): Promise<Charity[]> {
  const now = new Date();
  
  return mockCharities
    .filter(charity => {
      if (!charity.active) return false;
      
      // Check if within date range
      if (charity.startDate && new Date(charity.startDate) > now) return false;
      if (charity.endDate && new Date(charity.endDate) < now) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Featured charities first, then by display order
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.displayOrder - b.displayOrder;
    });
}

/**
 * Get featured charity (typically the primary one to display)
 */
export async function getFeaturedCharity(): Promise<Charity | null> {
  const activeCharities = await getActiveCharities();
  return activeCharities.find(c => c.featured) || activeCharities[0] || null;
}

/**
 * Get charity by ID
 */
export async function getCharityById(id: string): Promise<Charity | null> {
  return mockCharities.find(c => c.id === id) || null;
}

/**
 * Get charity by slug
 */
export async function getCharityBySlug(slug: string): Promise<Charity | null> {
  return mockCharities.find(c => c.slug === slug) || null;
}

/**
 * Create a donation record
 */
export async function createDonation(donation: Omit<Donation, 'id' | 'createdAt' | 'taxReceiptSent'>): Promise<Donation> {
  const newDonation: Donation = {
    ...donation,
    id: `donation-${nextDonationId++}`,
    createdAt: new Date(),
    taxReceiptSent: false,
  };
  
  mockDonations.push(newDonation);
  
  // Update charity totals
  const charity = mockCharities.find(c => c.id === donation.charityId);
  if (charity) {
    charity.totalDonations += donation.amount;
    charity.donationCount += 1;
    charity.updatedAt = new Date();
  }
  
  return newDonation;
}

/**
 * Get donations for an order
 */
export async function getDonationsByOrderId(orderId: string): Promise<Donation[]> {
  return mockDonations.filter(d => d.orderId === orderId);
}

/**
 * Get donations for a customer
 */
export async function getDonationsByCustomerId(customerId: string): Promise<Donation[]> {
  return mockDonations.filter(d => d.customerId === customerId);
}

/**
 * Get donation statistics for a charity
 */
export async function getCharityStats(
  charityId: string,
  startDate: Date,
  endDate: Date
): Promise<CharityStats> {
  const charity = await getCharityById(charityId);
  if (!charity) {
    throw new Error('Charity not found');
  }
  
  const donations = mockDonations.filter(d => {
    if (d.charityId !== charityId) return false;
    const donationDate = new Date(d.createdAt);
    return donationDate >= startDate && donationDate <= endDate;
  });
  
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const donationCount = donations.length;
  const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;
  
  return {
    charityId,
    charityName: charity.name,
    totalDonations,
    donationCount,
    averageDonation,
    periodStart: startDate,
    periodEnd: endDate,
  };
}

/**
 * Get all charities (admin function)
 */
export async function getAllCharities(): Promise<Charity[]> {
  return [...mockCharities].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Calculate round-up amount
 */
export function calculateRoundUpAmount(subtotal: number): number {
  const rounded = Math.ceil(subtotal);
  return Math.max(0, rounded - subtotal);
}

/**
 * Validate donation amount
 */
export function validateDonationAmount(charity: Charity, amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Donation amount must be greater than zero' };
  }
  
  if (charity.minDonation && amount < charity.minDonation) {
    return { valid: false, error: `Minimum donation is $${charity.minDonation.toFixed(2)}` };
  }
  
  if (charity.maxDonation && amount > charity.maxDonation) {
    return { valid: false, error: `Maximum donation is $${charity.maxDonation.toFixed(2)}` };
  }
  
  return { valid: true };
}

