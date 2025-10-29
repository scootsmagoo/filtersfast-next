/**
 * Email Templates for Abandoned Cart Recovery
 * 3-stage email sequence: 1hr, 24hr, 72hr
 */

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface AbandonedCartEmailData {
  customerName: string;
  email: string;
  cartItems: CartItem[];
  cartValue: number;
  recoveryLink: string;
  optOutLink: string;
}

/**
 * Stage 1: 1 Hour After Abandonment
 * Gentle reminder - "You left something behind"
 */
export function abandonedCart1HourEmail(data: AbandonedCartEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const itemsHtml = data.cartItems.map(item => `
    <tr>
      <td style="padding: 10px;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` : ''}
      </td>
      <td style="padding: 10px;">
        <strong>${item.name}</strong><br>
        <span style="color: #666;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; text-align: right;">
        <strong>$${item.price.toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  return {
    to: data.email,
    subject: '🛒 You left something in your cart!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .cart-items { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .cart-items table { width: 100%; border-collapse: collapse; }
    .cart-items td { padding: 15px 10px; border-bottom: 1px solid #eee; }
    .cart-items tr:last-child td { border-bottom: none; }
    .total { background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .total h2 { margin: 0; color: #054f97; font-size: 32px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .button:hover { box-shadow: 0 6px 8px rgba(242, 103, 34, 0.4); }
    .features { display: flex; justify-content: space-around; margin: 30px 0; text-align: center; }
    .feature { flex: 1; padding: 10px; }
    .feature-icon { font-size: 40px; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .features { flex-direction: column; }
      .cart-items td { padding: 10px 5px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Your Cart is Waiting!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Don't miss out on these great products</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.customerName || 'there'},</p>
      
      <p style="font-size: 16px;">We noticed you left some items in your cart. Good news - they're still available!</p>
      
      <div class="cart-items">
        <h3 style="margin-top: 0; color: #054f97;">Your Cart Items:</h3>
        <table>
          ${itemsHtml}
        </table>
      </div>
      
      <div class="total">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">CART TOTAL</p>
        <h2>$${data.cartValue.toFixed(2)}</h2>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.recoveryLink}" class="button">
          Complete Your Purchase →
        </a>
      </div>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🚚</div>
          <strong>Free Shipping</strong><br>
          <span style="font-size: 13px; color: #666;">On orders $50+</span>
        </div>
        <div class="feature">
          <div class="feature-icon">↩️</div>
          <strong>365-Day Returns</strong><br>
          <span style="font-size: 13px; color: #666;">Risk-free guarantee</span>
        </div>
        <div class="feature">
          <div class="feature-icon">🇺🇸</div>
          <strong>Made in USA</strong><br>
          <span style="font-size: 13px; color: #666;">Premium quality</span>
        </div>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Questions? Our team is here to help!<br>
        <strong>Call 1-866-301-3905</strong> or <a href="mailto:support@filtersfast.com" style="color: #054f97;">email us</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FiltersFast.com</strong> | Premium Air & Water Filters Since 2003</p>
      <p style="margin: 10px 0;">
        <a href="${data.recoveryLink}">Complete Purchase</a> | 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Help Center</a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 15px;">
        <a href="${data.optOutLink}" style="color: #999;">Unsubscribe from cart reminders</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Your Cart is Waiting!

Hi ${data.customerName || 'there'},

We noticed you left some items in your cart. Good news - they're still available!

Your Cart Items:
${data.cartItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Cart Total: $${data.cartValue.toFixed(2)}

Complete your purchase: ${data.recoveryLink}

✓ Free Shipping on orders $50+
✓ 365-Day Returns
✓ Made in USA

Questions? Call 1-866-301-3905 or email support@filtersfast.com

FiltersFast.com | Premium Air & Water Filters Since 2003

Unsubscribe: ${data.optOutLink}
    `
  };
}

/**
 * Stage 2: 24 Hours After Abandonment  
 * Social proof + urgency - "Others are buying these"
 */
export function abandonedCart24HourEmail(data: AbandonedCartEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const itemsHtml = data.cartItems.map(item => `
    <tr>
      <td style="padding: 10px;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` : ''}
      </td>
      <td style="padding: 10px;">
        <strong>${item.name}</strong><br>
        <span style="color: #666;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; text-align: right;">
        <strong>$${item.price.toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  return {
    to: data.email,
    subject: '⏰ Still interested? Your cart is waiting',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #054f97 0%, #0066cc 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .urgency-banner { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .urgency-banner strong { color: #856404; }
    .cart-items { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .cart-items table { width: 100%; border-collapse: collapse; }
    .cart-items td { padding: 15px 10px; border-bottom: 1px solid #eee; }
    .cart-items tr:last-child td { border-bottom: none; }
    .total { background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .total h2 { margin: 0; color: #054f97; font-size: 32px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 103, 34, 0.3); }
    .testimonial { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #37b033; }
    .testimonial .stars { color: #ffc107; font-size: 20px; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .cart-items td { padding: 10px 5px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Your Cart is Still Waiting</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your order before it's too late!</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.customerName || 'there'},</p>
      
      <div class="urgency-banner">
        <strong>⚠️ Stock Alert:</strong> These items are in high demand. Complete your purchase now to avoid disappointment!
      </div>
      
      <p style="font-size: 16px;">Your items are still reserved, but inventory moves fast. Here's what you're missing out on:</p>
      
      <div class="cart-items">
        <h3 style="margin-top: 0; color: #054f97;">Your Reserved Items:</h3>
        <table>
          ${itemsHtml}
        </table>
      </div>
      
      <div class="total">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">YOUR SAVINGS</p>
        <h2>$${data.cartValue.toFixed(2)}</h2>
        <p style="margin: 10px 0 0 0; color: #37b033; font-weight: bold;">+ FREE SHIPPING (orders $50+)</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.recoveryLink}" class="button">
          Secure My Order Now →
        </a>
      </div>
      
      <div class="testimonial">
        <div class="stars">★★★★★</div>
        <p style="margin: 0; font-style: italic;">"FiltersFast has the best prices and fastest shipping. I've been ordering from them for years!"</p>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">- Sarah M., Verified Customer</p>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32;">✓ Why 50,000+ Customers Trust FiltersFast:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Made in USA with premium materials</li>
          <li>365-day money-back guarantee</li>
          <li>Same-day shipping on most orders</li>
          <li>Expert customer support team</li>
          <li>4.8/5 stars from 12,000+ reviews</li>
        </ul>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
        Need help deciding? <strong>Call 1-866-301-3905</strong><br>
        Our filter experts are standing by!
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FiltersFast.com</strong> | Trusted Since 2003</p>
      <p style="margin: 10px 0;">
        <a href="${data.recoveryLink}">Complete Purchase</a> | 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Help Center</a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 15px;">
        <a href="${data.optOutLink}" style="color: #999;">Unsubscribe from cart reminders</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Your Cart is Still Waiting!

Hi ${data.customerName || 'there'},

⚠️ STOCK ALERT: These items are in high demand!

Your Reserved Items:
${data.cartItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Cart Total: $${data.cartValue.toFixed(2)}
+ FREE SHIPPING on orders $50+

Secure your order now: ${data.recoveryLink}

⭐ 4.8/5 Stars from 12,000+ Reviews
✓ 365-Day Money-Back Guarantee
✓ Same-Day Shipping
✓ Made in USA

"FiltersFast has the best prices and fastest shipping!" - Sarah M.

Need help? Call 1-866-301-3905

FiltersFast.com | Trusted Since 2003

Unsubscribe: ${data.optOutLink}
    `
  };
}

/**
 * Stage 3: 72 Hours After Abandonment
 * Final reminder + incentive - "Last chance + special offer"
 */
export function abandonedCart72HourEmail(data: AbandonedCartEmailData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const itemsHtml = data.cartItems.map(item => `
    <tr>
      <td style="padding: 10px;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` : ''}
      </td>
      <td style="padding: 10px;">
        <strong>${item.name}</strong><br>
        <span style="color: #666;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; text-align: right;">
        <strong>$${item.price.toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  return {
    to: data.email,
    subject: '🎁 Last Chance! Your cart + a special surprise',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc3545 0%, #ff4757 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .last-chance { background: linear-gradient(135deg, #f26722 0%, #ff8c42 100%); color: white; padding: 25px; margin: 20px 0; border-radius: 10px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
    .last-chance h2 { margin: 0 0 10px 0; font-size: 28px; }
    .cart-items { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .cart-items table { width: 100%; border-collapse: collapse; }
    .cart-items td { padding: 15px 10px; border-bottom: 1px solid #eee; }
    .cart-items tr:last-child td { border-bottom: none; }
    .total { background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .total h2 { margin: 0; color: #054f97; font-size: 32px; }
    .button { display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #37b033 0%, #4caf50 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(55, 176, 51, 0.4); text-transform: uppercase; }
    .countdown { background-color: #fff3cd; border: 2px dashed #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .countdown .time { font-size: 36px; font-weight: bold; color: #856404; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; border-radius: 0 0 10px 10px; }
    .footer a { color: #054f97; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .cart-items td { padding: 10px 5px; font-size: 14px; }
      .countdown .time { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Final Reminder!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Your cart expires soon</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Hi ${data.customerName || 'there'},</p>
      
      <p style="font-size: 16px;"><strong>This is your final reminder</strong> - your cart will expire soon and we can't guarantee these items will still be in stock.</p>
      
      <div class="last-chance">
        <h2>🎁 WE'RE SAVING THE BEST FOR LAST!</h2>
        <p style="margin: 0; font-size: 18px;">Complete your order now and get:</p>
        <p style="margin: 15px 0 0 0; font-size: 22px; font-weight: bold;">FREE SHIPPING + Our Best Price Guarantee!</p>
      </div>
      
      <div class="countdown">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">⏰ YOUR CART EXPIRES IN:</p>
        <div class="time">24 HOURS</div>
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">After that, we can't guarantee availability</p>
      </div>
      
      <div class="cart-items">
        <h3 style="margin-top: 0; color: #054f97;">Don't Lose These Items:</h3>
        <table>
          ${itemsHtml}
        </table>
      </div>
      
      <div class="total">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">FINAL PRICE</p>
        <h2>$${data.cartValue.toFixed(2)}</h2>
        <p style="margin: 10px 0 0 0; color: #37b033; font-weight: bold;">✓ FREE SHIPPING INCLUDED</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.recoveryLink}" class="button">
          Claim My Order Now! →
        </a>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #37b033;">
        <h3 style="margin: 0 0 15px 0; color: #2e7d32; text-align: center;">🛡️ Our Promise to You:</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 10px; text-align: center;">
              <div style="font-size: 32px;">💰</div>
              <strong>Best Price</strong><br>
              <span style="font-size: 13px; color: #666;">Guaranteed</span>
            </td>
            <td style="padding: 10px; text-align: center;">
              <div style="font-size: 32px;">🚚</div>
              <strong>Fast Ship</strong><br>
              <span style="font-size: 13px; color: #666;">Same-day</span>
            </td>
            <td style="padding: 10px; text-align: center;">
              <div style="font-size: 32px;">↩️</div>
              <strong>Easy Returns</strong><br>
              <span style="font-size: 13px; color: #666;">365 days</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #ddd;">
        <p style="margin: 0; font-size: 16px;"><strong>Still have questions?</strong></p>
        <p style="margin: 10px 0;">Our filter experts are here to help!</p>
        <p style="margin: 10px 0; font-size: 18px;"><strong>📞 1-866-301-3905</strong></p>
        <p style="margin: 10px 0; font-size: 14px; color: #666;">Monday-Friday, 8am-6pm EST</p>
      </div>
      
      <p style="text-align: center; font-size: 14px; color: #999; margin-top: 30px;">
        <em>This is our final reminder about your cart. If you're no longer interested, no worries - we won't bother you again about these items.</em>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FiltersFast.com</strong> | America's #1 Filter Destination</p>
      <p style="margin: 10px 0;">
        <a href="${data.recoveryLink}">Complete Purchase</a> | 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/support">Help Center</a> | 
        <a href="tel:1-866-301-3905">1-866-301-3905</a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 15px;">
        <a href="${data.optOutLink}" style="color: #999;">Unsubscribe from cart reminders</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
🚨 FINAL REMINDER - Your Cart Expires Soon!

Hi ${data.customerName || 'there'},

This is your LAST CHANCE to complete your order before your cart expires.

🎁 SPECIAL OFFER FOR YOU:
Complete your order now and get FREE SHIPPING + Our Best Price Guarantee!

⏰ YOUR CART EXPIRES IN: 24 HOURS

Your Items:
${data.cartItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Final Price: $${data.cartValue.toFixed(2)}
✓ FREE SHIPPING INCLUDED

Claim your order now: ${data.recoveryLink}

🛡️ OUR PROMISE TO YOU:
✓ Best Price Guaranteed
✓ Same-Day Shipping
✓ 365-Day Easy Returns

Still have questions?
Call our filter experts: 1-866-301-3905
Monday-Friday, 8am-6pm EST

FiltersFast.com | America's #1 Filter Destination

This is our final reminder. Won't bother you again about these items.

Unsubscribe: ${data.optOutLink}
    `
  };
}

