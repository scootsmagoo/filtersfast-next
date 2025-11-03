/**
 * Product Management Types
 * For e-commerce product catalog and admin management
 */

export type ProductStatus =
  | 'active'        // Live on site, purchasable
  | 'draft'         // Not yet published
  | 'archived'      // Hidden but not deleted
  | 'out-of-stock'  // Temporarily unavailable

export type ProductType =
  | 'air-filter'           // HVAC air filters
  | 'water-filter'         // Water filtration
  | 'refrigerator-filter'  // Fridge filters
  | 'humidifier-filter'    // Humidifier pads
  | 'pool-filter'          // Pool and spa filters
  | 'custom'               // Custom products
  | 'accessory'            // Tools, accessories
  | 'other'                // Miscellaneous

export type MervRating =
  | '1-4'    // Basic filtration
  | '5-7'    // Better filtration
  | '8'      // Standard residential
  | '9-12'   // Superior residential
  | '13'     // Superior residential (smoke, smog)
  | '14-16'  // Hospital-grade
  | '17-20'  // HEPA filtration
  | null     // N/A for non-air filters

export interface ProductDimensions {
  height: number   // Inches
  width: number    // Inches
  depth: number    // Inches
  weight?: number  // Pounds (optional)
}

export interface ProductImage {
  url: string
  alt: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductVariant {
  id: string
  sku: string
  name: string  // e.g., "6-Pack", "Single", "Case of 12"
  price: number
  compareAtPrice?: number
  quantity: number
  isDefault: boolean
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  parentId?: string
}

export interface Product {
  id: string
  
  // Basic Information
  name: string
  slug: string
  sku: string
  brand: string
  description: string | null
  shortDescription: string | null
  
  // Type & Classification
  type: ProductType
  status: ProductStatus
  
  // Pricing
  price: number
  compareAtPrice: number | null  // "Was" price for showing savings
  costPrice: number | null       // Internal cost (for margin calculations)
  
  // Inventory
  trackInventory: boolean
  inventoryQuantity: number
  lowStockThreshold: number
  allowBackorder: boolean
  
  // Dimensions (for filters)
  dimensions: ProductDimensions | null
  mervRating: MervRating
  
  // Product Details
  features: string[]  // Array of feature bullet points
  specifications: Record<string, string> // Key-value pairs
  compatibleModels: string[]  // Array of model numbers
  
  // Images
  images: ProductImage[]
  primaryImage: string | null
  
  // Variants (e.g., 1-pack, 6-pack, case)
  hasVariants: boolean
  variants: ProductVariant[]
  
  // Categories & Tags
  categoryIds: string[]
  tags: string[]
  
  // SEO
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  
  // Reviews
  rating: number          // Average rating (0-5)
  reviewCount: number
  
  // Flags & Badges
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  madeInUSA: boolean
  freeShipping: boolean
  badges: string[]  // Custom badges like "NSF Certified", "Top Rated"
  
  // Subscription
  subscriptionEligible: boolean
  subscriptionDiscount: number  // Percentage off for subscribe & save
  
  // Related Products
  relatedProductIds: string[]
  crossSellProductIds: string[]
  
  // Shipping
  weight: number  // Pounds
  requiresShipping: boolean
  shippingClass: string | null  // Standard, Oversized, etc.
  
  // Metadata
  createdAt: number
  updatedAt: number
  createdBy: string | null
  updatedBy: string | null
  publishedAt: number | null
  
  // Stats (read-only)
  viewCount?: number
  orderCount?: number
  revenue?: number
}

export interface ProductFormData {
  // Basic Information
  name: string
  sku: string
  brand: string
  description: string
  shortDescription: string
  
  // Type & Status
  type: ProductType
  status: ProductStatus
  
  // Pricing
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  
  // Inventory
  trackInventory: boolean
  inventoryQuantity: number
  lowStockThreshold: number
  allowBackorder: boolean
  
  // Dimensions
  height: number | null
  width: number | null
  depth: number | null
  weight: number
  mervRating: MervRating
  
  // Details
  features: string
  specifications: string
  compatibleModels: string
  
  // Images
  primaryImage: string
  additionalImages: string
  
  // Categories & Tags
  categoryIds: string[]
  tags: string[]
  
  // SEO
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  
  // Flags
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  madeInUSA: boolean
  freeShipping: boolean
  subscriptionEligible: boolean
  subscriptionDiscount: number
}

export interface ProductFilters {
  status?: ProductStatus
  type?: ProductType
  brand?: string
  categoryId?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isFeatured?: boolean
  mervRating?: MervRating
  sortBy?: 'name' | 'price' | 'created' | 'updated' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ProductListResponse {
  products: Product[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ProductStats {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  outOfStockProducts: number
  archivedProducts: number
  lowStockProducts: number
  productsByType: Record<ProductType, number>
  productsByBrand: Record<string, number>
  averagePrice: number
  totalInventoryValue: number
  revenueByProduct: Array<{
    productId: string
    productName: string
    revenue: number
    orderCount: number
  }>
}

export interface ProductHistoryEntry {
  id: string
  productId: string
  action: 'created' | 'updated' | 'status-changed' | 'price-changed' | 'inventory-adjusted' | 'deleted'
  changes: Record<string, { old: any; new: any }>
  performedBy: string
  performedByName: string
  timestamp: number
  notes?: string
}

export interface BulkProductAction {
  action: 'update-status' | 'update-price' | 'update-inventory' | 'add-tag' | 'remove-tag' | 'delete'
  productIds: string[]
  data: Record<string, any>
}

export interface ProductImportRow {
  sku: string
  name: string
  brand: string
  type: ProductType
  price: number
  inventoryQuantity: number
  description?: string
  [key: string]: any
}

export interface ProductExport {
  product: Product
  totalOrders: number
  totalRevenue: number
  lastOrderDate: number | null
}

