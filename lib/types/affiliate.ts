/**
 * Affiliate Program Types
 * 
 * Performance-based marketing system for external partners
 * (bloggers, influencers, businesses)
 */

export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type CommissionType = 'percentage' | 'flat' | 'tiered';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type PayoutMethod = 'paypal' | 'bank_transfer' | 'check';

/**
 * Affiliate account
 */
export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string; // Unique tracking code
  
  // Profile Info
  company_name?: string;
  website?: string;
  promotional_methods: string[]; // ['blog', 'social_media', 'email', 'paid_ads']
  audience_size?: string; // '< 1k', '1k-10k', '10k-100k', '100k+'
  
  // Commission Structure
  commission_type: CommissionType;
  commission_rate: number; // Percentage (e.g., 10) or flat amount ($5.00)
  
  // Status
  status: AffiliateStatus;
  approved_by?: string; // Admin user ID
  approved_at?: string;
  rejected_reason?: string;
  
  // Contact & Payout
  paypal_email?: string;
  bank_account_info?: string; // Encrypted
  preferred_payout_method: PayoutMethod;
  minimum_payout_threshold: number; // Default $50
  
  // Stats (denormalized for performance)
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  total_commission_earned: number;
  total_commission_paid: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Affiliate click tracking
 */
export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  affiliate_code: string;
  
  // Tracking Info
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page: string;
  
  // Conversion
  converted: boolean;
  order_id?: string;
  
  // Session tracking
  session_token: string; // For cookie attribution
  
  clicked_at: string;
}

/**
 * Affiliate conversion (sale)
 */
export interface AffiliateConversion {
  id: string;
  affiliate_id: string;
  affiliate_code: string;
  click_id?: string;
  
  // Order Info
  order_id: string;
  customer_id?: string;
  order_total: number;
  
  // Commission
  commission_rate: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  
  // Timestamps
  converted_at: string;
  approved_at?: string;
  paid_at?: string;
}

/**
 * Affiliate payout
 */
export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  
  // Payout Info
  amount: number;
  payout_method: PayoutMethod;
  payout_status: PayoutStatus;
  
  // Payment Details
  transaction_id?: string; // PayPal transaction ID, check number, etc.
  payout_date?: string;
  payout_notes?: string;
  
  // What's included
  conversion_ids: string[]; // JSON array of conversion IDs included in this payout
  from_date: string;
  to_date: string;
  
  // Processing
  processed_by?: string; // Admin user ID
  processed_at?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Affiliate marketing material
 */
export interface AffiliateMarketingMaterial {
  id: string;
  
  // Material Info
  title: string;
  description: string;
  type: 'banner' | 'text_link' | 'product_link' | 'email_template';
  
  // Content
  image_url?: string;
  link_text?: string;
  html_code?: string;
  
  // Dimensions (for banners)
  width?: number;
  height?: number;
  
  // Stats
  usage_count: number;
  
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Affiliate application (before approval)
 */
export interface AffiliateApplication {
  id: string;
  user_id: string;
  
  // Application Info
  company_name?: string;
  website: string;
  promotional_methods: string[];
  audience_size?: string;
  promotion_plan: string; // How they plan to promote
  
  // Social Proof
  social_media_links?: string[]; // JSON array
  monthly_traffic?: string;
  
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Affiliate statistics
 */
export interface AffiliateStats {
  affiliate_id: string;
  affiliate_code: string;
  
  // Performance
  total_clicks: number;
  unique_clicks: number;
  total_conversions: number;
  conversion_rate: number; // percentage
  
  // Revenue
  total_revenue: number;
  average_order_value: number;
  total_commission: number;
  
  // Earnings
  pending_commission: number;
  approved_commission: number;
  paid_commission: number;
  next_payout_amount: number;
  
  // Time period
  period_start: string;
  period_end: string;
  
  // Top products (optional)
  top_products?: Array<{
    product_id: string;
    product_name: string;
    conversions: number;
    revenue: number;
  }>;
  
  // Recent conversions
  recent_conversions?: Array<{
    order_id: string;
    order_total: number;
    commission_amount: number;
    commission_status: string;
    converted_at: string;
  }>;
}

/**
 * Affiliate settings (global)
 */
export interface AffiliateSettings {
  id: string; // 'default'
  
  // Program Status
  program_enabled: boolean;
  auto_approve_affiliates: boolean;
  
  // Default Commission
  default_commission_type: CommissionType;
  default_commission_rate: number;
  
  // Cookie Settings
  cookie_duration_days: number; // Default 30
  
  // Payout Settings
  minimum_payout_threshold: number; // Default $50
  payout_schedule: 'monthly' | 'bi_monthly' | 'manual';
  commission_hold_days: number; // Days before commission is approved (default 30 for returns)
  
  // Application Settings
  require_website: boolean;
  require_traffic_info: boolean;
  
  // Terms
  terms_text: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Create affiliate input
 */
export interface CreateAffiliateInput {
  user_id: string;
  company_name?: string;
  website?: string;
  promotional_methods: string[];
  audience_size?: string;
  paypal_email?: string;
  preferred_payout_method?: PayoutMethod;
}

/**
 * Update affiliate input
 */
export interface UpdateAffiliateInput {
  id: string;
  company_name?: string;
  website?: string;
  promotional_methods?: string[];
  audience_size?: string;
  commission_type?: CommissionType;
  commission_rate?: number;
  status?: AffiliateStatus;
  paypal_email?: string;
  bank_account_info?: string;
  preferred_payout_method?: PayoutMethod;
  minimum_payout_threshold?: number;
}

/**
 * Track affiliate click input
 */
export interface TrackAffiliateClickInput {
  affiliate_code: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page: string;
}

/**
 * Create affiliate conversion input
 */
export interface CreateAffiliateConversionInput {
  affiliate_code: string;
  order_id: string;
  customer_id?: string;
  order_total: number;
  session_token?: string; // For matching to click
}

/**
 * Affiliate registration data
 */
export interface AffiliateRegistrationData {
  company_name?: string;
  website: string;
  promotional_methods: string[];
  audience_size?: string;
  promotion_plan: string;
  social_media_links?: string[];
  monthly_traffic?: string;
  paypal_email?: string;
  preferred_payout_method: PayoutMethod;
  agree_to_terms: boolean;
}

/**
 * Admin affiliate overview
 */
export interface AdminAffiliateOverview {
  total_affiliates: number;
  active_affiliates: number;
  pending_applications: number;
  suspended_affiliates: number;
  
  total_clicks_30d: number;
  total_conversions_30d: number;
  total_revenue_30d: number;
  average_conversion_rate: number;
  
  total_commission_pending: number;
  total_commission_approved: number;
  total_commission_paid: number;
  
  pending_payouts_count: number;
  pending_payouts_amount: number;
  
  top_affiliates: Array<{
    affiliate_id: string;
    affiliate_code: string;
    affiliate_name: string;
    conversions: number;
    revenue: number;
    commission: number;
  }>;
  
  recent_applications: Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    website: string;
    created_at: string;
  }>;
}

