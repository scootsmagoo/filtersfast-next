# 🚀 Phase 1 Implementation Plan

**Start Date:** October 27, 2025  
**Target Completion:** Q1 2026  
**Features:** Subscriptions, Promo Codes, Reminders, B2B

---

## 📋 Overview

Phase 1 focuses on the highest-impact revenue-generating features:

1. **Promo Codes & Discounts** - Enable marketing campaigns
2. **Subscription System** - Recurring revenue stream
3. **Filter Replacement Reminders** - Drive repeat purchases
4. **B2B Portal** - Wholesale revenue

**Estimated Impact:** +15-25% revenue increase

---

## 🎯 Feature 1: Promo Code System

### Priority: ⭐⭐⭐⭐⭐ (Start First)
**Timeline:** Week 1-2  
**Complexity:** Medium

### Database Schema

```typescript
// lib/types/promo.ts
export interface PromoCode {
  id: string
  code: string // Unique promo code (e.g., "SAVE20")
  description: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number // Percentage (0-100) or fixed amount
  minOrderAmount?: number // Minimum order to qualify
  maxDiscount?: number // Max discount cap for percentage
  startDate: Date
  endDate: Date
  usageLimit?: number // Total uses allowed
  usageCount: number // Current usage count
  perCustomerLimit?: number // Uses per customer
  applicableProducts?: string[] // Specific product IDs (null = all)
  applicableCategories?: string[] // Specific categories (null = all)
  firstTimeOnly: boolean // Only for first-time customers
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PromoCodeUsage {
  id: string
  promoCodeId: string
  customerId: string
  orderId: string
  discountAmount: number
  usedAt: Date
}
```

### Database Migration (SQLite)

```sql
-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value REAL NOT NULL,
  min_order_amount REAL,
  max_discount REAL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  applicable_products TEXT, -- JSON array
  applicable_categories TEXT, -- JSON array
  first_time_only INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_promo_code ON promo_codes(code);
CREATE INDEX idx_promo_active ON promo_codes(active, start_date, end_date);

-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id TEXT PRIMARY KEY,
  promo_code_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  discount_amount REAL NOT NULL,
  used_at INTEGER NOT NULL,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_usage_customer ON promo_code_usage(customer_id, promo_code_id);
CREATE INDEX idx_usage_order ON promo_code_usage(order_id);
```

### API Routes

#### 1. Validate Promo Code
**POST /api/checkout/validate-promo**

```typescript
// Request
{
  code: string
  cartTotal: number
  customerId?: string
  items: { productId: string, quantity: number }[]
}

// Response
{
  valid: boolean
  promoCode?: PromoCode
  discountAmount?: number
  error?: string
}
```

#### 2. Apply Promo Code
**POST /api/checkout/apply-promo**

```typescript
// Request
{
  code: string
  orderId: string
  customerId?: string
}

// Response
{
  success: boolean
  discountAmount: number
  newTotal: number
}
```

#### 3. Remove Promo Code
**DELETE /api/checkout/promo**

### UI Components

1. **PromoCodeInput** - Checkout component
2. **PromoCodeBadge** - Display applied promo
3. **PromoCodeManager** - Admin interface (future)

### Implementation Steps

- [x] Design database schema
- [ ] Create database migration script
- [ ] Build promo validation logic
- [ ] Create API routes
- [ ] Build PromoCodeInput component
- [ ] Integrate with checkout flow
- [ ] Add to order summary
- [ ] Testing and QA

---

## 🔄 Feature 2: Subscription System

### Priority: ⭐⭐⭐⭐⭐
**Timeline:** Week 3-5  
**Complexity:** High

### Database Schema

```typescript
// lib/types/subscription.ts
export interface Subscription {
  id: string
  customerId: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  frequency: number // In months (1-12)
  nextDeliveryDate: Date
  lastOrderDate?: Date
  createdAt: Date
  updatedAt: Date
  pausedUntil?: Date
  cancellationReason?: string
  discountPercentage: number // Default 5%
}

export interface SubscriptionItem {
  id: string
  subscriptionId: string
  productId: string
  quantity: number
  price: number // Price at time of subscription
  addedAt: Date
}

export interface SubscriptionHistory {
  id: string
  subscriptionId: string
  action: 'created' | 'paused' | 'resumed' | 'cancelled' | 'item_added' | 'item_removed' | 'frequency_changed'
  details?: string
  performedAt: Date
}
```

