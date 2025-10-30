/**
 * Referral Program Types
 * 
 * Types for customer referral program and social sharing features
 */

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string; // Unique referral code (e.g., "JOHN25")
  clicks: number;
  conversions: number;
  total_revenue: number;
  total_rewards: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralClick {
  id: string;
  referral_code_id: string;
  referral_code: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  converted: boolean;
  conversion_order_id: number | null;
  clicked_at: string;
}

export interface ReferralConversion {
  id: string;
  referral_code_id: string;
  referral_code: string;
  referrer_user_id: string; // User who referred
  referred_user_id: string | null; // User who was referred
  order_id: number;
  order_total: number;
  referrer_reward: number;
  referred_discount: number;
  reward_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  converted_at: string;
  processed_at: string | null;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referral_conversion_id: string;
  reward_type: 'credit' | 'discount' | 'percentage' | 'fixed';
  reward_amount: number;
  reward_code: string | null; // Promo code if applicable
  status: 'pending' | 'active' | 'redeemed' | 'expired';
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ReferralSettings {
  id: string;
  enabled: boolean;
  referrer_reward_type: 'credit' | 'discount' | 'percentage' | 'fixed';
  referrer_reward_amount: number;
  referred_discount_type: 'percentage' | 'fixed';
  referred_discount_amount: number;
  minimum_order_value: number;
  reward_delay_days: number; // Days to wait before reward is granted (for returns)
  terms_text: string | null;
  updated_at: string;
}

export interface ReferralStats {
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_revenue: number;
  total_rewards: number;
  pending_rewards: number;
  active_referrers: number;
  recent_conversions: ReferralConversion[];
}

export interface UserReferralStats {
  referral_code: string;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_revenue: number;
  total_rewards_earned: number;
  pending_rewards: number;
  available_rewards: number;
  recent_referrals: Array<{
    referred_email: string;
    order_id: number;
    order_total: number;
    reward_amount: number;
    status: string;
    converted_at: string;
  }>;
}

export interface SocialShareData {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
}

export type SocialPlatform = 
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'email'
  | 'copy';

export interface ShareAnalytics {
  id: string;
  user_id: string | null;
  share_type: 'product' | 'referral' | 'order' | 'general';
  share_platform: SocialPlatform;
  shared_url: string;
  product_id: string | null;
  referral_code: string | null;
  ip_address: string | null;
  shared_at: string;
}

export interface CreateReferralCodeInput {
  user_id: string;
  code?: string; // If not provided, will be auto-generated
}

export interface UpdateReferralCodeInput {
  active?: boolean;
}

export interface TrackReferralClickInput {
  referral_code: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page?: string;
}

export interface CreateReferralConversionInput {
  referral_code: string;
  referred_user_id?: string;
  order_id: number;
  order_total: number;
}

export interface TrackSocialShareInput {
  user_id?: string;
  share_type: 'product' | 'referral' | 'order' | 'general';
  share_platform: SocialPlatform;
  shared_url: string;
  product_id?: string;
  referral_code?: string;
  ip_address?: string;
}

