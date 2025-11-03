/**
 * Initialize Shipping Tables and Configuration
 * Run: npx tsx scripts/init-shipping.ts
 */

import { initShippingTables, upsertShippingConfig } from '../lib/db/shipping-config';
import type { ShippingCarrier } from '../lib/types/shipping';

async function initShipping() {
  console.log('🚚 Initializing shipping configuration...\n');

  try {
    // Initialize database tables
    console.log('📦 Creating shipping tables...');
    initShippingTables();
    console.log('✓ Shipping tables created\n');

    // Create default shipping configurations for each carrier
    const carriers: ShippingCarrier[] = ['usps', 'ups', 'fedex', 'dhl'];

    // Default origin address (update this for your warehouse)
    const defaultOrigin = {
      name: 'FiltersFast Warehouse',
      company: 'FiltersFast',
      address_line1: '1234 Warehouse Drive',
      city: 'Indianapolis',
      state: 'IN',
      postal_code: '46225',
      country: 'US',
      phone: '1-800-555-0199',
    };

    console.log('🔧 Creating carrier configurations...');

    for (const carrier of carriers) {
      console.log(`  - Setting up ${carrier.toUpperCase()}...`);
      
      upsertShippingConfig({
        carrier,
        is_active: false, // Disabled by default until API credentials are added
        api_credentials: {},
        origin_address: defaultOrigin,
        default_package_dimensions: {
          length: 12,
          width: 10,
          height: 6,
          weight: 2,
        },
        markup_percentage: 0, // No markup by default
        free_shipping_threshold: 50, // Free shipping over $50
      });

      console.log(`  ✓ ${carrier.toUpperCase()} configuration created`);
    }

    console.log('\n✅ Shipping initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Add carrier API credentials to your .env.local file:');
    console.log('     - USPS_USER_ID');
    console.log('     - UPS_CLIENT_ID, UPS_CLIENT_SECRET, UPS_ACCOUNT_NUMBER');
    console.log('     - FEDEX_ACCOUNT_NUMBER, FEDEX_METER_NUMBER, FEDEX_API_KEY, FEDEX_API_SECRET');
    console.log('  2. Visit /admin/shipping to configure carriers');
    console.log('  3. Enable carriers you want to use');
    console.log('  4. Update origin address for your warehouse location');
    console.log('  5. Configure markup and free shipping thresholds\n');

  } catch (error) {
    console.error('❌ Error initializing shipping:', error);
    process.exit(1);
  }
}

// Run initialization
initShipping();

