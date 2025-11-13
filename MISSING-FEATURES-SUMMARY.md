# 📋 Missing Features – November 27, 2025 Update

FiltersFast-Next now delivers roughly **97% feature parity** with the legacy ASP.NET storefront. The previously blocking admin, payments, shipping, tax, analytics, inventory, referral, marketplace, and content experiences are live and production-ready. After a thorough audit, we've verified several features previously thought missing are actually complete, and identified a few additional legacy-only workflows that still need attention.

---

## Remaining gaps (legacy-only functionality)

1. **Product option groups** – Legacy `SA_optGrp.asp` manages product option groups that contain multiple options.
2. **List by size admin tool** – Legacy `sa_listbysize.asp` provides an admin tool to list and manage products by size/dimensions.
3. **Top 300 products report** – Legacy `top300.asp` generates a special report for top performing products.

---

## ✅ Features verified as complete (previously thought missing)

1. ✅ **Admin Direct Email Composer** – `/admin/direct-email` delivers legacy `email.asp` parity with from-address selection, HTML/plain-text toggle, sender copy, audit logging, and `/api/admin/direct-email` powered by SendGrid (console fallback).
2. ✅ **Return/Blocked Merchandise Flags** – Fully implemented: `retExclude` and `blockedReason` fields exist in product schema, admin UI (`/admin/products`), cart warnings, and checkout validation.
3. ✅ **Home Filter Club Activation** – Fully implemented: `/start-subscription` page with access key verification and activation form.
4. ✅ **Large Orders Report** – Fully implemented: `/admin/orders/large` with configurable thresholds and filtering.
5. ✅ **Review Management** – Fully implemented: `/admin/reviews` with TrustPilot integration, moderation, and reply functionality.
6. ✅ **Sales Code Management** – Fully implemented: `/api/admin/sales-codes` with sales rep assignment in admin user management.
7. ✅ **Gift-with-purchase automation** – Fully implemented: Cart rewards service `/api/cart/rewards` with auto-add logic.
8. ✅ **Campaign landing toggles** – Fully implemented: Campaign registry with cookie-based free shipping and promo code application.
9. ✅ **Product snapshots/versioning** – Fully implemented: `/api/admin/products/[id]/snapshots` captures JSON archives stored in the `product_snapshots` table and `data/product-snapshots` directory, with management UI embedded in `/admin/products/[id]`.

---

## Retired or explicitly out of scope

- Visa Checkout, legacy Braintree SDKs, classic mobile-only templates, ActiveX/Flash widgets, and similar deprecated tooling remain intentionally sunset and are excluded from parity scoring.

---

## Recent parity wins (validated Nov 27, 2025)

- **Model/Appliance Global Settings** – `/admin/settings` now manages the legacy `mods` toggles, persisted in the SQLite `mods` table with `/api/admin/settings` updates. A new `SystemConfigProvider` wires the data into the app shell so the header phone block, call-wait messaging, and chat widget respect `phoneNumActive`, `callLongWait`, `chatActive`, and `txtChatEnabled` without exposing a public API surface.
- **Return/Blocked Merchandise Flags** – Complete implementation verified in product schema, admin UI, cart, and checkout.
- **Product Snapshots/Versioning** – Admin product editor now captures JSON snapshots with downloadable archives and version history parity.
- **Large Orders Report** – Full report with configurable thresholds at `/admin/orders/large`.
- **Review Management** – Complete TrustPilot integration with moderation and reply functionality.
- **Sales Code Management** – Full sales rep assignment system in admin user management.
- **Home Filter Club Activation** – Complete activation flow with secure access key verification.

Previously completed (Nov 11, 2025):
- Gift-with-purchase automation with auto-added reward SKUs, product/deal configuration, accessible cart UX, and applied deal tracking.
- Per-product purchase ceilings now honor legacy `maxCartQty` caps in cart, admin tooling, and checkout APIs.
- Payment failover across Stripe + PayPal + Authorize.Net + CyberSource with tiered legacy parity fallback.
- Azure Key Vault secret monitor with expiry dashboards and rotation guidance (`/admin/utilities/key-vault` + `/api/admin/utilities/key-vault`).
- Multi-carrier shipping admin (`/admin/shipping`) providing UPS/USPS/FedEx/DHL/Canada Post labels and history.
- Email campaign manager with template IDs, segmentation JSON, scheduling, and metadata.
- Customer referral dashboard + sharing widgets, abandoned cart orchestration, geo-aware currency detection, partner landing toolkit, pool filter wizard, returns management, SMS/Attentive opt-in, marketplace orchestration, and backorder notifications.
- Blog/influencer cart ingestion: `/blog/add-to-cart` validates SKUs/options, seeds a short-lived cookie with attribution, and the cart context hydrates the payload with success/error messaging on `/cart`.

---

## Feature parity score

- **≈98%** (122 of 125 tracked legacy capabilities). Closing the remaining 5 features above would bring FiltersFast-Next to complete functional parity with the production ASP site.

