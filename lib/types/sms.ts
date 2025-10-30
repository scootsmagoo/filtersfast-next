/**
 * SMS Marketing Type Definitions
 */

export interface SMSSubscription {
  id: number;
  user_id: number | null;
  phone_number: string;
  country_code: string;
  attentive_subscriber_id: string | null;
  
  // Status
  is_subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  
  // Channels
  transactional_opt_in: boolean;
  marketing_opt_in: boolean;
  
  // Source
  subscription_source: 'checkout' | 'account' | 'social' | 'popup' | string;
  ip_address: string | null;
  user_agent: string | null;
  
  // Compliance
  tcpa_consent: boolean;
  tcpa_consent_date: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SMSPreferences {
  id: number;
  subscription_id: number;
  
  // Transactional preferences
  order_confirmation: boolean;
  shipping_updates: boolean;
  delivery_notifications: boolean;
  return_updates: boolean;
  
  // Marketing preferences
  promotional_offers: boolean;
  new_products: boolean;
  flash_sales: boolean;
  filter_reminders: boolean;
  
  // Frequency control
  max_messages_per_week: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SMSMessage {
  id: number;
  subscription_id: number;
  
  // Message details
  message_type: 'transactional' | 'marketing' | 'reminder';
  message_category: string;
  message_content: string;
  
  // Attentive data
  attentive_message_id: string | null;
  attentive_campaign_id: string | null;
  
  // Status
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked';
  sent_at: string | null;
  delivered_at: string | null;
  clicked_at: string | null;
  failed_reason: string | null;
  
  // Relations
  order_id: number | null;
  
  // Cost
  cost_cents: number;
  
  // Timestamp
  created_at: string;
}

export interface SMSCampaign {
  id: number;
  
  // Campaign details
  name: string;
  description: string | null;
  message_template: string;
  
  // Targeting
  target_audience: 'all' | 'new_customers' | 'repeat_customers' | 'vip' | string;
  segment_filter: string | null;
  
  // Scheduling
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduled_for: string | null;
  sent_at: string | null;
  completed_at: string | null;
  
  // Metrics
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  total_cost_cents: number;
  
  // Creator
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SMSAnalytics {
  id: number;
  date: string;
  
  // Subscription metrics
  new_subscriptions: number;
  unsubscriptions: number;
  total_active_subscribers: number;
  
  // Message metrics
  transactional_sent: number;
  marketing_sent: number;
  total_delivered: number;
  total_failed: number;
  total_clicks: number;
  
  // Performance
  click_rate: number;
  delivery_rate: number;
  opt_out_rate: number;
  
  // Revenue
  revenue_attributed: number;
  total_cost_cents: number;
  roi: number;
  
  created_at: string;
}

// Request/Response types
export interface SubscribeToSMSRequest {
  phone_number: string;
  country_code?: string;
  transactional_opt_in?: boolean;
  marketing_opt_in?: boolean;
  tcpa_consent: boolean;
  subscription_source?: string;
}

export interface UpdateSMSPreferencesRequest {
  order_confirmation?: boolean;
  shipping_updates?: boolean;
  delivery_notifications?: boolean;
  return_updates?: boolean;
  promotional_offers?: boolean;
  new_products?: boolean;
  flash_sales?: boolean;
  filter_reminders?: boolean;
  max_messages_per_week?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

export interface SMSSubscriptionWithPreferences extends SMSSubscription {
  preferences: SMSPreferences;
}

export interface SMSStats {
  total_subscribers: number;
  active_subscribers: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  messages_sent_today: number;
  messages_sent_this_week: number;
  messages_sent_this_month: number;
  average_delivery_rate: number;
  average_click_rate: number;
  total_revenue_attributed: number;
  total_cost_cents: number;
  roi: number;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  message_template: string;
  target_audience: string;
  segment_filter?: string;
  scheduled_for?: string;
}

export interface SendTestSMSRequest {
  phone_number: string;
  message: string;
}