### Database Migration

```sql
-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'cancelled', 'expired')),
  frequency INTEGER NOT NULL CHECK(frequency BETWEEN 1 AND 12),
  next_delivery_date INTEGER NOT NULL,
  last_order_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  paused_until INTEGER,
  cancellation_reason TEXT,
  discount_percentage REAL DEFAULT 5.0,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_customer ON subscriptions(customer_id);
CREATE INDEX idx_sub_next_delivery ON subscriptions(next_delivery_date, status);

-- Subscription items
CREATE TABLE IF NOT EXISTS subscription_items (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  added_at INTEGER NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_items ON subscription_items(subscription_id);

-- Subscription history
CREATE TABLE IF NOT EXISTS subscription_history (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  performed_at INTEGER NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_history ON subscription_history(subscription_id, performed_at);
```

### API Routes

#### 1. Create Subscription
**POST /api/subscriptions**

#### 2. Get Customer Subscriptions
**GET /api/subscriptions**

#### 3. Update Subscription
**PATCH /api/subscriptions/[id]**

#### 4. Pause Subscription
**POST /api/subscriptions/[id]/pause**

#### 5. Resume Subscription
**POST /api/subscriptions/[id]/resume**

#### 6. Cancel Subscription
**POST /api/subscriptions/[id]/cancel**

#### 7. Add Item to Subscription
**POST /api/subscriptions/[id]/items**

#### 8. Remove Item from Subscription
**DELETE /api/subscriptions/[id]/items/[itemId]**

#### 9. Process Subscription Orders (Background Job)
**POST /api/subscriptions/process** (Internal/Cron)

### UI Components

1. **SubscriptionOptions** - Product page component
2. **SubscriptionToggle** - Subscribe & Save selector
3. **SubscriptionManager** - Account dashboard
4. **SubscriptionCard** - Display subscription details
5. **SubscriptionItemList** - Manage subscription items
6. **FrequencySelector** - Choose delivery frequency

### Product Page Integration

```tsx
// On product page
<SubscriptionOptions
  productId={product.id}
  basePrice={product.price}
  subscriptionPrice={product.price * 0.95} // 5% discount
  onSubscribe={(frequency) => addToCartWithSubscription(frequency)}
/>
```

### Implementation Steps

- [x] Design database schema
- [ ] Create database migration script
- [ ] Build subscription management logic
- [ ] Create all API routes
- [ ] Build subscription UI components
- [ ] Integrate with product pages
- [ ] Build subscription dashboard
- [ ] Create background job for processing
- [ ] Email notifications
- [ ] Testing and QA

---

## 🔔 Feature 3: Filter Replacement Reminders

### Priority: ⭐⭐⭐⭐
**Timeline:** Week 6-7  
**Complexity:** Medium

### Database Schema

```typescript
// lib/types/reminder.ts
export interface FilterReminder {
  id: string
  customerId: string
  productId: string
  orderId?: string // Original order
  filterLifespan: number // In months
  purchaseDate: Date
  nextReminderDate: Date
  lastReminderSent?: Date
  reminderCount: number
  status: 'active' | 'completed' | 'cancelled'
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReminderPreference {
  id: string
  customerId: string
  emailEnabled: boolean
  smsEnabled: boolean
  daysBeforeReminder: number // Send X days before replacement
  createdAt: Date
  updatedAt: Date
}
```

### Database Migration

