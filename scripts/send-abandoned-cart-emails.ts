/**
 * Abandoned Cart Recovery Email Scheduler
 * 
 * Sends recovery emails at 3 stages:
 * - 1 hour after abandonment
 * - 24 hours after abandonment
 * - 72 hours after abandonment
 * 
 * Run this script on a schedule (hourly recommended):
 * npx tsx scripts/send-abandoned-cart-emails.ts
 * 
 * Or add to package.json:
 * "cron:abandoned-carts": "tsx scripts/send-abandoned-cart-emails.ts"
 */

import { getCartsReadyForEmail, recordEmailSent, deleteOldAbandonedCarts } from '../lib/db/abandoned-carts';
import { abandonedCart1HourEmail, abandonedCart24HourEmail, abandonedCart72HourEmail } from '../lib/email-templates/abandoned-cart';
import { sendEmail } from '../lib/email';

async function sendAbandonedCartEmails() {
  console.log('\n🚀 Starting Abandoned Cart Email Job...\n');
  console.log(`⏰ ${new Date().toISOString()}\n`);

  let totalSent = 0;
  let totalErrors = 0;

  try {
    // Stage 1: 1-hour reminders
    console.log('📧 Stage 1: Sending 1-hour reminders...');
    const carts1hr = getCartsReadyForEmail('reminder_1hr');
    console.log(`Found ${carts1hr.length} carts ready for 1hr reminder`);

    for (const cart of carts1hr) {
      try {
        const cartItems = JSON.parse(cart.cart_data);
        const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/recover/${cart.recovery_token}`;
        const optOutLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/opt-out/${cart.recovery_token}`;

        const emailData = abandonedCart1HourEmail({
          customerName: cart.user_id ? 'Valued Customer' : 'there',
          email: cart.email,
          cartItems,
          cartValue: cart.cart_value,
          recoveryLink,
          optOutLink,
        });

        const result = await sendEmail(emailData);
        if (result.success) {
          recordEmailSent(cart.id, 'reminder_1hr');
          totalSent++;
          console.log(`✅ Sent 1hr reminder to ${cart.email}`);
        } else {
          totalErrors++;
          console.error(`❌ Failed to send 1hr reminder to ${cart.email}`, result.error || '');
        }
      } catch (error: any) {
        totalErrors++;
        console.error(`❌ Error processing cart ${cart.id}:`, error.message);
      }
    }

    // Stage 2: 24-hour reminders
    console.log('\n📧 Stage 2: Sending 24-hour reminders...');
    const carts24hr = getCartsReadyForEmail('reminder_24hr');
    console.log(`Found ${carts24hr.length} carts ready for 24hr reminder`);

    for (const cart of carts24hr) {
      try {
        const cartItems = JSON.parse(cart.cart_data);
        const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/recover/${cart.recovery_token}`;
        const optOutLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/opt-out/${cart.recovery_token}`;

        const emailData = abandonedCart24HourEmail({
          customerName: cart.user_id ? 'Valued Customer' : 'there',
          email: cart.email,
          cartItems,
          cartValue: cart.cart_value,
          recoveryLink,
          optOutLink,
        });

        const result = await sendEmail(emailData);
        if (result.success) {
          recordEmailSent(cart.id, 'reminder_24hr');
          totalSent++;
          console.log(`✅ Sent 24hr reminder to ${cart.email}`);
        } else {
          totalErrors++;
          console.error(`❌ Failed to send 24hr reminder to ${cart.email}`, result.error || '');
        }
      } catch (error: any) {
        totalErrors++;
        console.error(`❌ Error processing cart ${cart.id}:`, error.message);
      }
    }

    // Stage 3: 72-hour reminders (final)
    console.log('\n📧 Stage 3: Sending 72-hour (final) reminders...');
    const carts72hr = getCartsReadyForEmail('reminder_72hr');
    console.log(`Found ${carts72hr.length} carts ready for 72hr reminder`);

    for (const cart of carts72hr) {
      try {
        const cartItems = JSON.parse(cart.cart_data);
        const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/recover/${cart.recovery_token}`;
        const optOutLink = `${process.env.NEXT_PUBLIC_BASE_URL}/cart/opt-out/${cart.recovery_token}`;

        const emailData = abandonedCart72HourEmail({
          customerName: cart.user_id ? 'Valued Customer' : 'there',
          email: cart.email,
          cartItems,
          cartValue: cart.cart_value,
          recoveryLink,
          optOutLink,
        });

        const result = await sendEmail(emailData);
        if (result.success) {
          recordEmailSent(cart.id, 'reminder_72hr');
          totalSent++;
          console.log(`✅ Sent 72hr reminder to ${cart.email}`);
        } else {
          totalErrors++;
          console.error(`❌ Failed to send 72hr reminder to ${cart.email}`, result.error || '');
        }
      } catch (error: any) {
        totalErrors++;
        console.error(`❌ Error processing cart ${cart.id}:`, error.message);
      }
    }

    // Cleanup: Delete old abandoned carts (>90 days)
    console.log('\n🧹 Cleaning up old abandoned carts...');
    const deleted = deleteOldAbandonedCarts();
    console.log(`Deleted ${deleted} carts older than 90 days`);

  } catch (error: any) {
    console.error('\n❌ Fatal error in abandoned cart job:', error);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Emails sent: ${totalSent}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`✨ Job completed successfully at ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');
}

// Run the job
sendAbandonedCartEmails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

