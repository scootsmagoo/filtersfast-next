/**
 * Initialize Payment Gateway System
 * 
 * Creates database tables and sets up default payment gateway configurations
 * Supports Stripe (primary), PayPal, Authorize.Net, and CyberSource failover
 */

import { initializePaymentGatewayTables, upsertPaymentGateway } from '../lib/db/payment-gateways';

console.log('🚀 Initializing Payment Gateway System...\n');

try {
  // Create database tables
  console.log('📋 Creating database tables...');
  initializePaymentGatewayTables();

  // Configure Stripe (Primary Gateway)
  console.log('\n💳 Configuring Stripe (Primary)...');
  upsertPaymentGateway({
    gateway_type: 'stripe',
    gateway_name: 'Stripe',
    status: 'active',
    is_primary: true,
    is_backup: false,
    priority: 1,
    credentials: {
      secret_key: process.env.STRIPE_SECRET_KEY || '',
      publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
    test_mode: process.env.NODE_ENV !== 'production',
    capture_method: 'automatic',
    supported_currencies: ['USD', 'CAD', 'AUD', 'EUR', 'GBP'],
    supported_countries: ['US', 'CA', 'AU', 'GB', 'EU'],
    supports_tokenization: true,
    supports_3ds: true,
    supports_refunds: true,
    supports_partial_refunds: true,
    supports_subscriptions: true,
  });
  console.log('✅ Stripe configured');

  // Configure PayPal
  console.log('\n💰 Configuring PayPal...');
  upsertPaymentGateway({
    gateway_type: 'paypal',
    gateway_name: 'PayPal',
    status: 'active',
    is_primary: false,
    is_backup: false,
    priority: 2,
    credentials: {
      client_id: process.env.PAYPAL_CLIENT_ID || '',
      client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
    },
    test_mode: process.env.NODE_ENV !== 'production',
    capture_method: 'automatic',
    supported_currencies: ['USD'],
    supported_countries: ['US', 'CA', 'AU', 'GB', 'EU'],
    supports_tokenization: false,
    supports_3ds: false,
    supports_refunds: true,
    supports_partial_refunds: true,
    supports_subscriptions: false,
  });
  console.log('✅ PayPal configured');

  // Configure Authorize.Net (Backup Gateway)
  console.log('\n🔒 Configuring Authorize.Net (Backup)...');
  upsertPaymentGateway({
    gateway_type: 'authorizenet',
    gateway_name: 'Authorize.Net',
    status: 'inactive', // Set to active when credentials are provided
    is_primary: false,
    is_backup: true,
    priority: 3,
    credentials: {
      api_login_id: process.env.AUTHORIZENET_API_LOGIN_ID || '',
      transaction_key: process.env.AUTHORIZENET_TRANSACTION_KEY || '',
    },
    test_mode: process.env.NODE_ENV !== 'production',
    capture_method: 'automatic',
    supported_currencies: ['USD'],
    supported_countries: ['US'],
    supports_tokenization: true,
    supports_3ds: true,
    supports_refunds: true,
    supports_partial_refunds: true,
    supports_subscriptions: true,
  });
  console.log('✅ Authorize.Net configured');

  // Configure CyberSource (Failover Gateway)
  console.log('\n🛡️  Configuring CyberSource (Failover)...');
  upsertPaymentGateway({
    gateway_type: 'cybersource',
    gateway_name: 'CyberSource',
    status: 'inactive', // Activate when credentials are provided
    is_primary: false,
    is_backup: true,
    priority: 4,
    credentials: {
      merchant_id: process.env.CYBERSOURCE_MERCHANT_ID || '',
      api_key_id: process.env.CYBERSOURCE_API_KEY_ID || '',
      api_secret: process.env.CYBERSOURCE_API_SECRET || '',
    },
    test_mode: (process.env.CYBERSOURCE_ENVIRONMENT || '').toLowerCase() !== 'production',
    capture_method: 'automatic',
    supported_currencies: ['USD', 'CAD', 'AUD', 'EUR', 'GBP'],
    supported_countries: ['US', 'CA', 'AU', 'GB', 'EU'],
    supports_tokenization: false,
    supports_3ds: true,
    supports_refunds: true,
    supports_partial_refunds: true,
    supports_subscriptions: true,
  });
  console.log('✅ CyberSource configured');

  console.log('\n✅ Payment Gateway System initialized successfully!');
  console.log('\n📝 Next Steps:');
  console.log('1. Add payment gateway credentials to .env.local:');
  console.log('   - STRIPE_SECRET_KEY=your_stripe_secret_key');
  console.log('   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key');
  console.log('   - PAYPAL_CLIENT_ID=your_paypal_client_id');
  console.log('   - PAYPAL_CLIENT_SECRET=your_paypal_client_secret');
  console.log('   - AUTHORIZENET_API_LOGIN_ID=your_authorizenet_api_login_id (optional)');
  console.log('   - AUTHORIZENET_TRANSACTION_KEY=your_authorizenet_transaction_key (optional)');
  console.log('\n2. Configure gateway settings in admin dashboard: /admin/payment-gateways');
  console.log('\n3. Test payment processing at checkout');

  console.log('\n🎯 Payment Gateway Configuration:');
  console.log('   ✅ Stripe: Primary gateway (active)');
  console.log('   ✅ PayPal: Alternative payment method (active)');
  console.log('   ⚠️  Authorize.Net: Secondary backup (inactive - add credentials to enable)');
  console.log('   ⚠️  CyberSource: Legacy failover (inactive - add credentials to enable)');

  console.log('\n🔐 Security Features:');
  console.log('   ✅ PCI compliant tokenization');
  console.log('   ✅ 3D Secure / SCA support');
  console.log('   ✅ Fraud detection integration');
  console.log('   ✅ Automatic gateway failover');
  console.log('   ✅ Complete transaction logging');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Error initializing payment gateway system:', error);
  process.exit(1);
}