```sql
-- Filter reminders
CREATE TABLE IF NOT EXISTS filter_reminders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  order_id TEXT,
  filter_lifespan INTEGER NOT NULL,
  purchase_date INTEGER NOT NULL,
  next_reminder_date INTEGER NOT NULL,
  last_reminder_sent INTEGER,
  reminder_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'cancelled')),
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_reminder_customer ON filter_reminders(customer_id);
CREATE INDEX idx_reminder_next_date ON filter_reminders(next_reminder_date, status, enabled);

-- Reminder preferences
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id TEXT PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  email_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  days_before_reminder INTEGER DEFAULT 7,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### API Routes

#### 1. Create Reminder (Auto after order)
**POST /api/reminders**

#### 2. Get Customer Reminders
**GET /api/reminders**

#### 3. Update Reminder Preferences
**PATCH /api/reminders/preferences**

#### 4. Snooze Reminder
**POST /api/reminders/[id]/snooze**

#### 5. Cancel Reminder
**DELETE /api/reminders/[id]**

#### 6. Process Reminders (Background Job)
**POST /api/reminders/process** (Internal/Cron)

### Email Template

```html
Subject: Time to Replace Your Filter! 🔄

Hi [Name],

It's been [X] months since you purchased your [Product Name]. Based on 
typical usage, it's time to replace your filter to maintain optimal 
air/water quality.

[Product Image]
[Product Name]
[Price]

[Reorder Now Button] - One-click reorder with your saved info!

Why replace regularly?
- Maintains efficiency
- Better air/water quality
- Extends equipment life
- Saves energy costs

Need a different filter? Browse our full selection.

Questions? Our team is here to help!

