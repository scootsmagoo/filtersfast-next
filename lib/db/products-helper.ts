/**
 * Product Helper Functions
 * Handles fetching products from both database and mock data
 */

import { getProductById as getDbProductById } from './products';
import type { Product } from '../types/product';

// Mock products (same as in product detail page)
const mockProducts: Array<{
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  badges?: string[];
  category: string;
  description: string;
}> = [
  {
    id: 1,
    name: 'GE MWF Refrigerator Water Filter',
    brand: 'GE',
    sku: 'MWF',
    price: 39.99,
    originalPrice: 49.99,
    rating: 4.8,
    reviewCount: 1247,
    image: '/products/ge-mwf.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
    category: 'refrigerator',
    description: 'Genuine GE MWF refrigerator water filter replacement. Reduces chlorine taste and odor, lead, and other contaminants.',
  },
  {
    id: 2,
    name: 'Whirlpool EDR1RXD1 Water Filter',
    brand: 'Whirlpool',
    sku: 'EDR1RXD1',
    price: 44.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/products/whirlpool-edr1rxd1.jpg',
    inStock: true,
    badges: ['genuine'],
    category: 'refrigerator',
    description: 'OEM Whirlpool EDR1RXD1 water filter. Fits most Whirlpool, KitchenAid, and Maytag refrigerators.',
  },
  {
    id: 3,
    name: 'LG LT700P Refrigerator Water Filter',
    brand: 'LG',
    sku: 'LT700P',
    price: 42.99,
    originalPrice: 54.99,
    rating: 4.9,
    reviewCount: 2103,
    image: '/products/lg-lt700p.jpg',
    inStock: true,
    badges: ['bestseller', 'genuine'],
    category: 'refrigerator',
    description: 'LG LT700P genuine water filter. NSF certified to reduce chlorine taste and odor.',
  },
];

/**
 * Get product by ID, checking both database and mock products
 */
export function getProductByIdOrMock(productId: string): Product | null {
  // First try database
  const dbProduct = getDbProductById(productId);
  if (dbProduct) {
    return dbProduct;
  }
  
  // If not found and it's a numeric ID, check mock products
  const numericId = parseInt(productId, 10);
  if (!isNaN(numericId)) {
    const mockProduct = mockProducts.find(p => p.id === numericId);
    if (mockProduct) {
      // Convert mock product to Product format
      return {
        id: productId, // Use the string ID as stored
        name: mockProduct.name,
        brand: mockProduct.brand,
        sku: mockProduct.sku,
        price: mockProduct.price,
        compareAtPrice: mockProduct.originalPrice || null,
        rating: mockProduct.rating,
        reviewCount: mockProduct.reviewCount,
        primaryImage: mockProduct.image,
        inventoryQuantity: mockProduct.inStock ? 100 : 0,
        trackInventory: true,
        status: 'active',
        type: mockProduct.category === 'refrigerator' ? 'refrigerator-filter' : 'water-filter',
        description: mockProduct.description,
        slug: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: null,
        updatedBy: null,
        viewCount: 0,
        badges: mockProduct.badges || [],
        requiresShipping: true,
        isBestSeller: mockProduct.badges?.includes('bestseller') || false,
        isFeatured: false,
        isNew: false,
        categoryIds: [],
        compatibleModels: [],
        specifications: {},
        retExclude: 0,
        blockedReason: null,
        maxCartQty: null,
        costPrice: null,
        lowStockThreshold: 10,
        allowBackorder: false,
      };
    }
  }
  
  return null;
}

