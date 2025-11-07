/**
 * Category Management Types
 * For product category hierarchy and admin management
 */

export type CategoryType =
  | ''                    // None (Parent category)
  | 'Brands'              // Brand categories
  | 'Size'                // Size categories
  | 'Type'                // Type categories
  | 'Filtration Level'    // Filtration level categories
  | 'Deal'                // Deal categories
  | 'MarketingPromos'     // Marketing promotions

export interface Category {
  id: number
  categoryDesc: string
  idParentCategory: number
  categoryFeatured: 'Y' | 'N'
  categoryHTML: string | null
  categoryHTMLLong: string | null
  sortOrder: number | null
  categoryGraphic: string | null
  categoryImage: string | null
  categoryContentLocation: number  // 0 = above products, 1 = below products
  categoryType: CategoryType
  hideFromListings: number  // 0 = show, 1 = hide
  pagname: string | null
  metatitle: string | null
  metadesc: string | null
  metacat: string | null
  createdAt?: number
  updatedAt?: number
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  productCount?: number
  parentCategoryDesc?: string
}

export interface CategoryFormData {
  categoryDesc: string
  idParentCategory: number
  categoryFeatured: 'Y' | 'N'
  categoryHTML?: string
  categoryHTMLLong?: string
  sortOrder?: number
  categoryGraphic?: string
  categoryImage?: string
  categoryContentLocation?: number
  categoryType?: CategoryType
  hideFromListings?: number
  pagname?: string
  metatitle?: string
  metadesc?: string
  metacat?: string
}

export interface CategoryListResponse {
  success: boolean
  categories: CategoryWithChildren[]
  total: number
}

export interface CategoryProduct {
  idCatProd: number
  idCategory: number
  idProduct: number
  product?: {
    id: string
    sku: string
    name: string
    description: string | null
    status: string
  }
}

export interface CategoryProductsResponse {
  success: boolean
  products: CategoryProduct[]
  total: number
}