FiltersFast.com
```

### Implementation Steps

- [x] Design database schema
- [ ] Create database migration script
- [ ] Build reminder creation logic (on order)
- [ ] Create API routes
- [ ] Build reminder preferences UI
- [ ] Design email templates
- [ ] Build background job for sending
- [ ] Integrate with order completion
- [ ] Testing and QA

---

## 🏢 Feature 4: B2B Portal

### Priority: ⭐⭐⭐⭐
**Timeline:** Week 8-10  
**Complexity:** High

### Database Schema

```typescript
// lib/types/b2b.ts
export interface B2BAccount {
  id: string
  customerId: string
  companyName: string
  taxId?: string
  businessType: string
  accountStatus: 'pending' | 'approved' | 'suspended' | 'rejected'
  approvedAt?: Date
  approvedBy?: string // Admin user ID
  creditLimit?: number
  currentBalance: number
  paymentTerms: 'net_15' | 'net_30' | 'net_60' | 'prepay'
  discountTier: number // 1-5 (different discount levels)
  accountManager?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface B2BPricing {
  id: string
  b2bAccountId?: string // Null = applies to tier
  discountTier?: number // Null = specific account
  productId?: string // Null = category or all
  categoryId?: string // Null = specific product or all
  discountType: 'percentage' | 'fixed_price'
  discountValue: number
  minQuantity: number
  createdAt: Date
  updatedAt: Date
}

export interface B2BQuote {
  id: string
  b2bAccountId: string
  customerId: string
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired'
  items: QuoteItem[]
  subtotal: number
  discount: number
  total: number
  validUntil: Date
  notes?: string
  internalNotes?: string
  createdAt: Date
  updatedAt: Date
}

export interface QuoteItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}
```

### Database Migration

```sql
-- B2B accounts
CREATE TABLE IF NOT EXISTS b2b_accounts (
  id TEXT PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  business_type TEXT NOT NULL,
  account_status TEXT NOT NULL CHECK(account_status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_at INTEGER,
  approved_by TEXT,
  credit_limit REAL,
  current_balance REAL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'prepay' CHECK(payment_terms IN ('net_15', 'net_30', 'net_60', 'prepay')),
  discount_tier INTEGER DEFAULT 1 CHECK(discount_tier BETWEEN 1 AND 5),
  account_manager TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_b2b_status ON b2b_accounts(account_status);
CREATE INDEX idx_b2b_tier ON b2b_accounts(discount_tier);

-- B2B pricing
CREATE TABLE IF NOT EXISTS b2b_pricing (
  id TEXT PRIMARY KEY,
  b2b_account_id TEXT,
  discount_tier INTEGER,
  product_id TEXT,
  category_id TEXT,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_price')),
  discount_value REAL NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (b2b_account_id) REFERENCES b2b_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_b2b_pricing_account ON b2b_pricing(b2b_account_id);
CREATE INDEX idx_b2b_pricing_tier ON b2b_pricing(discount_tier);

-- B2B quotes
CREATE TABLE IF NOT EXISTS b2b_quotes (
  id TEXT PRIMARY KEY,
  b2b_account_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'accepted', 'declined', 'expired')),
  items TEXT NOT NULL, -- JSON
  subtotal REAL NOT NULL,
  discount REAL NOT NULL,
  total REAL NOT NULL,
  valid_until INTEGER NOT NULL,
  notes TEXT,
  internal_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (b2b_account_id) REFERENCES b2b_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_b2b_quotes_account ON b2b_quotes(b2b_account_id);
CREATE INDEX idx_b2b_quotes_status ON b2b_quotes(status);
```

### API Routes

#### 1. Apply for B2B Account
**POST /api/b2b/apply**

#### 2. Get B2B Account Info
**GET /api/b2b/account**

#### 3. Request Quote
**POST /api/b2b/quotes**

#### 4. Get Quotes
**GET /api/b2b/quotes**

#### 5. Accept Quote
**POST /api/b2b/quotes/[id]/accept**

#### 6. Get B2B Pricing for Product
**GET /api/b2b/pricing/[productId]**

### UI Components

1. **B2BApplication** - Application form
2. **B2BDashboard** - Account overview
3. **B2BPricing** - Show B2B prices
4. **B2BQuoteRequest** - Request quote form
5. **B2BQuoteList** - View quotes
6. **B2BOrderHistory** - B2B specific orders
7. **B2BAccountInfo** - Display account details

### B2B Application Page

**Route:** `/b2b/apply`

Form fields:
- Company name
- Tax ID / EIN
- Business type
- Contact information
- Estimated monthly volume
- References
- Credit application (optional)

### Implementation Steps

- [x] Design database schema
- [ ] Create database migration script
- [ ] Build B2B account logic
- [ ] Create API routes
- [ ] Build application form
- [ ] Build B2B dashboard
- [ ] Implement B2B pricing logic
- [ ] Build quote system
- [ ] Admin approval interface
- [ ] Testing and QA

---

## 📊 Implementation Timeline

### Week 1-2: Promo Codes
- Days 1-3: Database setup, API routes
- Days 4-7: UI components, testing
- Days 8-10: Integration, QA

### Week 3-5: Subscriptions
- Days 1-5: Database setup, core logic
- Days 6-10: API routes
- Days 11-15: UI components, testing

### Week 6-7: Reminders
- Days 1-4: Database setup, API routes
- Days 5-7: Email templates, background jobs
- Days 8-10: UI, testing

### Week 8-10: B2B
- Days 1-5: Database setup, pricing logic
- Days 6-10: API routes, application form
- Days 11-15: Dashboard, quote system, testing

**Total Timeline:** 10 weeks (~2.5 months)

---

## 🔧 Technical Dependencies

### New Packages Needed

```json
{
  "dependencies": {
    "node-cron": "^3.0.3", // For scheduled jobs
    "nodemailer": "^6.9.7", // For email sending
    "date-fns": "^2.30.0" // For date calculations
  }
}
```

### Environment Variables

```env
# Email (SendGrid)
SENDGRID_API_KEY=your_key_here

# Cron Jobs
CRON_SECRET=your_secret_for_auth

# B2B
B2B_ADMIN_EMAIL=b2b@filtersfast.com
```

---

## ✅ Success Metrics

Track these KPIs:

### Promo Codes
- [ ] Codes created
- [ ] Usage rate
- [ ] Conversion lift
- [ ] Revenue with promos

### Subscriptions
- [ ] Subscription signups
- [ ] Active subscriptions
- [ ] Churn rate
- [ ] Subscription LTV

### Reminders
- [ ] Reminders sent
- [ ] Open rate
- [ ] Click-through rate
- [ ] Reorder conversion

### B2B
- [ ] Applications received
- [ ] Approved accounts
- [ ] B2B revenue
- [ ] Average order value

---

## 🚀 Let's Begin!

Starting with **Promo Codes** as the foundation, then building up to the more complex features.

Ready to start coding! 💪

