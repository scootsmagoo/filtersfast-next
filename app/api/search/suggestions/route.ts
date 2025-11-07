import { NextRequest, NextResponse } from 'next/server';
import { generateSuggestions } from '@/lib/search-utils';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';

// Import the same product data (in production, this would be shared)
const searchableProducts = [
  // Refrigerator Filters
  {
    id: 1,
    name: 'GE MWF Refrigerator Water Filter',
    brand: 'GE',
    sku: 'MWF',
    price: 39.99,
    rating: 4.5,
    reviewCount: 128,
    image: '/images/products/ge-mwf.jpg',
    inStock: true,
    category: 'refrigerator' as const,
    description: 'Genuine GE MWF refrigerator water filter replacement.',
    searchKeywords: ['ge', 'mwf', 'refrigerator', 'water', 'filter', 'genuine', 'replacement'],
    partNumbers: ['MWF', 'GEMWF', 'GE-MWF'],
    compatibility: ['GE Refrigerators', 'Hotpoint', 'Profile']
  },
  {
    id: 2,
    name: 'Whirlpool EDR1RXD1 Water Filter',
    brand: 'Whirlpool',
    sku: 'EDR1RXD1',
    price: 44.99,
    rating: 4.7,
    reviewCount: 215,
    image: '/images/products/whirlpool-edr1rxd1.jpg',
    inStock: true,
    category: 'refrigerator' as const,
    description: 'OEM Whirlpool EDR1RXD1 water filter.',
    searchKeywords: ['whirlpool', 'edr1rxd1', 'refrigerator', 'water', 'filter', 'kitchenaid', 'maytag'],
    partNumbers: ['EDR1RXD1', '4396508', '4396710'],
    compatibility: ['Whirlpool', 'KitchenAid', 'Maytag']
  },
  {
    id: 3,
    name: 'LG LT700P Refrigerator Water Filter',
    brand: 'LG',
    sku: 'LT700P',
    price: 42.99,
    rating: 4.6,
    reviewCount: 187,
    image: '/images/products/lg-lt700p.jpg',
    inStock: true,
    category: 'refrigerator' as const,
    description: 'LG LT700P genuine water filter.',
    searchKeywords: ['lg', 'lt700p', 'refrigerator', 'water', 'filter', 'nsf', 'certified'],
    partNumbers: ['LT700P', 'ADQ73613401'],
    compatibility: ['LG Refrigerators']
  },
  // Water Filters
  {
    id: 201,
    name: 'Under Sink Water Filter Replacement',
    brand: 'Filters Fast',
    sku: 'FFUL-001',
    price: 24.99,
    rating: 4.3,
    reviewCount: 89,
    image: '/images/products/under-sink-filter.jpg',
    inStock: true,
    category: 'water' as const,
    description: 'Universal under sink water filter replacement cartridge.',
    searchKeywords: ['under', 'sink', 'water', 'filter', 'replacement', 'universal', 'cartridge'],
    partNumbers: ['FFUL-001', 'FF-UL-001'],
    compatibility: ['Universal']
  },
  {
    id: 202,
    name: 'Whole House Water Filter Cartridge',
    brand: '3M Aqua-Pure',
    sku: '3MAP-217',
    price: 54.99,
    rating: 4.8,
    reviewCount: 342,
    image: '/images/products/3m-aqua-pure.jpg',
    inStock: true,
    category: 'water' as const,
    description: '3M Aqua-Pure whole house water filter cartridge.',
    searchKeywords: ['whole', 'house', 'water', 'filter', '3m', 'aqua', 'pure', 'sediment', 'chlorine'],
    partNumbers: ['3MAP-217', 'AP217'],
    compatibility: ['3M Aqua-Pure Systems']
  },
  // Air Filters
  {
    id: 301,
    name: '16x20x1 Air Filter - 3 Pack',
    brand: 'FiltersFast',
    sku: 'FF-AF-1620-1-3PK',
    price: 19.99,
    rating: 4.4,
    reviewCount: 156,
    image: '/images/products/air-filter-16x20x1.jpg',
    inStock: true,
    category: 'air' as const,
    description: 'High-efficiency 16x20x1 air filter 3-pack.',
    searchKeywords: ['16x20x1', 'air', 'filter', 'merv', '8', 'hvac', 'furnace', 'ac'],
    partNumbers: ['FF-AF-1620-1-3PK', '1620-1-3PK'],
    compatibility: ['16x20x1 HVAC Systems']
  },
  {
    id: 302,
    name: '20x25x1 Air Filter - 6 Pack',
    brand: 'Honeywell',
    sku: 'HWF-2025-1-6PK',
    price: 49.99,
    rating: 4.7,
    reviewCount: 298,
    image: '/images/products/honeywell-20x25x1.jpg',
    inStock: true,
    category: 'air' as const,
    description: 'Honeywell 20x25x1 air filter 6-pack.',
    searchKeywords: ['20x25x1', 'air', 'filter', 'honeywell', 'merv', '11', 'hvac', 'furnace'],
    partNumbers: ['HWF-2025-1-6PK', 'FC100A1037'],
    compatibility: ['20x25x1 HVAC Systems']
  }
];

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(clientId, rateLimitPresets.generous);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    // Sanitize input: strip HTML and limit length
    const query = rawQuery.replace(/<[^>]*>/g, '').trim().slice(0, 200);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(10, Math.floor(Number(limitParam) || 5))) : 5;

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = generateSuggestions(searchableProducts, query, limit);
    // Sanitize suggestions output
    const sanitizedSuggestions = suggestions.map(s => s.replace(/<[^>]*>/g, '').trim()).slice(0, limit);

    return NextResponse.json({ suggestions: sanitizedSuggestions }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
      }
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
