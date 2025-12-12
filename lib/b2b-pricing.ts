/**
 * B2B Pricing Utilities
 * Calculate tier pricing and B2B discounts
 */

import { TierPricing, TierPricingResult, B2BAccount } from '@/lib/types/b2b';
import { getTierPricingByProductId, getTierPricingBySku } from '@/lib/db/b2b';

/**
 * Calculate tier pricing for a product
 */
export function calculateTierPrice(
  basePrice: number,
  quantity: number,
  tierPricing?: TierPricing
): TierPricingResult {
  // No tier pricing available
  if (!tierPricing || !tierPricing.tiers || tierPricing.tiers.length === 0) {
    return {
      quantity,
      unitPrice: basePrice,
      subtotal: basePrice * quantity,
      tierApplied: null,
      savings: 0,
      savingsPercentage: 0,
    };
  }

  // Find applicable tier
  const applicableTier = tierPricing.tiers
    .filter(tier => {
      const meetsMin = quantity >= tier.minQuantity;
      const meetsMax = !tier.maxQuantity || quantity <= tier.maxQuantity;
      return meetsMin && meetsMax;
    })
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]; // Get highest applicable tier

  if (!applicableTier) {
    return {
      quantity,
      unitPrice: basePrice,
      subtotal: basePrice * quantity,
      tierApplied: null,
      savings: 0,
      savingsPercentage: 0,
    };
  }

  // Calculate price based on tier
  let unitPrice = basePrice;

  if (applicableTier.fixedPrice !== undefined) {
    // Fixed price override
    unitPrice = applicableTier.fixedPrice;
  } else if (applicableTier.discountAmount !== undefined) {
    // Dollar amount discount
    unitPrice = Math.max(0, basePrice - applicableTier.discountAmount);
  } else if (applicableTier.discountPercentage !== undefined) {
    // Percentage discount
    unitPrice = basePrice * (1 - applicableTier.discountPercentage / 100);
  }

  const subtotal = unitPrice * quantity;
  const regularSubtotal = basePrice * quantity;
  const savings = regularSubtotal - subtotal;
  const savingsPercentage = (savings / regularSubtotal) * 100;

  return {
    quantity,
    unitPrice,
    subtotal,
    tierApplied: applicableTier,
    savings,
    savingsPercentage,
  };
}

/**
 * Apply B2B account discount to base price
 */
export function applyB2BDiscount(basePrice: number, account: B2BAccount): number {
  if (account.status !== 'approved') {
    return basePrice;
  }

  const discountMultiplier = 1 - (account.discountPercentage / 100);
  return basePrice * discountMultiplier;
}

/**
 * Calculate B2B price with both account discount and tier pricing
 */
export function calculateB2BPrice(
  basePrice: number,
  quantity: number,
  account: B2BAccount,
  productId?: number,
  sku?: string
): TierPricingResult {
  // Apply account-level discount first
  const discountedPrice = applyB2BDiscount(basePrice, account);

  // Then apply tier pricing
  let tierPricing: TierPricing | null = null;
  
  if (productId) {
    tierPricing = getTierPricingByProductId(productId);
  } else if (sku) {
    tierPricing = getTierPricingBySku(sku);
  }

  return calculateTierPrice(discountedPrice, quantity, tierPricing || undefined);
}

/**
 * Get all tier price breaks for display
 * Returns array of price points for different quantities
 */
export function getTierPriceBreaks(
  basePrice: number,
  tierPricing?: TierPricing,
  maxQuantity: number = 100
): Array<{ quantity: number; unitPrice: number; savings: number }> {
  if (!tierPricing || !tierPricing.tiers) {
    return [{ quantity: 1, unitPrice: basePrice, savings: 0 }];
  }

  const breaks: Array<{ quantity: number; unitPrice: number; savings: number }> = [];

  // Add tier breaks
  tierPricing.tiers.forEach(tier => {
    if (tier.minQuantity <= maxQuantity) {
      const result = calculateTierPrice(basePrice, tier.minQuantity, tierPricing);
      breaks.push({
        quantity: tier.minQuantity,
        unitPrice: result.unitPrice,
        savings: result.savings,
      });
    }
  });

  // Sort by quantity
  breaks.sort((a, b) => a.quantity - b.quantity);

  // If no breaks start at 1, add it
  if (breaks.length === 0 || breaks[0].quantity > 1) {
    breaks.unshift({ quantity: 1, unitPrice: basePrice, savings: 0 });
  }

  return breaks;
}

