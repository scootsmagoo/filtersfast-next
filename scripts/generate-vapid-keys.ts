import webpush from 'web-push';

/**
 * Generate VAPID keys for push notifications
 * Run this script to generate keys: npm run generate:vapid-keys
 * Add the keys to your .env file:
 * VAPID_PUBLIC_KEY=<public key>
 * VAPID_PRIVATE_KEY=<private key>
 * VAPID_EMAIL=mailto:your-email@example.com
 */

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys Generated\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:notifications@filtersfast.com\n`);
console.log('⚠️  Keep VAPID_PRIVATE_KEY secret! Never commit it to version control.\n');









