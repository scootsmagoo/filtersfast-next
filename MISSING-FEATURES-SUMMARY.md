# 📋 Missing Features – November 11, 2025 Update

FiltersFast-Next now delivers roughly **95% feature parity** with the legacy ASP.NET storefront. The previously blocking admin, payments, shipping, tax, analytics, inventory, referral, marketplace, and content experiences are live and production-ready. Only a handful of legacy-only workflows still need attention to reach full parity.

---

## Remaining gaps (legacy-only functionality)

- Gift-with-purchase auto fulfillment (`add_gift_item` in `cart.asp`) that inserts qualifying freebies into the cart when a promotion is active.
- Return-policy and blocked merchandising switches (`retExclude`, `blockedReason`) that drive “all sales final” messaging and temporary lockouts.
- Campaign landing toggles (`Filter10now.asp`, `CLT.asp`) that set session/cookie flags to unlock free shipping, stacked discounts, and promo overlays on arrival.
- Home Filter Club “start subscription” handler (`start-subscription/default.asp`) that decodes secure `accesskey` links from lifecycle emails to render the autoship opt-in form.
- Blog-to-cart ingestion endpoint (`add-from-blog.asp`) that validates SKU availability, seeds a cart, injects the promo SKU, and records blog attribution before redirecting to checkout.

---

## Retired or explicitly out of scope

- Visa Checkout, legacy Braintree SDKs, classic mobile-only templates, ActiveX/Flash widgets, and similar deprecated tooling remain intentionally sunset and are excluded from parity scoring.

---

## Recent parity wins (validated Nov 11, 2025)

- Gift-with-purchase automation with auto-added reward SKUs, product/deal configuration, accessible cart UX, and applied deal tracking.
- Per-product purchase ceilings now honor legacy `maxCartQty` caps in cart, admin tooling, and checkout APIs.
- Payment failover across Stripe + PayPal + Authorize.Net + CyberSource with tiered legacy parity fallback.
- Azure Key Vault secret monitor with expiry dashboards and rotation guidance (`/admin/utilities/key-vault` + `/api/admin/utilities/key-vault`).
- Multi-carrier shipping admin (`/admin/shipping`) providing UPS/USPS/FedEx/DHL/Canada Post labels and history.
- Email campaign manager with template IDs, segmentation JSON, scheduling, and metadata.
- Customer referral dashboard + sharing widgets, abandoned cart orchestration, geo-aware currency detection, partner landing toolkit, pool filter wizard, Home Filter Club, returns management, SMS/Attentive opt-in, marketplace orchestration, and backorder notifications.

---

## Feature parity score

- **≈95%** (114 of 120 tracked legacy capabilities). Closing the remaining journeys above would bring FiltersFast-Next to complete functional parity with the production ASP site.

