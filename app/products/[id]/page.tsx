'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { SearchableProduct } from '@/lib/types';
import Link from 'next/link';

// Mock product data (in production, this would come from an API)
const mockProducts: SearchableProduct[] = [
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
    searchKeywords: ['ge', 'mwf', 'refrigerator', 'water', 'filter', 'genuine', 'replacement'],
    partNumbers: ['MWF', 'GEMWF', 'GE-MWF'],
    compatibility: ['GE Refrigerators', 'Hotpoint', 'Profile'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Cysts'
    }
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
    searchKeywords: ['whirlpool', 'edr1rxd1', 'refrigerator', 'water', 'filter', 'kitchenaid', 'maytag'],
    partNumbers: ['EDR1RXD1', '4396508', '4396710'],
    compatibility: ['Whirlpool', 'KitchenAid', 'Maytag'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Mercury'
    }
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
    searchKeywords: ['lg', 'lt700p', 'refrigerator', 'water', 'filter', 'nsf', 'certified'],
    partNumbers: ['LT700P', 'ADQ73613401'],
    compatibility: ['LG Refrigerators'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Lead, Cysts'
    }
  },
  {
    id: 201,
    name: 'Under Sink Water Filter Replacement',
    brand: 'Filters Fast',
    sku: 'FFUL-001',
    price: 24.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/water-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'water',
    description: 'Universal under sink water filter replacement cartridge. Fits most standard under sink systems.',
    searchKeywords: ['under', 'sink', 'water', 'filter', 'replacement', 'universal', 'cartridge'],
    partNumbers: ['FFUL-001', 'FF-UL-001'],
    compatibility: ['Universal'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '0.75 GPM',
      'Contaminants': 'Chlorine, Sediment, Taste'
    }
  },
  {
    id: 202,
    name: 'Whole House Water Filter Cartridge',
    brand: '3M Aqua-Pure',
    sku: '3MAP-217',
    price: 49.99,
    rating: 4.8,
    reviewCount: 645,
    image: '/images/water-filter-2.jpg',
    inStock: true,
    category: 'water',
    description: '3M Aqua-Pure whole house water filter cartridge. High capacity sediment and chlorine reduction.',
    searchKeywords: ['whole', 'house', 'water', 'filter', '3m', 'aqua', 'pure', 'sediment', 'chlorine'],
    partNumbers: ['3MAP-217', 'AP217'],
    compatibility: ['3M Aqua-Pure Systems'],
    specifications: {
      'Filter Life': '12 months',
      'Flow Rate': '10 GPM',
      'Contaminants': 'Sediment, Chlorine, Taste'
    }
  },
  {
    id: 301,
    name: '16x20x1 Air Filter - 3 Pack',
    brand: 'FiltersFast',
    sku: 'FF-AF-1620-1-3PK',
    price: 29.99,
    rating: 4.6,
    reviewCount: 1234,
    image: '/images/air-filter-1.jpg',
    inStock: true,
    badges: ['value'],
    category: 'air',
    description: 'High-efficiency 16x20x1 air filter 3-pack. MERV 8 rating for excellent particle capture.',
    searchKeywords: ['16x20x1', 'air', 'filter', 'merv', '8', 'hvac', 'furnace', 'ac'],
    partNumbers: ['FF-AF-1620-1-3PK', '1620-1-3PK'],
    compatibility: ['16x20x1 HVAC Systems'],
    specifications: {
      'Size': '16x20x1',
      'MERV Rating': '8',
      'Pack Quantity': '3',
      'Filter Life': '3 months'
    }
  },
  {
    id: 302,
    name: '20x25x1 Air Filter - 6 Pack',
    brand: 'Honeywell',
    sku: 'HWF-2025-1-6PK',
    price: 45.99,
    rating: 4.8,
    reviewCount: 856,
    image: '/images/air-filter-2.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'air',
    description: 'Honeywell 20x25x1 air filter 6-pack. MERV 11 rating for superior air quality.',
    searchKeywords: ['20x25x1', 'air', 'filter', 'honeywell', 'merv', '11', 'hvac', 'furnace'],
    partNumbers: ['HWF-2025-1-6PK', 'FC100A1037'],
    compatibility: ['20x25x1 HVAC Systems'],
    specifications: {
      'Size': '20x25x1',
      'MERV Rating': '11',
      'Pack Quantity': '6',
      'Filter Life': '3 months'
    }
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<SearchableProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const foundProduct = mockProducts.find(p => p.id === productId);
    setProduct(foundProduct || null);
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    try {
      addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        image: product.image,
        quantity
      });
      
      // Show success message (you could add a toast notification here)
      console.log('Added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                Product Image
              </div>
            </div>
            
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-sm font-semibold rounded-full"
                  >
                    {badge.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">
                {product.brand} • SKU: {product.sku}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-brand-orange">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <div className="text-sm text-green-600 font-semibold">
                  Save {formatPrice(product.originalPrice - product.price)}!
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-semibold">
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-20"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className="w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Compatibility */}
            {product.compatibility && product.compatibility.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatibility</h3>
                <div className="flex flex-wrap gap-2">
                  {product.compatibility.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Part Numbers */}
            {product.partNumbers && product.partNumbers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Part Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {product.partNumbers.map((part) => (
                    <span
                      key={part}
                      className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-sm font-mono"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
