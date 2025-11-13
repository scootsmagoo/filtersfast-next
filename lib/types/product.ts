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
  | 'gift-card'            // Digital gift cards
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

export type ReturnRestrictionLevel =
  | 0 // Normal return policy
  | 1 // Refund only
  | 2 // Non-returnable (all sales final)

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
  maxCartQty: number | null
  
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
  retExclude: ReturnRestrictionLevel
  blockedReason: string | null
  
  // Subscription
  subscriptionEligible: boolean
  subscriptionDiscount: number  // Percentage off for subscribe & save

  // Gift With Purchase
  giftWithPurchaseProductId: string | null
  giftWithPurchaseQuantity: number
  giftWithPurchaseAutoAdd: boolean
  
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
  maxCartQty: number | null
  
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

  // Gift With Purchase
  giftWithPurchaseProductId: string | null
  giftWithPurchaseQuantity: number
  giftWithPurchaseAutoAdd: boolean

  // Policies & Restrictions
  retExclude: ReturnRestrictionLevel
  blockedReason: string | null
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

export interface ProductSnapshotMetadata {
  id: string
  productId: string
  fileName: string
  fileSize: number
  note: string | null
  createdAt: number
  createdBy: string
  createdByName: string
}

export interface ProductSnapshotPayload {
  metadata: {
    snapshotId: string
    productId: string
    capturedAt: number
    capturedBy: {
      id: string
      name: string
    }
    note: string | null
    version: number
  }
  product: Product
  extras?: Record<string, any> | null
}

export interface ProductSnapshot extends ProductSnapshotMetadata {
  snapshot: ProductSnapshotPayload
}

export interface BulkProductAction {
  action: 'update-status' | 'update-price' | 'update-inventory' | 'add-tag' | 'remove-tag' | 'delete'
  productIds: string[]
  data: Record<string, any>
}

export interface ProductImportRow {
  sku: string
  name?: string
  brand?: string
  type?: ProductType
  status?: ProductStatus
  price?: number | null
  compareAtPrice?: number | null
  costPrice?: number | null
  inventoryQuantity?: number
  lowStockThreshold?: number
  allowBackorder?: boolean
  trackInventory?: boolean
  description?: string
  retExclude?: ReturnRestrictionLevel
  blockedReason?: string | null
  [key: string]: any
}

export interface ProductExport {
  product: Product
  totalOrders: number
  totalRevenue: number
  lastOrderDate: number | null
}

export type ProductBulkJobType =
  | 'status-update'
  | 'price-update'
  | 'inventory-update'
  | 'import-csv'
  | 'export-csv'

export type ProductBulkJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ProductBulkJobSummary {
  [key: string]: string | number | boolean | null | ProductBulkJobSummary | ProductBulkJobSummary[]
}

export interface ProductBulkJob {
  id: string
  type: ProductBulkJobType
  status: ProductBulkJobStatus
  createdBy: string
  createdByName: string | null
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  totalItems: number
  processedItems: number
  failedItems: number
  parameters: Record<string, any>
  summary: ProductBulkJobSummary | null
  error: string | null
}

export interface ProductBulkJobItem {
  id: string
  jobId: string
  reference?: string
  action?: string
  status: 'pending' | 'processed' | 'failed' | 'skipped'
  payload?: Record<string, any> | null
  result?: Record<string, any> | null
  error?: string | null
  createdAt: number
  processedAt: number | null
}

export interface BulkStatusUpdateInput {
  productId: string
  newStatus: ProductStatus
}

export interface BulkStatusUpdateResult {
  updated: number
  skipped: number
  notFound: string[]
  errors: Array<{ productId: string; error: string }>
}

export interface BulkPriceUpdateInput {
  productId: string
  price?: number
  compareAtPrice?: number | null
  costPrice?: number | null
}

export interface BulkPriceUpdateResult {
  updated: number
  skipped: number
  notFound: string[]
  errors: Array<{ productId: string; error: string }>
}

export interface BulkInventoryUpdateInput {
  productId: string
  inventoryQuantity?: number
  lowStockThreshold?: number
  allowBackorder?: boolean
  trackInventory?: boolean
}

export interface BulkInventoryUpdateResult {
  updated: number
  skipped: number
  notFound: string[]
  errors: Array<{ productId: string; error: string }>
}

export interface ProductImportOptions {
  allowCreate?: boolean
  defaultStatus?: ProductStatus
  updateInventory?: boolean
  updatePricing?: boolean
  updateStatus?: boolean
}

export interface ProductImportFailure {
  rowNumber: number
  sku: string
  error: string
}

export interface ProductImportResult {
  totalRows: number
  processedRows: number
  created: number
  updated: number
  skipped: number
  statusUpdates: number
  priceUpdates: number
  inventoryUpdates: number
  failures: ProductImportFailure[]
}

// ========================================
// PRODUCT OPTIONS/VARIANTS TYPES
// ========================================

export type OptionType = 'S' | 'T' // S = Select (dropdown), T = Text input
export type OptionRequired = 'Y' | 'N' // Y = required, N = optional

export interface OptionGroup {
  idOptionGroup: string
  optionGroupDesc: string
  optionReq: OptionRequired
  optionType: OptionType
  sizingLink: number // 1 = show sizing chart link
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface Option {
  idOption: string
  optionDescrip: string
  priceToAdd: number // Additional price for this option
  percToAdd: number // Percentage to add to base price
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface ProductOptionGroup {
  id: string
  idProduct: string
  idOptionGroup: string
  createdAt: number
}

export interface ProductOptionInventory {
  id: string
  idProduct: string
  idOption: string
  stock: number
  actualInventory: number
  ignoreStock: number // 1 = ignore stock levels
  unavailable: number // 1 = unavailable
  blocked: number // 1 = blocked/discontinued
  reasonCode: string | null
  dropShip: number // 1 = dropship item
  specialOrder: number // 1 = special order
  updateCPStock: number // 1 = update ChannelPilot stock
  createdAt: number
  updatedAt: number
}

export interface ProductOptionImage {
  id: string
  idProduct: string
  idOption: string
  optionImageUrl: string
  sortOrder: number
  createdAt: number
}

export interface ProductOptionExclusion {
  id: string
  idProduct: string
  idOption: string
  createdAt: number
}

export interface ProductOptionGroupWithOptions extends OptionGroup {
  options: Option[]
  excludedOptions?: string[] // Option IDs excluded for this product
}

export interface ProductOptionWithInventory extends Option {
  inventory?: ProductOptionInventory
  image?: ProductOptionImage
  available: boolean // Calculated from inventory
  unavailable?: boolean
  blocked?: boolean
}

export interface ProductWithOptions extends Product {
  optionGroups: ProductOptionGroupWithOptions[]
  selectedOptions?: Record<string, string> // optionGroupId -> optionId
}

export interface OptionGroupFormData {
  optionGroupDesc: string
  optionReq: OptionRequired
  optionType: OptionType
  sizingLink: number
  sortOrder: number
}

export interface OptionFormData {
  optionDescrip: string
  priceToAdd: number
  percToAdd: number
  sortOrder: number
}

export interface ProductOptionGroupAssignment {
  idOptionGroup: string
  excludedOptions?: string[] // Option IDs to exclude for this product
}

