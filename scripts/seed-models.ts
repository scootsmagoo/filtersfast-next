/**
 * Seed Sample Appliance Models
 * Populates the database with sample model data for testing
 */

import { mockModels } from '@/lib/db/models';
import { ApplianceModel } from '@/lib/types/model';

const sampleModels: Omit<ApplianceModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Refrigerators
  {
    brand: 'GE',
    modelNumber: 'GSS25GSHSS',
    modelName: 'Side-by-Side Refrigerator',
    applianceType: 'refrigerator',
    searchableText: 'ge gss25gshss side-by-side refrigerator',
    compatibleFilters: [
      {
        productId: 'filter_mwf',
        productName: 'GE MWF SmartWater Filter',
        productSku: 'GE-MWF',
        price: 49.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 6,
      },
    ],
    verified: true,
    popularity: 125,
  },
  {
    brand: 'Samsung',
    modelNumber: 'RF28HMEDBSR',
    modelName: 'French Door Refrigerator',
    applianceType: 'refrigerator',
    searchableText: 'samsung rf28hmedbsr french door refrigerator',
    compatibleFilters: [
      {
        productId: 'filter_da29',
        productName: 'Samsung DA29-00020B Water Filter',
        productSku: 'SAM-DA29',
        price: 44.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 6,
      },
    ],
    verified: true,
    popularity: 98,
  },
  {
    brand: 'Whirlpool',
    modelNumber: 'WRS325SDHZ',
    modelName: 'Side-by-Side Refrigerator',
    applianceType: 'refrigerator',
    searchableText: 'whirlpool wrs325sdhz side-by-side refrigerator',
    compatibleFilters: [
      {
        productId: 'filter_w10295370',
        productName: 'Whirlpool W10295370A Filter 1',
        productSku: 'WP-W10295370',
        price: 46.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 6,
      },
    ],
    verified: true,
    popularity: 87,
  },
  {
    brand: 'LG',
    modelNumber: 'LMXS30776S',
    modelName: 'French Door Refrigerator',
    applianceType: 'refrigerator',
    searchableText: 'lg lmxs30776s french door refrigerator',
    compatibleFilters: [
      {
        productId: 'filter_lt700p',
        productName: 'LG LT700P Water Filter',
        productSku: 'LG-LT700P',
        price: 43.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 6,
      },
    ],
    verified: true,
    popularity: 76,
  },

  // HVAC Systems
  {
    brand: 'Honeywell',
    modelNumber: 'FC100A1029',
    modelName: 'Whole House Air Cleaner',
    applianceType: 'hvac',
    searchableText: 'honeywell fc100a1029 whole house air cleaner hvac',
    compatibleFilters: [
      {
        productId: 'filter_fc100',
        productName: 'Honeywell FC100A1029 16x25 Filter',
        productSku: 'HON-FC100',
        price: 29.99,
        isPrimary: true,
        filterType: 'air',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 145,
  },
  {
    brand: 'Carrier',
    modelNumber: 'GAPCCCAR1625',
    modelName: 'Infinity Air Purifier',
    applianceType: 'hvac',
    searchableText: 'carrier gapcccar1625 infinity air purifier hvac',
    compatibleFilters: [
      {
        productId: 'filter_carrier_1625',
        productName: 'Carrier 16x25x4 MERV 15 Filter',
        productSku: 'CAR-1625',
        price: 34.99,
        isPrimary: true,
        filterType: 'air',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 92,
  },
  {
    brand: 'Trane',
    modelNumber: 'BAYFTAH26M',
    modelName: 'Trane Perfect Fit Filter',
    applianceType: 'hvac',
    searchableText: 'trane bayftah26m perfect fit filter hvac',
    compatibleFilters: [
      {
        productId: 'filter_trane_26',
        productName: 'Trane BAYFTAH26M 21x26x5 Filter',
        productSku: 'TRA-BAY26',
        price: 39.99,
        isPrimary: true,
        filterType: 'air',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 88,
  },

  // Furnaces
  {
    brand: 'Lennox',
    modelNumber: 'EL296V',
    modelName: 'Elite Series Gas Furnace',
    applianceType: 'furnace',
    searchableText: 'lennox el296v elite series gas furnace',
    compatibleFilters: [
      {
        productId: 'filter_lennox_20x25',
        productName: 'Lennox X6673 20x25x5 MERV 11 Filter',
        productSku: 'LEN-X6673',
        price: 36.99,
        isPrimary: true,
        filterType: 'air',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 67,
  },
  {
    brand: 'Goodman',
    modelNumber: 'GMH95',
    modelName: 'High Efficiency Gas Furnace',
    applianceType: 'furnace',
    searchableText: 'goodman gmh95 high efficiency gas furnace',
    compatibleFilters: [
      {
        productId: 'filter_goodman_16x25',
        productName: 'Goodman 16x25x4 MERV 11 Filter',
        productSku: 'GOO-1625',
        price: 28.99,
        isPrimary: true,
        filterType: 'air',
        replacementFrequency: 6,
      },
    ],
    verified: true,
    popularity: 54,
  },

  // Humidifiers
  {
    brand: 'Aprilaire',
    modelNumber: '700',
    modelName: 'Automatic Humidifier',
    applianceType: 'humidifier',
    searchableText: 'aprilaire 700 automatic humidifier',
    compatibleFilters: [
      {
        productId: 'filter_aprilaire_700',
        productName: 'Aprilaire 700 Water Panel #45',
        productSku: 'APR-45',
        price: 24.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 112,
  },
  {
    brand: 'Honeywell',
    modelNumber: 'HE360A',
    modelName: 'TrueEASE Humidifier',
    applianceType: 'humidifier',
    searchableText: 'honeywell he360a trueease humidifier',
    compatibleFilters: [
      {
        productId: 'filter_honeywell_he360',
        productName: 'Honeywell HC26A Water Pad',
        productSku: 'HON-HC26A',
        price: 22.99,
        isPrimary: true,
        filterType: 'water',
        replacementFrequency: 12,
      },
    ],
    verified: true,
    popularity: 95,
  },
];

// Seed function
export function seedModels() {
  console.log('🌱 Seeding appliance models...');
  
  // Clear existing mock data
  mockModels.length = 0;
  
  // Add sample models with proper IDs
  sampleModels.forEach((model, index) => {
    mockModels.push({
      ...model,
      id: `model_${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  console.log(`✅ Successfully seeded ${mockModels.length} appliance models`);
  console.log('\n📦 Sample models include:');
  console.log(`   • ${mockModels.filter(m => m.applianceType === 'refrigerator').length} Refrigerators`);
  console.log(`   • ${mockModels.filter(m => m.applianceType === 'hvac').length} HVAC Systems`);
  console.log(`   • ${mockModels.filter(m => m.applianceType === 'furnace').length} Furnaces`);
  console.log(`   • ${mockModels.filter(m => m.applianceType === 'humidifier').length} Humidifiers`);
  console.log('\n🔍 Try searching for: "GE", "Samsung", "Honeywell", or any model number\n');
}

// Auto-seed when module loads (for development)
if (process.env.NODE_ENV === 'development') {
  seedModels();
}

export { sampleModels };

