# Payment Integration Setup

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Next.js Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# PayPal Configuration
# Get these from your PayPal Developer Dashboard: https://developer.paypal.com/developer/applications/
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# Next.js Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
```

## Getting Your Payment Keys

### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. For webhooks, go to Webhooks section and create an endpoint pointing to your domain + `/api/webhooks/stripe`

### PayPal Keys
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications/)
2. Create a new application or use existing one
3. Copy your **Client ID** and **Client Secret**
4. Make sure to use **Sandbox** credentials for testing

## Features Implemented

✅ **Shopping Cart System**
- Add/remove items from cart
- Persistent cart storage (localStorage)
- Cart item count in header
- Real-time cart updates

✅ **Dual Payment Integration**
- **Stripe Checkout**: Secure payment processing with redirect to Stripe Checkout
- **PayPal Express Checkout**: One-click PayPal payments
- Support for all major payment methods
- Mobile-optimized checkout flow
- Payment method selection on checkout page

✅ **Product Integration**
- Add to cart buttons on all product cards
- Loading states during add to cart
- Cart persistence across page refreshes

✅ **Checkout Flow**
- Order summary with itemized breakdown
- Free shipping calculation ($99+ threshold)
- Tax calculation (handled by Stripe)
- Success page after payment

## Testing

1. Add items to cart from product pages
2. Click cart icon in header to go to checkout
3. Review order summary
4. Choose payment method:
   - **Stripe**: Click "Pay with Card" and use test card: `4242 4242 4242 4242`
   - **PayPal**: Click "PayPal Express Checkout" and use sandbox account
5. Complete payment and verify success page

## Next Steps

1. Set up your Stripe and PayPal accounts and get API keys
2. Add the environment variables to `.env.local`
3. Test both payment flows (Stripe and PayPal)
4. Set up webhooks for order fulfillment
5. Deploy to production with live credentials
