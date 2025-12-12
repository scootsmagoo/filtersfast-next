/**
 * Type definitions for Giveaway/Sweepstakes system
 */

export interface Giveaway {
  id: number;
  campaign_name: string;
  title: string;
  description: string;
  product_name: string | null;
  product_url: string | null;
  product_image_url: string | null;
  prize_description: string;
  start_date: string;
  end_date: string;
  is_active: number;
  winner_id: number | null;
  winner_notified: number;
  winner_selected_at: string | null;
  created_at: string;
  updated_at: string;
  entry_count?: number;
  winner_first_name?: string;
  winner_last_name?: string;
  winner_email?: string;
}

export interface GiveawayEntry {
  id: number;
  giveaway_id: number;
  customer_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  entry_date: string;
  is_winner: number;
}

export interface CreateGiveawayRequest {
  campaignName: string;
  title: string;
  description: string;
  productName?: string;
  productUrl?: string;
  productImageUrl?: string;
  prizeDescription: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isActive?: boolean;
}

export interface UpdateGiveawayRequest extends Partial<CreateGiveawayRequest> {
  id: number;
}

export interface SubmitEntryRequest {
  giveawayId?: number;
  campaignName?: string;
  firstName: string;
  lastName: string;
  email: string;
  recaptchaToken: string;
}

export interface GiveawayStats {
  total_giveaways: number;
  active_giveaways: number;
  ended_giveaways: number;
  winners_selected: number;
  total_entries: number;
}

export interface GiveawayStatus {
  status: 'upcoming' | 'active' | 'ended';
  daysRemaining?: number;
  hasEntered?: boolean;
  canEnter: boolean;
}

export interface PublicGiveaway {
  id: number;
  campaignName: string;
  title: string;
  description: string;
  productName: string | null;
  productUrl: string | null;
  productImageUrl: string | null;
  prizeDescription: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  status: GiveawayStatus;
}

