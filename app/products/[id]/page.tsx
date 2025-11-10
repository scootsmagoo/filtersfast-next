'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, Check, ArrowLeft, Package, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart, type GiftCardCartDetails } from '@/lib/cart-context';
import { SearchableProduct } from '@/lib/types';
import Link from 'next/link';
import SocialShare from '@/components/social/SocialShare';
import { HeroPrice, Savings } from '@/components/products/Price';
import SubscriptionWidget from '@/components/subscriptions/SubscriptionWidget';
import UpsellModal from '@/components/subscriptions/UpsellModal';
import { useSession } from '@/lib/auth-client';
import ProductReviewSectionClient from '@/components/reviews/ProductReviewSectionClient';
import ProductOptions from '@/components/products/ProductOptions';
import type { ProductOptionGroupWithOptions, ProductOptionWithInventory } from '@/lib/types/product';
import BackorderNotify from '@/components/products/BackorderNotify';
import GiftCardPurchaseForm from '@/components/gift-card/GiftCardPurchaseForm';

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
  },
  // Additional Water Filters (203-208)
  {
    id: 203,
    name: 'Reverse Osmosis Membrane',
    brand: 'APEC Water',
    sku: 'APEC-RO-75',
    price: 64.99,
    rating: 4.9,
    reviewCount: 1203,
    image: '/images/water-filter-3.jpg',
    inStock: true,
    badges: [],
    category: 'water',
    description: 'APEC Water reverse osmosis membrane filter for superior water purification.',
    searchKeywords: ['reverse', 'osmosis', 'ro', 'membrane', 'apec', 'water', 'purification'],
    partNumbers: ['APEC-RO-75', 'RO-75'],
    compatibility: ['APEC RO Systems'],
    specifications: {
      'Filter Life': '24 months',
      'Flow Rate': '75 GPD',
      'Contaminants': 'TDS, Heavy Metals, Chemicals'
    }
  },
  {
    id: 204,
    name: 'Countertop Water Filter Replacement',
    brand: 'PUR',
    sku: 'PUR-RF99',
    price: 18.99,
    rating: 4.5,
    reviewCount: 567,
    image: '/images/water-filter-4.jpg',
    inStock: true,
    badges: [],
    category: 'water',
    description: 'PUR countertop water filter replacement cartridge for clean drinking water.',
    searchKeywords: ['countertop', 'water', 'filter', 'pur', 'replacement'],
    partNumbers: ['PUR-RF99', 'RF-99'],
    compatibility: ['PUR Countertop Systems'],
    specifications: {
      'Filter Life': '3 months',
      'Flow Rate': '1 GPM',
      'Contaminants': 'Chlorine, Lead, Mercury'
    }
  },
  {
    id: 205,
    name: 'Inline Water Filter for Ice Maker',
    brand: 'Swift Green',
    sku: 'SGF-IM2',
    price: 34.99,
    rating: 4.6,
    reviewCount: 423,
    image: '/images/water-filter-5.jpg',
    inStock: true,
    badges: [],
    category: 'water',
    description: 'Swift Green inline water filter designed for ice makers and refrigerators.',
    searchKeywords: ['inline', 'ice', 'maker', 'water', 'filter', 'swift', 'green'],
    partNumbers: ['SGF-IM2', 'IM-2'],
    compatibility: ['Ice Makers', 'Refrigerators'],
    specifications: {
      'Filter Life': '12 months',
      'Flow Rate': '0.5 GPM',
      'Contaminants': 'Chlorine, Sediment, Taste'
    }
  },
  {
    id: 206,
    name: 'Shower Head Water Filter',
    brand: 'Aquasana',
    sku: 'AQ-4100',
    price: 42.99,
    rating: 4.7,
    reviewCount: 789,
    image: '/images/water-filter-6.jpg',
    inStock: false,
    badges: [],
    category: 'water',
    description: 'Aquasana shower head water filter for healthier skin and hair.',
    searchKeywords: ['shower', 'head', 'water', 'filter', 'aquasana', 'skin', 'hair'],
    partNumbers: ['AQ-4100', 'AQ4100'],
    compatibility: ['Standard Shower Heads'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '2.5 GPM',
      'Contaminants': 'Chlorine, Heavy Metals'
    }
  },
  {
    id: 207,
    name: 'Sediment Pre-Filter Cartridge',
    brand: 'iSpring',
    sku: 'ISP-FP15',
    price: 12.99,
    rating: 4.4,
    reviewCount: 334,
    image: '/images/water-filter-7.jpg',
    inStock: true,
    badges: [],
    category: 'water',
    description: 'iSpring sediment pre-filter cartridge for whole house systems.',
    searchKeywords: ['sediment', 'pre-filter', 'cartridge', 'ispring', 'whole', 'house'],
    partNumbers: ['ISP-FP15', 'FP-15'],
    compatibility: ['iSpring Systems'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '15 GPM',
      'Contaminants': 'Sediment, Rust, Sand'
    }
  },
  {
    id: 208,
    name: 'Carbon Block Water Filter',
    brand: 'Pentek',
    sku: 'PEN-CB10',
    price: 39.99,
    rating: 4.8,
    reviewCount: 921,
    image: '/images/water-filter-8.jpg',
    inStock: true,
    badges: [],
    category: 'water',
    description: 'Pentek carbon block water filter for superior taste and odor removal.',
    searchKeywords: ['carbon', 'block', 'water', 'filter', 'pentek', 'taste', 'odor'],
    partNumbers: ['PEN-CB10', 'CB-10'],
    compatibility: ['Standard 10" Housings'],
    specifications: {
      'Filter Life': '6 months',
      'Flow Rate': '2.5 GPM',
      'Contaminants': 'Chlorine, VOCs, Taste, Odor'
    }
  },
  // Additional Air Filters (303-308)
  {
    id: 303,
    name: '14x20x1 MERV 8 Filter (6-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-1420-M8-6PK',
    price: 34.99,
    rating: 4.7,
    reviewCount: 1567,
    image: '/images/air-filter-3.jpg',
    inStock: true,
    badges: [],
    category: 'air',
    description: 'High-efficiency 14x20x1 air filter 6-pack. MERV 8 rating.',
    searchKeywords: ['14x20x1', 'air', 'filter', 'merv', '8', 'hvac', '6-pack'],
    partNumbers: ['FF-1420-M8-6PK', '1420-M8-6PK'],
    compatibility: ['14x20x1 HVAC Systems'],
    specifications: {
      'Size': '14x20x1',
      'MERV Rating': '8',
      'Pack Quantity': '6',
      'Filter Life': '3 months'
    }
  },
  {
    id: 304,
    name: '16x25x4 MERV 11 Pleated',
    brand: 'Honeywell',
    sku: 'HON-1625-M11',
    price: 24.99,
    rating: 4.8,
    reviewCount: 892,
    image: '/images/air-filter-4.jpg',
    inStock: true,
    badges: [],
    category: 'air',
    description: 'Honeywell 16x25x4 deep pleated air filter with MERV 11 rating.',
    searchKeywords: ['16x25x4', 'air', 'filter', 'honeywell', 'merv', '11', 'deep', 'pleated'],
    partNumbers: ['HON-1625-M11', 'FC100A1037'],
    compatibility: ['16x25x4 HVAC Systems'],
    specifications: {
      'Size': '16x25x4',
      'MERV Rating': '11',
      'Pack Quantity': '1',
      'Filter Life': '12 months'
    }
  },
  {
    id: 305,
    name: '20x25x1 MERV 13 Allergen Filter',
    brand: 'Filtrete',
    sku: 'FIL-2025-M13',
    price: 16.99,
    rating: 4.9,
    reviewCount: 2789,
    image: '/images/air-filter-5.jpg',
    inStock: true,
    badges: ['bestseller'],
    category: 'air',
    description: 'Filtrete 20x25x1 allergen filter with MERV 13 rating for superior air quality.',
    searchKeywords: ['20x25x1', 'air', 'filter', 'filtrete', 'merv', '13', 'allergen'],
    partNumbers: ['FIL-2025-M13', '2025-M13'],
    compatibility: ['20x25x1 HVAC Systems'],
    specifications: {
      'Size': '20x25x1',
      'MERV Rating': '13',
      'Pack Quantity': '1',
      'Filter Life': '3 months'
    }
  },
  {
    id: 306,
    name: '16x20x1 MERV 11 Pleated (12-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-1620-M11-12PK',
    price: 69.99,
    rating: 4.8,
    reviewCount: 1234,
    image: '/images/air-filter-6.jpg',
    inStock: true,
    badges: [],
    category: 'air',
    description: 'Bulk 12-pack of 16x20x1 MERV 11 pleated air filters for great value.',
    searchKeywords: ['16x20x1', 'air', 'filter', 'merv', '11', '12-pack', 'bulk'],
    partNumbers: ['FF-1620-M11-12PK', '1620-M11-12PK'],
    compatibility: ['16x20x1 HVAC Systems'],
    specifications: {
      'Size': '16x20x1',
      'MERV Rating': '11',
      'Pack Quantity': '12',
      'Filter Life': '3 months'
    }
  },
  {
    id: 307,
    name: '24x24x1 MERV 8 Pleated Filter',
    brand: 'Nordic Pure',
    sku: 'NP-2424-M8',
    price: 14.99,
    rating: 4.6,
    reviewCount: 678,
    image: '/images/air-filter-7.jpg',
    inStock: false,
    badges: [],
    category: 'air',
    description: 'Nordic Pure 24x24x1 MERV 8 pleated air filter.',
    searchKeywords: ['24x24x1', 'air', 'filter', 'nordic', 'pure', 'merv', '8'],
    partNumbers: ['NP-2424-M8', '2424-M8'],
    compatibility: ['24x24x1 HVAC Systems'],
    specifications: {
      'Size': '24x24x1',
      'MERV Rating': '8',
      'Pack Quantity': '1',
      'Filter Life': '3 months'
    }
  },
  {
    id: 308,
    name: '20x20x4 MERV 13 Deep Pleated',
    brand: 'Aprilaire',
    sku: 'APR-2020-M13',
    price: 32.99,
    rating: 4.9,
    reviewCount: 1456,
    image: '/images/air-filter-8.jpg',
    inStock: true,
    badges: [],
    category: 'air',
    description: 'Aprilaire 20x20x4 deep pleated filter with MERV 13 rating.',
    searchKeywords: ['20x20x4', 'air', 'filter', 'aprilaire', 'merv', '13', 'deep', 'pleated'],
    partNumbers: ['APR-2020-M13', '2020-M13'],
    compatibility: ['20x20x4 HVAC Systems'],
    specifications: {
      'Size': '20x20x4',
      'MERV Rating': '13',
      'Pack Quantity': '1',
      'Filter Life': '12 months'
    }
  },
  // Pool & Spa Filters (401-408)
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
  },
  {
    id: 402,
    name: 'Spa Filter - Unicel 6CH-940',
    brand: 'Unicel',
    sku: 'UC-6CH940',
    price: 29.99,
    rating: 4.8,
    reviewCount: 423,
    image: '/images/pool-filter-2.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'Unicel 6CH-940 spa filter cartridge for hot tubs.',
    searchKeywords: ['spa', 'filter', 'unicel', '6ch-940', 'hot', 'tub'],
    partNumbers: ['UC-6CH940', '6CH-940'],
    compatibility: ['Unicel 6CH-940 Systems'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '6" x 8"',
      'Material': 'Polyester'
    }
  },
  {
    id: 403,
    name: 'Pool Filter Sand - 50 lbs',
    brand: 'HTH',
    sku: 'HTH-SAND50',
    price: 24.99,
    rating: 4.6,
    reviewCount: 289,
    image: '/images/pool-filter-3.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'HTH pool filter sand for sand filter systems, 50 lb bag.',
    searchKeywords: ['pool', 'filter', 'sand', 'hth', '50', 'lbs'],
    partNumbers: ['HTH-SAND50', 'SAND-50'],
    compatibility: ['Sand Filter Systems'],
    specifications: {
      'Filter Life': '3-5 years',
      'Weight': '50 lbs',
      'Material': 'Silica Sand'
    }
  },
  {
    id: 404,
    name: 'DE Filter Grid Assembly',
    brand: 'Pentair',
    sku: 'PEN-GRID48',
    price: 89.99,
    rating: 4.9,
    reviewCount: 178,
    image: '/images/pool-filter-4.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'Pentair DE filter grid assembly for diatomaceous earth filters.',
    searchKeywords: ['de', 'filter', 'grid', 'assembly', 'pentair', 'diatomaceous', 'earth'],
    partNumbers: ['PEN-GRID48', 'GRID-48'],
    compatibility: ['Pentair DE Filters'],
    specifications: {
      'Filter Life': '2-3 years',
      'Grid Count': '48',
      'Material': 'Fabric'
    }
  },
  {
    id: 405,
    name: 'Hot Tub Filter - Pleatco PRB50-IN',
    brand: 'Pleatco',
    sku: 'PLT-PRB50',
    price: 34.99,
    rating: 4.8,
    reviewCount: 512,
    image: '/images/pool-filter-5.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'Pleatco PRB50-IN hot tub filter cartridge.',
    searchKeywords: ['hot', 'tub', 'filter', 'pleatco', 'prb50', 'spa'],
    partNumbers: ['PLT-PRB50', 'PRB50-IN'],
    compatibility: ['Pleatco PRB50 Systems'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '5" x 13.5"',
      'Material': 'Polyester'
    }
  },
  {
    id: 406,
    name: 'Intex Pool Filter Cartridge (2-Pack)',
    brand: 'Intex',
    sku: 'INT-29007-2PK',
    price: 19.99,
    rating: 4.5,
    reviewCount: 891,
    image: '/images/pool-filter-6.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'Intex pool filter cartridge 2-pack for above-ground pools.',
    searchKeywords: ['intex', 'pool', 'filter', 'cartridge', '2-pack', 'above-ground'],
    partNumbers: ['INT-29007-2PK', '29007'],
    compatibility: ['Intex Pool Pumps'],
    specifications: {
      'Filter Life': '2 weeks',
      'Pack Quantity': '2',
      'Material': 'Paper'
    }
  },
  {
    id: 407,
    name: 'Pool Skimmer Sock (25-Pack)',
    brand: 'Filters Fast',
    sku: 'FF-SOCK25',
    price: 12.99,
    rating: 4.4,
    reviewCount: 234,
    image: '/images/pool-filter-7.jpg',
    inStock: false,
    badges: [],
    category: 'pool',
    description: 'Pool skimmer sock 25-pack for capturing fine debris.',
    searchKeywords: ['pool', 'skimmer', 'sock', 'filter', 'debris', '25-pack'],
    partNumbers: ['FF-SOCK25', 'SOCK-25'],
    compatibility: ['Universal Pool Skimmers'],
    specifications: {
      'Filter Life': '1 week each',
      'Pack Quantity': '25',
      'Material': 'Nylon Mesh'
    }
  },
  {
    id: 408,
    name: 'Jandy CS Pool Filter Cartridge',
    brand: 'Jandy',
    sku: 'JAN-CS100',
    price: 54.99,
    rating: 4.7,
    reviewCount: 345,
    image: '/images/pool-filter-8.jpg',
    inStock: true,
    badges: [],
    category: 'pool',
    description: 'Jandy CS100 pool filter cartridge replacement.',
    searchKeywords: ['jandy', 'cs', 'pool', 'filter', 'cartridge', 'cs100'],
    partNumbers: ['JAN-CS100', 'CS100'],
    compatibility: ['Jandy CS Series'],
    specifications: {
      'Filter Life': '1 season',
      'Surface Area': '100 sq ft',
      'Material': 'Polyester'
    }
  },
  // Humidifier Filters (501-508)
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
    id: 504,
    name: 'GeneralAire 990-13 Evaporator Pad',
    brand: 'GeneralAire',
    sku: 'GA-99013',
    price: 18.99,
    rating: 4.9,
    reviewCount: 423,
    image: '/images/humidifier-filter-4.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'GeneralAire 990-13 evaporator pad for whole-house humidifiers.',
    searchKeywords: ['generalaire', '990-13', 'evaporator', 'pad', 'humidifier'],
    partNumbers: ['GA-99013', '990-13'],
    compatibility: ['GeneralAire 990'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '10" x 13" x 1.5"',
      'Material': 'Evaporative Pad'
    }
  },
  {
    id: 505,
    name: 'Aprilaire 600 Humidifier Filter (2-Pack)',
    brand: 'Aprilaire',
    sku: 'APR-600-2PK',
    price: 32.99,
    rating: 4.8,
    reviewCount: 678,
    image: '/images/humidifier-filter-5.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Aprilaire 600 humidifier filter 2-pack for extended use.',
    searchKeywords: ['aprilaire', '600', 'humidifier', 'filter', '2-pack'],
    partNumbers: ['APR-600-2PK', '600-2PK'],
    compatibility: ['Aprilaire 600', 'Aprilaire 700'],
    specifications: {
      'Filter Life': '1 year each',
      'Pack Quantity': '2',
      'Material': 'Evaporative Pad'
    }
  },
  {
    id: 506,
    name: 'BestAir CB41 Humidifier Pad',
    brand: 'BestAir',
    sku: 'BA-CB41',
    price: 9.99,
    rating: 4.5,
    reviewCount: 345,
    image: '/images/humidifier-filter-6.jpg',
    inStock: false,
    badges: [],
    category: 'humidifier',
    description: 'BestAir CB41 humidifier pad replacement.',
    searchKeywords: ['bestair', 'cb41', 'humidifier', 'pad', 'replacement'],
    partNumbers: ['BA-CB41', 'CB41'],
    compatibility: ['BestAir Humidifiers'],
    specifications: {
      'Filter Life': '1 season',
      'Type': 'Evaporative Pad',
      'Material': 'Paper'
    }
  },
  {
    id: 507,
    name: 'Carrier HUMCCSBP2317 Water Panel',
    brand: 'Carrier',
    sku: 'CAR-2317',
    price: 19.99,
    rating: 4.7,
    reviewCount: 512,
    image: '/images/humidifier-filter-7.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Carrier HUMCCSBP2317 water panel for humidifier systems.',
    searchKeywords: ['carrier', 'water', 'panel', 'humidifier', '2317'],
    partNumbers: ['CAR-2317', 'HUMCCSBP2317'],
    compatibility: ['Carrier Humidifiers'],
    specifications: {
      'Filter Life': '1 year',
      'Dimensions': '10" x 13"',
      'Material': 'Evaporative Pad'
    }
  },
  {
    id: 508,
    name: 'Lennox X6670 Healthy Climate Filter',
    brand: 'Lennox',
    sku: 'LEN-X6670',
    price: 24.99,
    rating: 4.8,
    reviewCount: 789,
    image: '/images/humidifier-filter-8.jpg',
    inStock: true,
    badges: [],
    category: 'humidifier',
    description: 'Lennox X6670 Healthy Climate humidifier filter.',
    searchKeywords: ['lennox', 'x6670', 'healthy', 'climate', 'humidifier', 'filter'],
    partNumbers: ['LEN-X6670', 'X6670'],
    compatibility: ['Lennox Humidifiers'],
    specifications: {
      'Filter Life': '1 year',
      'Type': 'Evaporative Pad',
      'Material': 'Aluminum Mesh'
    }
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string; // Use string ID directly
  const { data: session } = useSession();
  const [product, setProduct] = useState<SearchableProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState(6);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upcomingOrder, setUpcomingOrder] = useState<any>(null);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroupWithOptions[]>([]);
  const [optionsWithInventory, setOptionsWithInventory] = useState<Record<string, ProductOptionWithInventory[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [optionImageUrl, setOptionImageUrl] = useState<string | null>(null);
  const [primaryOptionDetails, setPrimaryOptionDetails] = useState<{
    id: string | null;
    label: string | null;
    available: boolean;
    blocked?: boolean;
    unavailable?: boolean;
  } | null>(null);
  const { addItem } = useCart();
  const [giftCardDetails, setGiftCardDetails] = useState<GiftCardCartDetails>({
    recipientName: '',
    recipientEmail: '',
    message: '',
    sendAt: null,
    purchaserName: '',
    purchaserEmail: '',
  });
  const isGiftCard = product?.productType === 'gift-card';

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
      loadProductOptions(productId);
    }
  }, [productId]);

  useEffect(() => {
    let matched = false;
    for (const [groupId, optionId] of Object.entries(selectedOptions)) {
      const optionList = optionsWithInventory[groupId];
      if (optionList) {
        const option = optionList.find((opt) => opt.idOption === optionId);
        if (option) {
          setPrimaryOptionDetails({
            id: option.idOption,
            label: option.optionDescrip,
            available: option.available,
            blocked: option.blocked,
            unavailable: option.unavailable,
          });
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      setPrimaryOptionDetails(null);
    }
  }, [selectedOptions, optionsWithInventory]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      // Try to load from database first
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          // Convert database product to SearchableProduct format
          const categoryMap: Record<string, SearchableProduct['category']> = {
            'air-filter': 'air',
            'water-filter': 'water',
            'refrigerator-filter': 'refrigerator',
            'humidifier-filter': 'humidifier',
            'pool-filter': 'pool',
            'gift-card': 'sale',
          };
          
          const numericId = parseInt(id.replace(/\D/g, '')) || 0;
          const searchableProduct: SearchableProduct = {
            id: numericId,
            productId: data.product.id, // Store original database ID
            name: data.product.name,
            brand: data.product.brand,
            sku: data.product.sku,
            price: data.product.price,
            originalPrice: data.product.compareAtPrice || undefined,
            rating: data.product.rating || 0,
            reviewCount: data.product.reviewCount || 0,
            image: data.product.primaryImage || '/images/product-placeholder.jpg',
            inStock: data.product.inventoryQuantity > 0 || !data.product.trackInventory,
            badges: [
              ...(data.product.isBestSeller ? ['bestseller'] : []),
              ...(data.product.isFeatured ? ['featured'] : []),
              ...(data.product.isNew ? ['new'] : []),
            ],
            productType: data.product.type,
            requiresShipping: data.product.requiresShipping,
            category: categoryMap[data.product.type] || 'other',
            description: data.product.description || '',
            searchKeywords: [],
            partNumbers: [data.product.sku],
            compatibility: data.product.compatibleModels || [],
            specifications: data.product.specifications || {},
          };
          
          setProduct(searchableProduct);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to mock products for numeric IDs (legacy support)
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        const foundProduct = mockProducts.find(p => p.id === numericId);
        if (foundProduct) {
          setProduct(foundProduct);
          setLoading(false);
          return;
        }
      }
      
      // Product not found
      setProduct(null);
      setLoading(false);
    } catch (error) {
      console.error('Error loading product:', error);
      setLoading(false);
    }
  };

  const loadProductOptions = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}/options`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOptionGroups(data.optionGroups || []);
          setOptionsWithInventory(data.optionsWithInventory || {});
        }
      }
    } catch (error) {
      console.error('Error loading product options:', error);
    }
  };

  // Check for upcoming subscription orders
  useEffect(() => {
    if (session?.user) {
      checkUpcomingOrders();
    }
  }, [session]);

  useEffect(() => {
    if (!isGiftCard) return;
    setGiftCardDetails((prev) => ({
      ...prev,
      purchaserName: session?.user?.name || prev.purchaserName || '',
      purchaserEmail: session?.user?.email || prev.purchaserEmail || '',
    }));
  }, [session?.user?.name, session?.user?.email, isGiftCard]);

  useEffect(() => {
    if (isGiftCard && subscriptionEnabled) {
      setSubscriptionEnabled(false);
    }
  }, [isGiftCard, subscriptionEnabled]);

  const checkUpcomingOrders = async () => {
    try {
      const response = await fetch('/api/subscriptions/upcoming');
      if (response.ok) {
        const data = await response.json();
        if (data.hasUpcoming) {
          setUpcomingOrder(data.nextOrder);
        }
      }
    } catch (error) {
      console.error('Error checking upcoming orders:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isGiftCard) {
      const requiredGroups = optionGroups.filter((og) => og.optionReq === 'Y');
      const missingRequired = requiredGroups.some((og) => !selectedOptions[og.idOptionGroup]);
      if (missingRequired) {
        alert('Please select all required options');
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedRecipientEmail = isGiftCard ? giftCardDetails.recipientEmail.trim() : '';

    if (isGiftCard && !emailRegex.test(normalizedRecipientEmail)) {
      alert('Please enter a valid recipient email for the gift card.');
      return;
    }
    
    setIsAdding(true);
    try {
      const finalPrice = product.price + priceAdjustment;
      const baseProductId = (product.productId || product.id).toString();
      const cartItemId = isGiftCard
        ? `${baseProductId}-gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        : baseProductId;

      const giftCardMetadata = isGiftCard
        ? {
            recipientName: giftCardDetails.recipientName?.trim() || null,
            recipientEmail: normalizedRecipientEmail,
            message: giftCardDetails.message?.trim() || null,
            sendAt: giftCardDetails.sendAt || null,
            purchaserName: giftCardDetails.purchaserName || session?.user?.name || null,
            purchaserEmail: giftCardDetails.purchaserEmail || session?.user?.email || null,
          }
        : null;

      addItem({
        id: cartItemId,
        productId: baseProductId,
        productType: product.productType,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: finalPrice,
        image: optionImageUrl || product.image,
        ...(quantity > 1 && { quantity }),
        ...(Object.keys(selectedOptions).length > 0 && {
          options: selectedOptions,
        }),
        ...(subscriptionEnabled && !isGiftCard && {
          subscription: {
            enabled: true,
            frequency: subscriptionFrequency,
          },
        }),
        ...(giftCardMetadata && {
          metadata: { giftCard: giftCardMetadata },
          giftCardDetails: {
            recipientName: giftCardDetails.recipientName?.trim() || '',
            recipientEmail: normalizedRecipientEmail,
            message: giftCardDetails.message?.trim() || '',
            sendAt: giftCardDetails.sendAt || null,
            purchaserName: giftCardMetadata.purchaserName || undefined,
            purchaserEmail: giftCardMetadata.purchaserEmail || undefined,
          },
        }),
      });

      if (isGiftCard) {
        console.log('Gift card added to cart successfully');
      } else if (subscriptionEnabled) {
        console.log(`Added to cart with ${subscriptionFrequency}-month subscription`);
      } else {
        console.log('Added to cart successfully');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubscriptionChange = (enabled: boolean, frequency: number) => {
    setSubscriptionEnabled(enabled);
    setSubscriptionFrequency(frequency);
  };

  // Check if product is FiltersFast branded (private label)
  const isPrivateLabel = product?.brand?.toLowerCase().includes('filtersfast') ||
                        product?.brand?.toLowerCase().includes('filters fast');

  const handleAddToUpcomingOrder = async (asSubscription: boolean, frequency: number) => {
    if (!product || !upcomingOrder) return;

    try {
          // Add item to upcoming subscription order
          const response = await fetch(`/api/subscriptions/${upcomingOrder.subscriptionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: (product.productId || product.id).toString(),
              productName: product.name,
              productImage: product.image,
              quantity: quantity,
              price: product.price,
              createSubscription: asSubscription,
              frequency: asSubscription ? frequency : undefined
            })
          });

      if (!response.ok) {
        throw new Error('Failed to add item to subscription');
      }

      // Refresh upcoming orders
      await checkUpcomingOrders();
    } catch (error) {
      console.error('Error adding item to upcoming order:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">The product you're looking for doesn't exist or is not available.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryOptionOutOfStock = Boolean(primaryOptionDetails && !primaryOptionDetails.available);
  const backorderProductId = (product.productId || product.id)?.toString();
  const showBackorderCta = Boolean(
    backorderProductId && (!product.inStock || primaryOptionOutOfStock)
  );
  const backorderReason: 'product' | 'option' = primaryOptionOutOfStock ? 'option' : 'product';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-6">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => {
              // Try to go back in history, or fallback to category page
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else if (product) {
                // Fallback to category page based on product category
                const categoryMap: Record<string, string> = {
                  'refrigerator': '/refrigerator-filters',
                  'air': '/air-filters',
                  'water': '/water-filters',
                  'pool': '/pool-filters',
                  'humidifier': '/humidifier-filters'
                };
                router.push(categoryMap[product.category] || '/');
              } else {
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors">
              <img
                src={optionImageUrl || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                Product Image
              </div>
            </div>
            
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400 text-sm font-semibold rounded-full transition-colors"
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
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors">
                {product.brand} • SKU: {product.sku}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
                {product.name}
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
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
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <a 
                href="#reviews" 
                className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition-colors cursor-pointer"
              >
                {product.rating} ({product.reviewCount} reviews)
              </a>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <HeroPrice 
                amountUSD={product.price + priceAdjustment}
                originalPrice={product.originalPrice ? product.originalPrice + priceAdjustment : undefined}
              />
              {product.originalPrice && (
                <div className="text-sm font-semibold">
                  <Savings amountUSD={product.originalPrice - product.price} />
                </div>
              )}
              {priceAdjustment !== 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Base price: ${product.price.toFixed(2)}
                  {priceAdjustment > 0 ? ` + $${priceAdjustment.toFixed(2)} (options)` : ''}
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold">In Stock</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                </>
              )}
            </div>
            {primaryOptionOutOfStock && primaryOptionDetails?.label && (
              <p className="text-sm text-red-600 dark:text-red-400 transition-colors">
                Selected option “{primaryOptionDetails.label}” is currently unavailable.
              </p>
            )}

            {/* Product Options */}
            {optionGroups.length > 0 && (
              <div className="space-y-4">
                <ProductOptions
                  optionGroups={optionGroups}
                  optionsWithInventory={optionsWithInventory}
                  basePrice={product.price}
                  onOptionChange={setSelectedOptions}
                  onPriceChange={(adjustment, total) => setPriceAdjustment(adjustment)}
                  onImageChange={setOptionImageUrl}
                />
              </div>
            )}

            {isGiftCard && (
              <div className="my-6 space-y-3">
                <GiftCardPurchaseForm
                  details={giftCardDetails}
                  onChange={setGiftCardDetails}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  Digital gift cards are delivered by email and never expire. You can schedule delivery or send it instantly.
                </p>
              </div>
            )}

            {/* Subscription Widget or Upsell Button */}
            {!isGiftCard && (
              upcomingOrder ? (
                /* Show upsell button for existing subscription customers */
                <div className="my-6">
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 transition-colors">
                          Add to Your Auto Delivery Order
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                          Next delivery: {upcomingOrder.nextDeliveryDateFormatted}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowUpsellModal(true)}
                        className="flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Add to Order
                      </Button>
                    </div>
                  </Card>
                </div>
              ) : (
                /* Show regular subscription widget for non-subscribers */
                <div className="my-6">
                  <SubscriptionWidget
                    productId={(product.productId || product.id).toString()}
                    productName={product.name}
                    productPrice={product.price}
                    isPrivateLabel={isPrivateLabel}
                    defaultFrequency={6}
                    onSubscriptionChange={handleSubscriptionChange}
                    style="pdp"
                  />
                </div>
              )
            )}

            {/* Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                {isAdding 
                  ? 'Adding...' 
                  : subscriptionEnabled 
                    ? 'Add & Subscribe' 
                    : 'Add to Cart'}
              </Button>
            </div>

            {showBackorderCta && backorderProductId && (
              <BackorderNotify
                productId={backorderProductId}
                productName={product.name}
                productSku={product.sku}
                optionId={primaryOptionDetails?.id ?? null}
                optionLabel={primaryOptionDetails?.label ?? null}
                prefillEmail={session?.user?.email ?? null}
                reason={backorderReason}
              />
            )}

            {/* Social Sharing */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors">Share this product:</h3>
              <SocialShare
                data={{
                  url: typeof window !== 'undefined' ? window.location.href : '',
                  title: product.name,
                  description: product.description,
                  hashtags: ['FiltersFast', product.brand, product.category]
                }}
                shareType="product"
                productId={(product.productId || product.id).toString()}
                variant="icons"
              />
            </Card>

            {/* Specifications */}
            {product.specifications && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">{key}:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Compatibility */}
            {product.compatibility && product.compatibility.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Compatibility</h3>
                <div className="flex flex-wrap gap-2">
                  {product.compatibility.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Part Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {product.partNumbers.map((part) => (
                    <span
                      key={part}
                      className="px-3 py-1 bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange dark:text-orange-400 rounded-full text-sm font-mono transition-colors"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-16">
          <ProductReviewSectionClient
            productSku={product.sku}
            productName={product.name}
          />
        </div>

        {/* Upsell Modal */}
        {upcomingOrder && (
          <UpsellModal
            isOpen={showUpsellModal}
            onClose={() => setShowUpsellModal(false)}
            productId={(product.productId || product.id).toString()}
            productName={product.name}
            nextOrderDate={upcomingOrder.nextDeliveryDateFormatted}
            onAddToOrder={handleAddToUpcomingOrder}
          />
        )}
      </div>
    </div>
  );
}
