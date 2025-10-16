# Stripe Integration Setup

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
```

## Getting Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. For webhooks, go to Webhooks section and create an endpoint pointing to your domain + `/api/webhooks/stripe`

## Features Implemented

✅ **Shopping Cart System**
- Add/remove items from cart
- Persistent cart storage (localStorage)
- Cart item count in header
- Real-time cart updates

✅ **Stripe Checkout Integration**
- Secure payment processing
- Redirect to Stripe Checkout
- Support for all major payment methods
- Mobile-optimized checkout flow

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
4. Click "Proceed to Payment" to test Stripe integration
5. Use Stripe test card: `4242 4242 4242 4242`

## Next Steps

1. Set up your Stripe account and get API keys
2. Add the environment variables to `.env.local`
3. Test the payment flow
4. Set up webhooks for order fulfillment
5. Add PayPal integration as backup payment method
