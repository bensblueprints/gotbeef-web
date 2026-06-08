# Got Beef — Custom Next.js Storefront

Gourmet brisket beef jerky e-commerce site. Custom-built (not Shopify), with bundle pricing, customer accounts, ShipStation fulfillment, Airwallex payments, Klaviyo + internal email capture.

---

## Live Site

| URL | Purpose |
|---|---|
| https://gotbeef.us | Production storefront |
| https://www.gotbeef.us | www redirect → gotbeef.us |
| https://gotbeef.advancedmarketing.co | Internal alias |

## Admin Login

| Field | Value |
|---|---|
| URL | https://gotbeef.us/account/login → Password tab |
| Email | ben@advancedmarketing.co |
| Password | see `ADMIN_BOOTSTRAP_PASSWORD` env var in Netlify |

Admin dashboard: https://gotbeef.us/admin

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**
- **Postgres** via **Prisma** — **Supabase** (shared project, isolated `gotbeef` schema)
- **Auth.js v5** — magic-link email (Resend) + email/password (admin)
- **Airwallex** — payment processing (Drop-in checkout)
- **ShipStation** — order fulfillment + tracking
- **Klaviyo** — marketing email
- **Resend** — transactional email + magic-link auth
- **Netlify** — hosting + CDN, deployed via GitHub Actions on push to `main`

---

## Pricing rules (hardcoded — see `src/lib/pricing.ts`)

| What | Price |
|---|---|
| 1 pack | $19.99 |
| 2 packs | $35.98 (save 10%) |
| 3 packs | $50.97 (save 15%) |
| 4+ packs | 15% off everything |
| 5-flavor sampler (1 of each) | $75.00 |
| Free shipping | Orders ≥ $50 |

Adjust constants in `src/lib/pricing.ts` to change.

---

## Customer Accounts

Customers create accounts via **magic-link** — no separate registration step. Flow:

1. Customer visits `/account/login`
2. Enters their email → clicks "Email me a sign-in link"
3. Resend sends a one-tap link to their inbox
4. On first use, account is created automatically

Requires `RESEND_API_KEY` to be set. Without it, the magic-link tab is disabled and only admin password login works.

---

## Infrastructure

| Service | Details |
|---|---|
| Hosting | Netlify — `@netlify/plugin-nextjs`, serverless functions for SSR/API routes |
| Deploy | GitHub Actions (`.github/workflows/deploy-netlify.yml`) → `netlify deploy --build --prod` on every push to `main`. Manual: `workflow_dispatch`. |
| Repo | `github.com/bensblueprints/gotbeef-web` (branch `main`) |
| GitHub secrets | `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` |
| Database | Supabase Postgres (shared project, isolated `gotbeef` schema) via pooler |
| DNS | Cloudflare → Netlify (`gotbeef.us`, `www` redirect) |

---

## Environment Variables

Set in Netlify → Site configuration → Environment variables (and mirrored in local `.env` for development).

| Var | Status | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Set | Supabase pooler (`schema=gotbeef`); Netlify + local `.env` |
| `AUTH_SECRET` | ✅ Set | JWT signing secret |
| `AUTH_URL` | ✅ Set | `https://gotbeef.us` |
| `AUTH_TRUST_HOST` | ✅ Set | `true` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set | `https://gotbeef.us` |
| `ADMIN_EMAIL_ALLOWLIST` | ✅ Set | `ben@advancedmarketing.co` |
| `ADMIN_BOOTSTRAP_PASSWORD` | ✅ Set | Admin password (see Netlify env) |
| `RESEND_FROM` | ✅ Set | `Got Beef <orders@gotbeef.us>` |
| `AIRWALLEX_CLIENT_ID` | ✅ Set | Scoped key — Client ID |
| `AIRWALLEX_API_KEY` | ✅ Set | Scoped key — API secret |
| `AIRWALLEX_WEBHOOK_SECRET` | ✅ Set | Webhook `wh_VRB3IXF0bK0EaKs5sOv0FMOhjP00lnN1` |
| `AIRWALLEX_ENV` | ✅ Set | `prod` |
| `RESEND_API_KEY` | ❌ Missing | Required for magic-link + transactional emails |
| `KLAVIYO_PRIVATE_API_KEY` | ❌ Missing | Required for newsletter list sync |
| `KLAVIYO_NEWSLETTER_LIST_ID` | ❌ Missing | Required for newsletter list sync |
| `SHIPSTATION_API_KEY` | ❌ Missing | Required for order fulfillment |
| `SHIPSTATION_API_SECRET` | ❌ Missing | Required for order fulfillment |