/**
 * Format tier pricing for display
 */
export function formatTierPricing(result: TierPricingResult): {
  priceText: string;
  savingsText: string | null;
  tierText: string | null;
} {
  const priceText = `$${result.unitPrice.toFixed(2)}`;
  
  let savingsText: string | null = null;
  if (result.savings > 0) {
    savingsText = `Save $${result.savings.toFixed(2)} (${result.savingsPercentage.toFixed(0)}%)`;
  }

  let tierText: string | null = null;
  if (result.tierApplied) {
    const min = result.tierApplied.minQuantity;
    const max = result.tierApplied.maxQuantity;
    tierText = max ? `Buy ${min}-${max}` : `Buy ${min}+`;
  }

  return { priceText, savingsText, tierText };
}

/**
 * Calculate payment terms due date
 */
export function calculateDueDate(orderDate: Date, paymentTerms: string): Date {
  const due = new Date(orderDate);
  
  switch (paymentTerms) {
    case 'net-15':
      due.setDate(due.getDate() + 15);
      break;
    case 'net-30':
      due.setDate(due.getDate() + 30);
      break;
    case 'net-45':
      due.setDate(due.getDate() + 45);
      break;
    case 'net-60':
      due.setDate(due.getDate() + 60);
      break;
    case 'prepay':
    default:
      // Due immediately
      break;
  }
  
  return due;
}

/**
 * Check if credit limit allows order
 */
export function canPlaceOrder(
  account: B2BAccount,
  orderTotal: number
): { allowed: boolean; reason?: string } {
  if (account.status !== 'approved') {
    return { allowed: false, reason: 'Account not approved' };
  }

  if (account.status === 'suspended') {
    return { allowed: false, reason: 'Account suspended' };
  }

  // If no credit limit, all orders allowed
  if (!account.creditLimit || account.paymentTerms === 'prepay') {
    return { allowed: true };
  }

  const creditAvailable = account.creditLimit - account.creditUsed;
  if (orderTotal > creditAvailable) {
    return { 
      allowed: false, 
      reason: `Order exceeds available credit. Available: $${creditAvailable.toFixed(2)}` 
    };
  }

  return { allowed: true };
}

/**
 * Calculate minimum order quantity discount incentive
 */
export function getMOQIncentive(
  basePrice: number,
  quantity: number,
  moq: number,
  tierPricing?: TierPricing
): { shouldOrder: number; savings: number; message: string } | null {
  if (quantity >= moq) {
    return null; // Already at MOQ
  }

  const currentResult = calculateTierPrice(basePrice, quantity, tierPricing);
  const moqResult = calculateTierPrice(basePrice, moq, tierPricing);
  
  const additionalQuantity = moq - quantity;
  const additionalCost = moqResult.unitPrice * additionalQuantity;
  const potentialSavings = moqResult.savings - currentResult.savings;

  if (potentialSavings > 0) {
    return {
      shouldOrder: moq,
      savings: potentialSavings,
      message: `Order ${additionalQuantity} more to save $${potentialSavings.toFixed(2)}!`,
    };
  }

  return null;
}

/**
 * Validate tier pricing configuration
 */
export function validateTierPricing(tiers: TierPricing['tiers']): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!tiers || tiers.length === 0) {
    errors.push('At least one tier is required');
    return { valid: false, errors };
  }

  // Check for overlapping ranges
  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const tier1 = tiers[i];
      const tier2 = tiers[j];

      // Check if ranges overlap
      const tier1Max = tier1.maxQuantity || Infinity;
      const tier2Max = tier2.maxQuantity || Infinity;

      if (
        (tier1.minQuantity >= tier2.minQuantity && tier1.minQuantity <= tier2Max) ||
        (tier2.minQuantity >= tier1.minQuantity && tier2.minQuantity <= tier1Max)
      ) {
        errors.push(`Tiers ${i + 1} and ${j + 1} have overlapping quantity ranges`);
      }
    }

    // Validate tier has pricing method
    const tier = tiers[i];
    if (
      tier.fixedPrice === undefined &&
      tier.discountAmount === undefined &&
      tier.discountPercentage === undefined
    ) {
      errors.push(`Tier ${i + 1} must have a pricing method (fixedPrice, discountAmount, or discountPercentage)`);
    }

    // Validate min < max
    if (tier.maxQuantity && tier.minQuantity >= tier.maxQuantity) {
      errors.push(`Tier ${i + 1}: minQuantity must be less than maxQuantity`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

