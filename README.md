# FiltersFast Next

Modern FiltersFast e-commerce experience built with Next.js 16, TypeScript, Tailwind CSS, and a hardened API layer. This repository hosts the full storefront, customer portal, and admin workspace used in production.

_Last updated: November 2025_

## Quick Start
- **Prerequisites:** Node.js 18+, npm, Git. SQLite is bundled; PostgreSQL/MySQL optional.
- **Install & run:**
  1. `git clone git@github.com:scootsmagoo/filtersfast-next.git`
  2. `cd filtersfast-next`
  3. `npm install`
  4. `cp .env.example .env.local` and fill required secrets (see `SETUP.md`)
  5. `npm run dev` → http://localhost:3000
- Common seed scripts live in `scripts/` (example: `npm run init:products`, `npm run init:marketplaces`). Only run what you need—details below.

## Common Scripts
- `npm run dev` – Next.js dev server with Turbopack
- `npm run build` / `npm run start` – Production build & serve
- `npm run lint`, `npm run type-check` – Quality gates
- `npm run test:e2e` – Playwright smoke tests (see `DEVELOPMENT.md`)
- `npm run init:*` – Database/bootstrap helpers (`npm run init:blog`, `init:orders`, etc.)
- `npm run update:*` / `npm run sync:*` – Background sync jobs (currency, marketplaces, reviews, email)

Refer to `package.json` scripts for the full catalog.

## Environment & Data Setup
- `.env.local` is required; copy from `.env.example`.
- Core secrets: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
- Payments (Stripe, PayPal, Authorize.net, CyberSource), email (SendGrid), Trustpilot, currency rates, marketplaces, and AI chatbot each have optional blocks that can remain unset in local development.
- Database defaults to SQLite (`filtersfast.db`). Swap `DATABASE_URL` for Postgres/MySQL in production.
- See `SETUP.md` for detailed provider configuration, MFA encryption, cron jobs, and troubleshooting.

## Key Capabilities (All Live)
- **Authentication & Accounts:** Better Auth with social login, MFA, trusted devices, and admin role gates.
- **Catalog & Search:** Typed SQLite/Postgres models, SKU compatibility, rich merchandising controls, AI-assisted search, and analytics dashboards.
- **Checkout & Payments:** Stripe primary gateway with PayPal, Authorize.net, and CyberSource failover; digital gift cards; cart rewards; tax/shipping integrations.
- **Admin Workspace:** Product, category, blog, email campaign, marketplace, and image management with full audit logging and accessibility coverage.
- **Customer Experience:** Subscription manager, reminders, pooled filter wizard, reviews, multi-currency pricing, accessibility-first UI, and responsive layout.

## Documentation Index
- `SETUP.md` – End-to-end environment, auth, payments, email, and optional integrations.
- `DEVELOPMENT.md` – Day-to-day workflow, code quality expectations, testing strategy.
- `FEATURES.md` – Deep dives on major modules and UX decisions.
- `AUDIT-EXECUTIVE-SUMMARY.md` – High-level modernization outcomes and compliance status.
- `AUDIT-LEGACY-FEATURES.md` – Legacy parity map with implementation notes.
- `MISSING-FEATURES-SUMMARY.md` – Remaining gaps versus legacy platform (keep in sync as work lands).

## Project Structure
- `app/` – App Router pages for storefront, customer portal, admin.
- `components/` – Shared UI + domain components (namespaced by feature).
- `lib/` – Server utilities: auth, payments, analytics, background jobs, db access.
- `scripts/` – One-off CLI scripts for seeding, migrations, syncing external systems.
- `database/` – SQL schema files for initializing feature-specific tables.

## Testing & Quality
- `npm run lint` – ESLint (CI blocking)
- `npm run type-check` – TypeScript project references
- `npm run test:e2e` – Playwright journeys (requires seeded demo data; see `DEVELOPMENT.md`)
- `npm run audit` – npm advisory scan (run before production deployments)
- Git hooks (Husky) enforce lint/type-check on committed files—run `npm run prepare` after fresh installs if hooks are missing.

## Deployment
- **Vercel:** Preferred for staging/production. Connect repo, mirror `.env.local` values, set `NEXT_PUBLIC_APP_URL` per environment.
- **Self-hosted:** `npm run build` → `npm run start` behind Node 18 LTS process manager (PM2, systemd, etc.).
- Background jobs (currency rates, marketplaces, campaigns) should run via scheduled `npm run update:*`/`npm run sync:*` commands in production.
- Security checklist lives in `SETUP.md` (“Security Checklist” section). Review before promoting builds.

## Support & Contributions
- Open issues or enhancement requests in this repository.
- Use feature-specific docs above when handing off workstreams or onboarding new contributors.
- For urgent production incidents, follow the internal escalation playbook (see `docs/ops/` if present).

---

For anything missing or outdated, please update the relevant doc alongside your code changes to keep the knowledge base tight.


