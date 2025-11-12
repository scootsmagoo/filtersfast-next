/**
 * Initialize Store / Dealer Locator Tables
 * Run: npx tsx scripts/init-store-locations.ts
 */

import { initStoreLocationTables, countStoreLocations, createStoreLocation } from '../lib/db/store-locations';

async function initStoreLocator() {
  console.log('📍 Initializing store & dealer locator tables...\n');

  try {
    console.log('🗄️  Creating tables (if needed)...');
    initStoreLocationTables();
    console.log('   ✓ store_locations table ready');

    const totalLocations = countStoreLocations();

    if (totalLocations === 0) {
      console.log('\n🌱 No store locations found. Seeding starter records...');

      createStoreLocation({
        name: 'FiltersFast Headquarters',
        locationType: 'retail',
        status: 'active',
        addressLine1: '5905 Stockbridge Drive',
        city: 'Monroe',
        state: 'NC',
        postalCode: '28110',
        country: 'US',
        phone: '1-866-438-3458',
        website: 'https://www.filtersfast.com',
        latitude: 35.0056,
        longitude: -80.5976,
        hours: {
          Monday: '9:00 AM - 5:00 PM',
          Tuesday: '9:00 AM - 5:00 PM',
          Wednesday: '9:00 AM - 5:00 PM',
          Thursday: '9:00 AM - 5:00 PM',
          Friday: '9:00 AM - 4:00 PM',
        },
        services: ['Retail showroom', 'Order pickup', 'Dealer support'],
        notes: 'Primary warehouse and customer pickup location.',
        taxRegionCode: 'NC',
      });

      createStoreLocation({
        name: 'FiltersFast Midwest Dealer',
        locationType: 'dealer',
        status: 'active',
        addressLine1: '4200 Commerce Parkway',
        city: 'Indianapolis',
        state: 'IN',
        postalCode: '46268',
        country: 'US',
        phone: '1-317-555-0188',
        latitude: 39.8762,
        longitude: -86.2204,
        services: ['Dealer showroom', 'Commercial sales'],
        notes: 'Authorized dealer serving the Midwest region.',
        taxRegionCode: 'IN',
      });

      console.log('   ✓ Seed locations created');
    } else {
      console.log(`\nℹ️  ${totalLocations} store location(s) already exist. No seed data added.`);
    }

    console.log('\n✅ Store locator initialization complete!\n');
    console.log('Next steps:');
    console.log('  1. Visit /admin/store-locations to manage locations.');
    console.log('  2. Add Google Maps API key to .env.local (GOOGLE_MAPS_API_KEY=your-key).');
    console.log('  3. Embed store locator on marketing pages as needed.\n');
  } catch (error) {
    console.error('❌ Error initializing store locator:', error);
    process.exit(1);
  }
}

initStoreLocator();


