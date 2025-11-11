# 🚀 Setup Guide - FiltersFast Next.js

Complete setup instructions for development and production.

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ installed
- npm package manager
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/scootsmagoo/filtersfast-next.git
cd filtersfast-next

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Authentication Setup (Better Auth)

### Required Environment Variables

Create a `.env.local` file in the root directory:

```env
# Better Auth Configuration (REQUIRED)
BETTER_AUTH_SECRET=your-super-secret-256-bit-key-change-this
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Optional - defaults to SQLite)
DATABASE_URL=./auth.db

# Multi-Factor Authentication (MFA) - REQUIRED FOR PRODUCTION
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MFA_ENCRYPTION_KEY=your-64-character-hex-key-for-encrypting-mfa-secrets

# Node Environment
NODE_ENV=development
```

### Generate Secure Secret

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Bash/Git Bash:**
```bash
openssl rand -base64 32
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database Setup

The app uses SQLite by default (file: `auth.db`). Tables are created automatically on first run.

**Production:** Use PostgreSQL or MySQL:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/filtersfast
```

---

## 🔓 Social Authentication Setup (Optional)

Enable sign-in with Google, Facebook, and Apple. Each provider is **optional** - only configure the ones you want to enable.

### Quick Setup - Google OAuth (5 minutes)

Google is the easiest and most popular. Start here:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a project** or select existing
3. **Enable Google+ API** (APIs & Services → Library)
4. **Configure OAuth consent screen** (APIs & Services → OAuth consent screen)
   - User Type: External
   - App name: FiltersFast
   - Add your email
5. **Create OAuth credentials** (APIs & Services → Credentials → Create Credentials → OAuth client ID)
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (add production URL later)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. **Copy credentials to `.env.local`:**

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

7. **Restart dev server** and visit `/sign-in` to see the "Sign in with Google" button!

### All OAuth Environment Variables

Add any/all of these to `.env.local`:

```env
# === Social Authentication (Optional) ===

# Google OAuth - https://console.cloud.google.com/
# Callback: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook OAuth - https://developers.facebook.com/
# Callback: http://localhost:3000/api/auth/callback/facebook  
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Apple Sign In - https://developer.apple.com/ (requires $99/year account)
# Callback: http://localhost:3000/api/auth/callback/apple
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```

**Note:** Missing credentials automatically disable that provider. No code changes needed!

### Test Account
For testing sign-in:
- **Email:** `falonya@gmail.com`
- **Password:** `Admin123!`
- **Role:** Admin (access to `/admin`)

---

## 💳 Payment Integration Setup

### Stripe Configuration

Get your keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys):

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook (for order completion)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Webhook Setup:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to .env

### PayPal Configuration

Get your keys from [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications/):

```env
# PayPal Keys (Required for PayPal/Venmo payments)
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Environment: sandbox for testing, production for live
NODE_ENV=development
```

**Getting Your PayPal API Keys:**

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Log in with your PayPal account
3. Create a new app or select existing app
4. Copy the **Client ID** and **Secret** from the app details
5. For testing: Use **Sandbox** credentials
6. For production: Switch to **Live** credentials

