/**
 * Subscription Email Templates
 * For Home Filter Club / Subscribe & Save
 */

import { Subscription, SubscriptionItem } from '@/lib/types/subscription'

/**
 * Get base email styles
 */
const getEmailStyles = () => `
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #0066cc 0%, #004c99 100%);
    color: #ffffff;
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: bold;
  }
  .content {
    padding: 30px;
  }
  .highlight-box {
    background-color: #f8f9fa;
    border-left: 4px solid #ff6600;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .item-list {
    margin: 20px 0;
  }
  .item {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  .item:last-child {
    border-bottom: none;
  }
  .item-details {
    flex: 1;
  }
  .item-name {
    font-weight: bold;
    color: #333;
  }
  .item-qty {
    color: #666;
    font-size: 14px;
  }
  .button {
    display: inline-block;
    padding: 12px 30px;
    background-color: #ff6600;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    margin: 10px 0;
  }
  .button:hover {
    background-color: #e55b00;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    color: #666;
    font-size: 14px;
  }
  .savings {
    color: #28a745;
    font-weight: bold;
    font-size: 18px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
`

/**
 * Subscription Created Email
 */
export function generateSubscriptionCreatedEmail(
  customerName: string,
  subscription: Subscription,
  items: SubscriptionItem[]
): { subject: string; html: string } {
  const totalSavings = subscription.discountPercentage
  const nextDelivery = subscription.nextDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.productName}</td>
      <td>Qty: ${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Home Filter Club!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Thank you for subscribing! Your Home Filter Club subscription is now active.</p>
          
          <div class="highlight-box">
            <p class="savings">You're saving ${totalSavings}% on every order!</p>
            <p>Plus FREE shipping on all subscription orders.</p>
          </div>
          
          <h3>Subscription Details</h3>
          <p><strong>Delivery Frequency:</strong> Every ${subscription.frequency} month${subscription.frequency > 1 ? 's' : ''}</p>
          <p><strong>Next Delivery:</strong> ${nextDelivery}</p>
          
          <h3>Your Products</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <h3>What Happens Next?</h3>
          <ul>
            <li>We'll automatically process your order ${subscription.frequency} month${subscription.frequency > 1 ? 's' : ''} from now</li>
            <li>You'll receive an email reminder 3 days before each delivery</li>
            <li>You can modify, pause, or cancel anytime from your account</li>
            <li>Add or remove products from upcoming deliveries</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/subscriptions" class="button">
              Manage Subscription
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: '🎉 Your FiltersFast Subscription is Active!',
    html
  }
}

/**
 * Upcoming Order Reminder Email
 */
export function generateUpcomingOrderEmail(
  customerName: string,
  subscription: Subscription,
  items: SubscriptionItem[],
  daysUntil: number = 3
): { subject: string; html: string } {
  const deliveryDate = subscription.nextDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = totalPrice * (subscription.discountPercentage / 100)
  const finalPrice = totalPrice - discountAmount

  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align: center;">Qty: ${item.quantity}</td>
      <td style="text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Ships Soon!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Your Home Filter Club subscription order will be processed in <strong>${daysUntil} days</strong>.</p>
          
          <div class="highlight-box">
            <p><strong>Scheduled Delivery:</strong> ${deliveryDate}</p>
          </div>
          
          <h3>Order Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="border-top: 2px solid #333;">
                <td colspan="2"><strong>Subtotal:</strong></td>
                <td style="text-align: right;"><strong>$${totalPrice.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colspan="2" class="savings">Subscription Savings (${subscription.discountPercentage}%):</td>
                <td style="text-align: right;" class="savings">-$${discountAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Total:</strong></td>
                <td style="text-align: right;"><strong>$${finalPrice.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <p style="color: #28a745; font-weight: bold; text-align: center;">
            Plus FREE Shipping! 🚚
          </p>
          
          <h3>Need to Make Changes?</h3>
          <p>You can modify this order until ${new Date(subscription.nextDeliveryDate.getTime() - 86400000).toLocaleDateString()}:</p>
          <ul>
            <li>Add or remove products</li>
            <li>Change quantities</li>
            <li>Skip this delivery</li>
            <li>Update your payment method</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/subscriptions/${subscription.id}" class="button">
              Manage This Order
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: `📦 Your FiltersFast subscription order ships in ${daysUntil} days`,
    html
  }
}

/**
 * Order Processed Email
 */
export function generateOrderProcessedEmail(
  customerName: string,
  subscription: Subscription,
  orderId: string,
  trackingNumber?: string
): { subject: string; html: string } {
  const nextDelivery = subscription.nextDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const trackingHtml = trackingNumber ? `
    <div class="highlight-box">
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${orderId}" class="button">
          Track Your Order
        </a>
      </p>
    </div>
  ` : '<p>You\'ll receive tracking information once your order ships.</p>'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Order Processed!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Good news! Your Home Filter Club subscription order has been processed and will ship shortly.</p>
          
          ${trackingHtml}
          
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${orderId}</p>
          <p><strong>Next Scheduled Delivery:</strong> ${nextDelivery}</p>
          
          <div class="highlight-box">
            <p><strong>Remember:</strong> Your subscription is still active and will automatically process again in ${subscription.frequency} month${subscription.frequency > 1 ? 's' : ''}.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}" class="button">
              View Order Details
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: `✅ Your FiltersFast subscription order #${orderId} has been processed`,
    html
  }
}

