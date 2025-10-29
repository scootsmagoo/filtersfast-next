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
# PayPal Keys
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Use sandbox for testing
PAYPAL_MODE=sandbox
```

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

---

## 📧 Email Service Setup (Optional)

For password reset and email verification to work in production:

### SendGrid (Recommended)

```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@filtersfast.com
```

### Alternative: Mailgun, AWS SES, Postmark

Update the email sending code in:
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/send-verification/route.ts`

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