---

## Webhooks

| Service | URL | Status |
|---|---|---|
| Airwallex | `https://gotbeef.us/api/webhooks/airwallex` | ✅ Registered — ID `wh_VRB3IXF0bK0EaKs5sOv0FMOhjP00lnN1` |
| ShipStation | `https://gotbeef.us/api/webhooks/shipstation` | ❌ Not yet registered |

**Airwallex events to subscribe to:**
- `payment_intent.succeeded`
- `payment_attempt.paid`
- `refund.received` / `refund.settled` / `refund.failed`

**ShipStation events to subscribe to:**
- `SHIP_NOTIFY`
- `ITEM_SHIP_NOTIFY`

---

## Local Dev

```bash
npm install
cp .env.example .env      # fill in keys
npx prisma db push        # sync schema
npm run dev               # http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── (storefront)
│   │   ├── page.tsx               Home
│   │   ├── products/              Shop + product detail (5 flavors + sampler)
│   │   ├── our-beef/              Brand story
│   │   └── faq/
│   ├── cart/                      Cart page
│   ├── checkout/                  Checkout flow
│   ├── account/
│   │   ├── login/                 Magic-link + password sign-in (auto-registers new customers)
│   │   └── (authed)/
│   │       ├── page.tsx           Account dashboard
│   │       ├── orders/            Order history + tracking
│   │       ├── addresses/
│   │       ├── profile/
│   │       └── reviews/
│   ├── admin/                     Admin dashboard (allowlist-gated)
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── email/                 Klaviyo + internal email captures
│   │   └── export.csv
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── checkout/create-intent/
│       ├── email/subscribe/        Klaviyo + DB capture
│       └── webhooks/
│           ├── airwallex/         payment_intent.succeeded → paid → ShipStation
│           └── shipstation/       SHIP_NOTIFY → shipped → email customer
├── lib/
│   ├── products.ts                5 flavors + sampler SKUs
│   ├── pricing.ts                 Bundle pricing logic
│   ├── cartStore.ts               localStorage cart
│   ├── db.ts                      Prisma singleton
│   ├── email.ts                   Resend transactional emails
│   └── integrations/
│       ├── airwallex.ts           Auth + payment intent + webhook verify
│       ├── shipstation.ts         createOrder, getRates
│       └── klaviyo.ts             subscribeToList
├── auth.ts                        Auth.js v5 config
└── middleware.ts
prisma/
└── schema.prisma
```

---

## Order Lifecycle

1. Customer adds to cart → cart in localStorage
2. Checkout → POST `/api/checkout/create-intent` → creates Order (status `pending`) + Airwallex Payment Intent
3. Customer pays via Airwallex Drop-in → redirected to `/checkout/return`
4. Airwallex webhook → `payment_intent.succeeded` → Order → `paid` → pushed to ShipStation → `fulfilling` → confirmation email
5. ShipStation webhook → `SHIP_NOTIFY` → Order → `shipped` + tracking number → shipping email

---

## Email Captures

Every email goes into `EmailCapture` table first, then attempts Klaviyo sync. If Klaviyo fails the email is preserved internally and can be retried from `/admin/email`.

---

## What's Working vs Pending

| Feature | Status |
|---|---|
| Storefront + cart | ✅ Live |
| Customer accounts (magic-link) | ⏳ Needs `RESEND_API_KEY` |
| Admin login | ✅ Working |
| Airwallex payments | ✅ Keys set, prod mode |
| Airwallex webhook | ✅ Registered |
| ShipStation fulfillment | ⏳ Needs API keys + webhook |
| Klaviyo email list | ⏳ Needs API key + list ID |
| Transactional emails | ⏳ Needs `RESEND_API_KEY` |