/**
 * Subscription Paused Email
 */
export function generateSubscriptionPausedEmail(
  customerName: string,
  subscription: Subscription
): { subject: string; html: string } {
  const resumeDate = subscription.pausedUntil?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || 'until you resume it'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏸️ Subscription Paused</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Your Home Filter Club subscription has been paused as requested.</p>
          
          <div class="highlight-box">
            <p><strong>Paused Until:</strong> ${resumeDate}</p>
            <p>No orders will be processed during this time.</p>
          </div>
          
          <p>You can resume your subscription anytime from your account dashboard.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/subscriptions/${subscription.id}" class="button">
              Manage Subscription
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: '⏸️ Your FiltersFast subscription has been paused',
    html
  }
}

/**
 * Subscription Cancelled Email
 */
export function generateSubscriptionCancelledEmail(
  customerName: string,
  subscription: Subscription
): { subject: string; html: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Your Home Filter Club subscription has been cancelled as requested.</p>
          
          <div class="highlight-box">
            <p><strong>Status:</strong> Cancelled</p>
            <p>No future orders will be processed.</p>
          </div>
          
          <p>We're sorry to see you go! Your satisfaction is important to us.</p>
          
          <h3>We'd Love to Have You Back!</h3>
          <p>Remember, with Home Filter Club you get:</p>
          <ul>
            <li>${subscription.discountPercentage}% off every order</li>
            <li>FREE shipping on all deliveries</li>
            <li>Never forget to change your filters</li>
            <li>Modify or pause anytime - no commitment</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auto-delivery" class="button">
              Resubscribe
            </a>
          </div>
          
          <p style="text-align: center; color: #666;">
            We'd appreciate your feedback! Please let us know why you cancelled so we can improve.
          </p>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: 'Your FiltersFast subscription has been cancelled',
    html
  }
}

/**
 * Subscription Resumed Email
 */
export function generateSubscriptionResumedEmail(
  customerName: string,
  subscription: Subscription
): { subject: string; html: string } {
  const nextDelivery = subscription.nextDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>▶️ Subscription Resumed!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Welcome back! Your Home Filter Club subscription has been resumed.</p>
          
          <div class="highlight-box">
            <p><strong>Next Delivery:</strong> ${nextDelivery}</p>
            <p class="savings">You're saving ${subscription.discountPercentage}% on every order!</p>
          </div>
          
          <p>Your subscription is now active and will be processed on the date above.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/subscriptions/${subscription.id}" class="button">
              View Subscription
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@filtersfast.com or call 1-866-438-3458</p>
          <p>&copy; ${new Date().getFullYear()} FiltersFast. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    subject: '▶️ Your FiltersFast subscription has been resumed',
    html
  }
}




