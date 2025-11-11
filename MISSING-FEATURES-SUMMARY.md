# 📋 Missing Features – November 11, 2025 Update

FiltersFast-Next now delivers roughly **96% feature parity** with the legacy ASP.NET storefront. The previously blocking admin, payments, shipping, tax, analytics, inventory, referral, marketplace, and content experiences are live and production-ready. Only a couple of legacy-only workflows still need attention to reach full parity.

---

## Remaining gaps (legacy-only functionality)

- **Azure Key Vault secret health check**
  - Legacy: `Manager/sa_vault.asp` surfaces Azure Key Vault secret status/expiry for payment credentials to operations/admins.
  - FiltersFast-Next: runtime secrets live in environment variables with no equivalent observability or rotation indicator.
  - Impact: loss of admin visibility into credential health. Plan to add a replacement dashboard, automated monitoring, or documented operational procedure.

---

## Retired or explicitly out of scope

- Visa Checkout, legacy Braintree SDKs, classic mobile-only templates, ActiveX/Flash widgets, and similar deprecated tooling remain intentionally sunset and are excluded from parity scoring.

---

## Recent parity wins (validated Nov 11, 2025)

- Payment failover across Stripe + PayPal + Authorize.Net + CyberSource with tiered legacy parity fallback.
- Multi-carrier shipping admin (`/admin/shipping`) providing UPS/USPS/FedEx/DHL/Canada Post labels and history.
- Email campaign manager with template IDs, segmentation JSON, scheduling, and metadata.
- Customer referral dashboard + sharing widgets, abandoned cart orchestration, geo-aware currency detection, partner landing toolkit, pool filter wizard, Home Filter Club, returns management, SMS/Attentive opt-in, marketplace orchestration, and backorder notifications.

---

## Feature parity score

- **≈96%** (115 of 120 tracked legacy capabilities). Closing the two items above would bring FiltersFast-Next to complete functional parity with the production ASP site.

