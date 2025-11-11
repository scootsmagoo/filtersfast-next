/**
 * Deal Management Types
 * For special offers and deals system
 */

export interface DealRewardSku {
  sku: string
  quantity: number
  priceOverride?: number | null
}

export interface Deal {
  iddeal: number
  dealdiscription: string
  startprice: number
  endprice: number
  units: number
  active: number  // 0 = inactive, 1 = active
  validFrom: number | null  // Unix timestamp
  validTo: number | null    // Unix timestamp
  createdAt: number
  updatedAt: number
  rewardSkus: DealRewardSku[]
  rewardAutoAdd: number
}

export interface DealFormData {
  dealdiscription: string
  startprice: number
  endprice: number
  units: number
  active?: number
  validFrom?: string | null  // ISO date string
  validTo?: string | null    // ISO date string
  rewardSkus?: string
  rewardAutoAdd?: number
}

export interface DealListResponse {
  success: boolean
  deals: Deal[]
  total: number
}

export interface DealResponse {
  success: boolean
  deal?: Deal
  error?: string
}

