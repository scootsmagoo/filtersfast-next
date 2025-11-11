# 📋 Missing Features – November 11, 2025 Update

FiltersFast-Next now delivers roughly **96% feature parity** with the legacy ASP.NET storefront. The previously blocking admin, payments, shipping, tax, analytics, inventory, referral, marketplace, and content experiences are live and production-ready. Only a couple of legacy-only workflows still need attention to reach full parity.

---

## Remaining gaps (legacy-only functionality)

- Per-product purchase ceilings enforced via `maxCartQty` in legacy carts are absent; the Next.js cart allows 1–99 units universally.
- Return-policy and blocked merchandising switches (`retExclude`, `blockedReason`) that drive “all sales final” messaging and temporary lockouts are still missing from the modern product model.

---

## Retired or explicitly out of scope

- Visa Checkout, legacy Braintree SDKs, classic mobile-only templates, ActiveX/Flash widgets, and similar deprecated tooling remain intentionally sunset and are excluded from parity scoring.

---

## Recent parity wins (validated Nov 11, 2025)

- Gift-with-purchase automation with auto-added reward SKUs, product/deal configuration, accessible cart UX, and applied deal tracking.
- Payment failover across Stripe + PayPal + Authorize.Net + CyberSource with tiered legacy parity fallback.
- Azure Key Vault secret monitor with expiry dashboards and rotation guidance (`/admin/utilities/key-vault` + `/api/admin/utilities/key-vault`).
- Multi-carrier shipping admin (`/admin/shipping`) providing UPS/USPS/FedEx/DHL/Canada Post labels and history.
- Email campaign manager with template IDs, segmentation JSON, scheduling, and metadata.
- Customer referral dashboard + sharing widgets, abandoned cart orchestration, geo-aware currency detection, partner landing toolkit, pool filter wizard, Home Filter Club, returns management, SMS/Attentive opt-in, marketplace orchestration, and backorder notifications.

---

## Feature parity score

- **≈98%** (118 of 120 tracked legacy capabilities). Closing the two remaining items above would bring FiltersFast-Next to complete functional parity with the production ASP site.

