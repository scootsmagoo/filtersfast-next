/**
 * Loyalty Program Types
 * For customer loyalty points and rewards management
 */

export type LoyaltyTransactionType =
  | 'earned'      // Points earned from purchase, review, etc.
  | 'redeemed'    // Points redeemed for discount
  | 'expired'     // Points expired
  | 'adjusted'    // Points adjusted by admin
  | 'refunded'    // Points refunded due to order cancellation
  | 'bonus'       // Bonus points awarded

export interface LoyaltySettings {
  id: string
  is_enabled: number
  points_per_dollar: number
  points_per_review: number
  points_per_referral: number
  points_per_birthday: number
  min_redeem_amount: number
  redemption_rate: number // Points per dollar (e.g., 100 points = $1.00)
  expiration_days: number | null
  tier_enabled: number
  created_at: number
  updated_at: number
}

export interface LoyaltyPoints {
  id: string
  user_id: string | null
  customer_email: string
  points_balance: number
  lifetime_points: number
  tier_level: number
  tier_name: string
  last_activity_at: number | null
  created_at: number
  updated_at: number
}

export interface LoyaltyTransaction {
  id: string
  loyalty_points_id: string
  user_id: string | null
  customer_email: string
  transaction_type: LoyaltyTransactionType
  points: number // Can be negative for redemptions
  balance_before: number
  balance_after: number
  order_id: string | null
  order_number: string | null
  description: string | null
  expires_at: number | null
  performed_by_id: string | null
  performed_by_name: string | null
  created_at: number
}

export interface LoyaltyTier {
  id: string
  tier_level: number
  tier_name: string
  min_points: number
  max_points: number | null
  points_multiplier: number
  benefits: string | null
  created_at: number
  updated_at: number
}

export interface EarnPointsRequest {
  customerEmail: string
  userId?: string
  points: number
  orderId?: string
  orderNumber?: string
  description?: string
}

export interface RedeemPointsRequest {
  customerEmail: string
  userId?: string
  points: number
  orderId?: string
  orderNumber?: string
  description?: string
}

export interface AdjustPointsRequest {
  customerEmail: string
  userId?: string
  points: number // Can be negative
  description?: string
  performedBy?: {
    id: string
    name: string
  }
}

export interface LoyaltyStats {
  totalAccounts: number
  totalPointsIssued: number
  totalPointsRedeemed: number
  activeAccounts: number
}