**Sandbox Testing:**
- Create test accounts at [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
- Test payments without real money
- Use sandbox client ID and secret

**Features Enabled:**
- PayPal Checkout with full order breakdown
- Venmo payments (automatic)
- Transaction logging in database
- Order creation after successful payment
- Error tracking and monitoring

**Testing PayPal Integration:**

1. Start dev server: `npm run dev`
2. Add items to cart
3. Proceed to checkout
4. Fill in shipping address
5. On payment step, click "Pay with PayPal" button
6. Log in with sandbox test account
7. Complete payment
8. Order is created and customer redirected to success page

**Production Setup:**

1. Switch from sandbox to live credentials
2. Update `NODE_ENV=production` in environment
3. Test with real PayPal account
4. Monitor transactions in `paypal_transactions` database table

### Authorize.Net Configuration (Optional Backup)

```env
# Authorize.Net (AIM / Accept.js)
AUTHORIZENET_API_LOGIN_ID=your_authorizenet_api_login_id
AUTHORIZENET_TRANSACTION_KEY=your_authorizenet_transaction_key
```

Enable the gateway from **Admin → Payment Gateways** once credentials are present. When active, Authorize.Net becomes the first failover after Stripe.

### CyberSource Failover Configuration (Legacy Parity)

```env
# CyberSource HTTP Signature credentials
CYBERSOURCE_MERCHANT_ID=your_merchant_id
CYBERSOURCE_API_KEY_ID=your_rest_api_key_id
CYBERSOURCE_API_SECRET=your_base64_rest_api_secret

# Optional overrides
CYBERSOURCE_ENVIRONMENT=sandbox   # or production
# CYBERSOURCE_HOST=api.cybersource.com  # override host if needed
```

CyberSource is attempted automatically if all higher-priority gateways throw transport or system errors. Provide REST API credentials (HTTP Signature method). Set `CYBERSOURCE_ENVIRONMENT=production` and regenerate the init script (`npm run init:payment-gateways`) when ready for live traffic.

---

## 🔐 Multi-Factor Authentication (MFA) Setup

### Required Configuration

**Critical:** MFA requires an encryption key to secure TOTP secrets. Without this, MFA will break on server restart!

```env
# MFA Encryption Key (REQUIRED for production)
MFA_ENCRYPTION_KEY=your-64-character-hex-key-here
```

### Generate Encryption Key

Run this command to generate a secure key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to your `.env.local` file.

### Features Enabled

Once configured, users can:
- Enable MFA in Account Settings (`/account/mfa`)
- Scan QR code with any authenticator app (Google Authenticator, Authy, 1Password, etc.)
- Generate and save backup codes
- Manage trusted devices
- View security audit logs

### Supported Authenticator Apps

- Google Authenticator (iOS, Android)
- Microsoft Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- 1Password (iOS, Android, Desktop)
- LastPass Authenticator
- Any RFC 6238 TOTP-compatible app

### Admin Dashboard

Admins can monitor MFA adoption at `/admin/mfa`:
- Total users with MFA enabled
- Adoption rate percentage
- Recent setup activity
- Failed login attempts
- Security recommendations

### Security Features

- **TOTP Standard:** RFC 6238 compliant (6-digit codes, 30-second period)
- **Encrypted Secrets:** AES-256-CBC encryption at rest
- **Hashed Backup Codes:** SHA-256, never stored in plaintext
- **Rate Limiting:** Protection against brute force attacks
- **Audit Logging:** Complete activity trail with IP tracking
- **Device Trust:** Optional 30-day device exemption

### Testing MFA

1. Start dev server: `npm run dev`
2. Sign up or sign in
3. Go to Account → Security Settings (`/account/mfa`)
4. Click "Enable Two-Factor Authentication"
5. Scan QR code with authenticator app
6. Enter 6-digit code to verify
7. Save backup codes securely
8. Sign out and test MFA login

---

## ⭐ Trustpilot Reviews Setup (Optional)

To enable product reviews from Trustpilot:

```env
# Trustpilot Configuration
TRUSTPILOT_API_KEY=your_api_key_here
TRUSTPILOT_BUSINESS_UNIT_ID=47783f490000640005020cf6
NEXT_PUBLIC_TRUSTPILOT_ENABLED=true
```

**Getting Your API Key:**
1. Log in to [Trustpilot Business](https://business.trustpilot.com/)
2. Navigate to Settings → Integrations → API Access
3. Generate or copy your API key
4. Restart dev server after adding to `.env.local`

**Features:**
- Star ratings on product cards
- Full review display on product pages
- Company response support
- Review summary with distribution
- Automatic caching (1 hour)
- Rate limiting (30 req/min)
- Graceful fallback if not configured

**Admin Review Management:**
- `npm run sync:reviews` – Pull latest Trustpilot company reviews into the admin dashboard
- Use the “Sync Latest Reviews” button in `/admin/reviews` for on-demand updates
- Replies posted from the admin panel are written back to Trustpilot and reflected in the local store

---

## 📧 Email Service Setup

FiltersFast-Next now ships with a first-class SendGrid integration. Configure these variables to enable real delivery:

```env
# Required for SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@filtersfast.com

# Optional: deliver but keep messages in SendGrid sandbox (great for staging)
SENDGRID_SANDBOX_MODE=true

# Email campaign dispatcher tuning (optional)
EMAIL_CAMPAIGN_BATCH_SIZE=100
EMAIL_CAMPAIGN_MAX_PARALLEL=3
# Override destination when campaign.test_mode = true
EMAIL_CAMPAIGN_TEST_RECIPIENT=marketing-team@example.com
```

Leave `EMAIL_PROVIDER` unset (or set to `console`) to fall back to the mock logger during development.

Once configured you can verify the integration from the admin Utilities → Test Email tool (`/api/admin/utilities/test-email`), which now sends through SendGrid and reports any delivery errors.

### Alternative Providers

If you prefer Mailgun, AWS SES, Postmark, etc., add a provider module in `lib/email/` similar to `sendgrid.ts` and point `EMAIL_PROVIDER` to your implementation.

### Cron / Background Processing

- Run `npm run cron:email-campaigns` on a schedule (e.g. every 5 minutes) to process scheduled or in-flight campaigns on servers where the Next.js app alone isn't long-lived.
- Admin actions (“Send now”, “Schedule”, “Resume”) automatically enqueue in-process background jobs; the cron job serves as a safety net and for worker environments.

---

## 🏗️ Development Workflow

### Commands

```bash
# Start dev server (Turbopack - fast!)
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint

# Type check
npm run type-check
```

### Development Server

- **Local:** http://localhost:3000
- **Network:** http://[your-ip]:3000
- **Hot Reload:** Automatic with Turbopack

---

## 📦 Production Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

3. **Environment Variables in Vercel:**
   - Add all `.env.local` variables to Vercel dashboard
   - Update URLs to production domain
   - Use production keys (not test keys)

### Self-Hosted

```bash
# Build the application
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start npm --name "filtersfast" -- start
```

---

## 🔒 Security Checklist

Before going live:
- [ ] Generate new BETTER_AUTH_SECRET (production)
- [ ] Use production payment processor keys
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Update NEXT_PUBLIC_APP_URL to production domain
- [ ] Set NODE_ENV=production
- [ ] Configure email service
- [ ] Run `npm audit` (ensure 0 vulnerabilities)
- [ ] Test all authentication flows
- [ ] Test payment processing
- [ ] Review security headers in middleware

---

## 🎯 First-Time Setup Checklist

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env.local` file
- [ ] Generate BETTER_AUTH_SECRET
- [ ] Add Stripe keys (optional for testing)
- [ ] Add PayPal keys (optional for testing)
- [ ] Add Trustpilot API key (optional for reviews)
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Create test account
- [ ] Test features: cart, checkout, reorder, saved models

---

## 🤖 AI Chatbot Setup (OpenAI)

### Overview
The AI chatbot uses OpenAI's GPT-3.5-turbo model for natural language understanding and responses. It's optional but highly recommended for better customer support.

### Get Your OpenAI API Key

1. **Visit [OpenAI Platform](https://platform.openai.com/)**
2. **Sign up or log in** to your account
3. **Go to [API Keys](https://platform.openai.com/api-keys)**
4. **Click "Create new secret key"**
5. **Copy the key** (you won't see it again!)

### Add to Environment Variables

```env
# OpenAI API Key (for AI Chatbot)
OPENAI_API_KEY=sk-...your-key-here...
```

### Cost Information

**GPT-3.5-turbo Pricing (as of 2024):**
- Input: ~$0.50 per 1M tokens
- Output: ~$1.50 per 1M tokens

**Real-world costs:**
- Average conversation: ~1,000 tokens = **$0.0005** (less than a penny!)
- 1,000 conversations: ~**$0.50**
- 10,000 conversations: ~**$5.00**

**Extremely affordable** compared to human support costs!

### Testing the Chatbot

1. **Start the dev server**: `npm run dev`
2. **Look for the orange bubble** in the bottom-right corner
3. **Click to open** the chat widget
4. **Try asking:**
   - "Where is my order?"
   - "How do I return an item?"
   - "Tell me about your filters"
   - "What's your return policy?"

### Features

- ✅ **Natural language** - No keyword matching needed
- ✅ **Context aware** - Remembers the conversation
- ✅ **Smart responses** - Uses your support articles
- ✅ **Article references** - Links to relevant docs
- ✅ **Fallback to human** - Easy contact form
- ✅ **Feedback system** - Thumbs up/down to improve

### Without OpenAI Key

The chatbot will still display but will show an error message directing users to contact support directly. It's gracefully degraded!

### Rate Limits

- **20 requests per minute** per IP (to prevent abuse)
- **Configurable** in `app/api/chatbot/route.ts`

### Database

Conversations are automatically saved to SQLite:
- Session tracking
- Message history
- Feedback collection
- Analytics ready

---

## 💱 Multi-Currency Support Setup

### Overview
FiltersFast supports 5 currencies: USD, CAD, AUD, EUR, and GBP with automatic geo-detection and real-time exchange rates.

### Quick Setup (5 minutes)

#### Step 1: Initialize Currency Tables
```bash
npm run init:currency
```

This creates:
- `currency_rates` table with supported currencies
- Adds currency columns to orders table
- Seeds default rates (all 1.0 initially)

#### Step 2: Fetch Real Exchange Rates
```bash
npm run update:currency-rates
```

This fetches current exchange rates from Open Exchange Rates API and updates the database.

#### Step 3: Test It Out
```bash
npm run dev
```

Visit `http://localhost:3000` and you should see the currency selector in the header!

### Environment Variables (Optional)

The default API key has rate limits. For production, get your own:

```env
# Optional: Custom API key for Open Exchange Rates
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
```

**Getting Your API Key:**
1. Sign up at https://openexchangerates.org/
2. Get your App ID from the dashboard
3. Add to `.env.local`

**Free Tier Limits:**
- 1,000 requests/month
- Hourly updates recommended
- Plenty for most deployments

### Verify Installation

Check that rates are loaded:
```bash
# View currency rates in database
sqlite3 filtersfast.db "SELECT * FROM currency_rates;"
```

Expected output:
```
USD|US Dollar|$|1.0|[timestamp]
CAD|Canadian Dollar|CA$|1.35|[timestamp]
AUD|Australian Dollar|A$|1.52|[timestamp]
EUR|Euro|€|0.92|[timestamp]
GBP|British Pound|£|0.79|[timestamp]
```

### Testing Checklist

- [ ] Currency selector visible in header
- [ ] All 5 currencies display correctly
- [ ] Selecting currency updates all prices instantly
- [ ] Currency preference persists on page refresh
- [ ] Cart totals update when currency changes
- [ ] Prices show proper currency symbols (€, £, CA$, A$, $)
- [ ] Mobile currency selector works

### Scheduled Updates (Recommended)

Set up a daily cron job to keep rates current:

**Linux/Mac:**
```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /path/to/FiltersFast-Next && npm run update:currency-rates
```

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `C:\Program Files\nodejs\npm.cmd`
6. Arguments: `run update:currency-rates`
7. Start in: `C:\Users\adam\source\repos\FiltersFast-Next`

### Usage in Components

Replace hardcoded prices with the Price component:

```tsx
// ❌ Wrong - doesn't convert
<span>${product.price}</span>

// ✅ Correct - auto-converts to selected currency
import { Price } from '@/components/products/Price';
<Price amountUSD={product.price} showCurrency />
```

**Available Price Components:**
- `<Price>` - Basic price with conversion
- `<PriceRange>` - Min/max price ranges
- `<StartingAtPrice>` - "Starting at" prefix
- `<Savings>` - Discount amounts
- `<PricePerUnit>` - Unit pricing
- `<HeroPrice>` - Large product page display

### API Endpoints

**Public:**
- `GET /api/currency/rates` - Get all current rates
- `POST /api/currency/convert` - Convert between currencies

**Admin (requires authentication):**
- `POST /api/admin/currency/update-rates` - Manually trigger rate update

### Troubleshooting

**Currency selector not showing:**
- Verify CurrencyProvider is in app layout (already configured)
- Check browser console for errors

**Rates not updating:**
```bash
# Test the update script
npm run update:currency-rates

# Check for API errors in output
```

**Prices not converting:**
- Use `<Price>` component instead of hardcoded values
- Check rates loaded: visit `/api/currency/rates`

**API rate limit exceeded:**
- Check usage at https://openexchangerates.org/dashboard
- Add your own API key to `.env.local`
- Reduce update frequency

### Features

✅ **Automatic geo-detection** via Cloudflare headers  
✅ **Manual selection** with persistent preference  
✅ **Real-time conversion** using live exchange rates  
✅ **5 currencies supported:** USD, CAD, AUD, EUR, GBP  
✅ **Mobile optimized** with compact selector  
✅ **Accessible** with keyboard navigation  
✅ **Admin controls** for manual rate updates  

For complete documentation, see the Multi-Currency Support section in `FEATURES.md`.

---

## 🛠️ Troubleshooting

### "BETTER_AUTH_SECRET is required"
- Create `.env.local` file
- Add BETTER_AUTH_SECRET with generated secret

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### Port 3000 already in use
```bash
# Kill process on port 3000
taskkill /F /IM node.exe
# Or use different port
npm run dev -- -p 3001
```

### Build errors after update
```bash
# Clean cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer](https://developer.paypal.com/)

---

**Ready to build!** 🚀

