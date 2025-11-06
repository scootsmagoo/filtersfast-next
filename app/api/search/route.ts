import { NextRequest, NextResponse } from 'next/server';
import { SearchableProduct, SearchResult, SearchResponse, SearchFilters } from '@/lib/types';
import { 
  normalizeQuery, 
  calculateScore, 
  getMatchType, 
  getMatchedFields, 
  applyFilters,
  generateSuggestions 
} from '@/lib/search-utils';

// Mock enhanced product data (in production, this would come from a database)
const searchableProducts: SearchableProduct[] = [
  // Refrigerator Filters
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
  // Water Filters
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
  // Air Filters
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
  },
  {
    id: 501,
    name: 'Aprilaire 35 Humidifier Filter',
    brand: 'Aprilaire',
    sku: 'APR-35',
    price: 16.99,
    rating: 4.8,
    reviewCount: 1234,
    image: '/images/humidifier-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'humidifier',
    description: 'Aprilaire 35 replacement humidifier filter pad.',
    searchKeywords: ['aprilaire', '35', 'humidifier', 'filter', 'pad', 'replacement'],
    partNumbers: ['APR-35', '35'],
    compatibility: ['Aprilaire 350', 'Aprilaire 360'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '10" x 13" x 1.75"',
      'Material': 'Evaporative Pad'
    }
  },
  {
    id: 502,
    name: 'Honeywell HC-14 Replacement Filter',
    brand: 'Honeywell',
    sku: 'HON-HC14',
    price: 14.99,
    rating: 4.7,
    reviewCount: 892,
    image: '/images/humidifier-filter-2.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Honeywell HC-14 replacement humidifier filter.',
    searchKeywords: ['honeywell', 'hc-14', 'hc14', 'humidifier', 'filter', 'replacement'],
    partNumbers: ['HON-HC14', 'HC-14', 'HC14'],
    compatibility: ['Honeywell HCM Series'],
    specifications: {
      'Filter Life': '1-3 months',
      'Type': 'Wicking Filter',
      'Material': 'Paper'
    }
  },
  {
    id: 503,
    name: 'Essick Air HDC-12 Humidifier Wick',
    brand: 'Essick Air',
    sku: 'ESS-HDC12',
    price: 11.99,
    rating: 4.6,
    reviewCount: 567,
    image: '/images/humidifier-filter-3.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Essick Air HDC-12 humidifier wick filter.',
    searchKeywords: ['essick', 'air', 'hdc-12', 'hdc12', 'humidifier', 'wick', 'filter'],
    partNumbers: ['ESS-HDC12', 'HDC-12', 'HDC12'],
    compatibility: ['Essick Air Humidifiers'],
    specifications: {
      'Filter Life': '1-2 months',
      'Type': 'Wicking Filter',
      'Material': 'Paper'
    }
  },
  {
    id: 401,
    name: 'Pool Filter Cartridge - Hayward C-225',
    brand: 'Filters Fast',
    sku: 'FF-HC225',
    price: 39.99,
    rating: 4.7,
    reviewCount: 567,
    image: '/images/pool-filter-1.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'pool',
    description: 'Replacement cartridge for Hayward C-225 pool filters.',
    searchKeywords: ['pool', 'filter', 'cartridge', 'hayward', 'c-225', 'replacement'],
    partNumbers: ['FF-HC225', 'C-225'],
    compatibility: ['Hayward C-225'],
    specifications: {
      'Filter Life': '1 season',
      'Dimensions': '4.5" x 8.25"',
      'Material': 'Polyester'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    // If no query, return empty results
    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        page,
        limit,
        query,
        suggestions: [],
        filters: {
          categories: {},
          brands: {},
          priceRange: { min: 0, max: 0 }
        }
      });
    }

    const normalizedQuery = normalizeQuery(query);

    // Perform search
    const searchResults: SearchResult[] = [];
    
    for (const product of searchableProducts) {
      const matchedFields = getMatchedFields(product, query);
      
      if (matchedFields.length > 0) {
        const score = calculateScore(product, query, matchedFields);
        const matchType = getMatchType(product, query, matchedFields);
        
        searchResults.push({
          product,
          score,
          matchType,
          matchedFields
        });
      }
    }

    // Sort by score (highest first)
    searchResults.sort((a, b) => b.score - a.score);

    // Apply filters
    const filters: SearchFilters = {
      category: category || undefined,
      brand: brand || undefined,
      minPrice,
      maxPrice,
      inStock: inStock || undefined,
      minRating
    };

    const filteredResults = applyFilters(searchResults, filters);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    // Generate suggestions
    const suggestions = generateSuggestions(searchableProducts, query, 5);

    // Generate filter options
    const filterOptions = {
      categories: searchableProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      brands: searchableProducts.reduce((acc, product) => {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priceRange: {
        min: Math.min(...searchableProducts.map(p => p.price)),
        max: Math.max(...searchableProducts.map(p => p.price))
      }
    };

    const response: SearchResponse = {
      results: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      query,
      suggestions,
      filters: filterOptions
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
