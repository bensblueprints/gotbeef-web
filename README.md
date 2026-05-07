# Got Beef — Custom Next.js Storefront

Gourmet brisket beef jerky e-commerce site. Custom-built (not Shopify), with bundle pricing, customer accounts, ShipStation fulfillment, Airwallex payments, Klaviyo + internal email capture.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**
- **Postgres** via **Prisma** (Neon recommended for serverless)
- **Auth.js v5** — magic-link email + email/password
- **Airwallex** — payment processing (Drop-in checkout)
- **ShipStation** — order fulfillment + tracking
- **Klaviyo** — marketing email
- **Resend** — transactional email
- **Vercel** — hosting

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

## Local dev

```bash
pnpm install              # or npm install
cp .env.example .env      # fill in keys (see "Required env" below)
pnpm db:push              # creates the schema in your Postgres DB
pnpm dev                  # http://localhost:3000
```

## Required env vars

Generated `.env.example` at the project root. Critical ones:

| Var | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | resend.com → API keys |
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo → settings → API keys |
| `KLAVIYO_NEWSLETTER_LIST_ID` | Klaviyo → list URL |
| `AIRWALLEX_CLIENT_ID` + `AIRWALLEX_API_KEY` | Airwallex dashboard → developer |
| `AIRWALLEX_WEBHOOK_SECRET` | Airwallex → webhooks (after creating webhook) |
| `SHIPSTATION_API_KEY` + `SHIPSTATION_API_SECRET` | ShipStation → account → API settings |
| `ADMIN_EMAIL_ALLOWLIST` | comma-separated emails granted admin access |

## Webhook URLs to register

After deploy:

- **Airwallex** → `https://gotbeef.us/api/webhooks/airwallex`
  - Subscribe to: `payment_intent.succeeded`, `payment_intent.failed`, `refund.processed`
- **ShipStation** → `https://gotbeef.us/api/webhooks/shipstation`
  - Subscribe to: `SHIP_NOTIFY`, `ITEM_SHIP_NOTIFY`

## Project structure

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
│   ├── account/                   Customer portal (login-gated)
│   │   ├── orders/                Order history + detail with tracking
│   │   ├── addresses/
│   │   ├── profile/
│   │   └── login/                 Magic-link sign-in
│   ├── admin/                     Admin dashboard (allowlist-gated)
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── email/                 Klaviyo + internal email captures
│   │   └── export.csv             CSV export route
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── checkout/create-intent/
│       ├── email/subscribe/        Klaviyo + DB capture
│       └── webhooks/
│           ├── airwallex/         Payment events → mark paid → push to ShipStation
│           └── shipstation/       Tracking events → mark shipped → email customer
├── components/
│   ├── AnnouncementBar.tsx        Marquee with FREE SHIPPING etc.
│   ├── Header.tsx                 Nav with cart pip
│   ├── Footer.tsx                 With Klaviyo subscribe form
│   ├── Logo.tsx                   Inline SVG logo (4 variants: horizontal, stacked, wordmark, favicon)
│   ├── FlavorCard.tsx
│   ├── AddToCartBox.tsx           Qty + add button
│   └── Providers.tsx              Cart + session providers
├── lib/
│   ├── products.ts                5 flavors + sampler SKU
│   ├── pricing.ts                 Bundle pricing logic (single source of truth)
│   ├── cartStore.ts               localStorage-backed cart context
│   ├── db.ts                      Prisma singleton
│   ├── email.ts                   Resend transactional emails
│   └── integrations/
│       ├── airwallex.ts           Auth + create payment intent + verify webhooks
│       ├── shipstation.ts         createOrder, getRates
│       └── klaviyo.ts             subscribeToList
├── auth.ts                        Auth.js v5 config
└── middleware.ts                  (optional — admin route protection done in layouts)
prisma/
└── schema.prisma                  All models
```

## Deploy to Vercel

```bash
vercel link
vercel env pull
vercel --prod
```

## Order lifecycle

1. Customer adds to cart → cart in localStorage
2. Checkout → POST `/api/checkout/create-intent` creates Order (status `pending`) + Airwallex Payment Intent
3. Customer pays via Airwallex Drop-in → redirected to `/checkout/return`
4. Airwallex webhook → `payment_intent.succeeded` → Order updated to `paid` → pushed to ShipStation → status `fulfilling` → confirmation email sent
5. ShipStation webhook (when shipped) → `SHIP_NOTIFY` → Order updated to `shipped` with tracking number → shipping email sent

## Email captures

Every email goes into `EmailCapture` table FIRST, then attempts Klaviyo sync. If Klaviyo fails, the email is preserved internally and can be retried.

## Subscriptions (V1: NOT included)

Schema is wired for it (Order has `userId`, products are reusable SKUs). To add later:
- Add `Subscription` and `SubscriptionItem` Prisma models
- Add scheduled job (Vercel Cron) to generate orders from active subscriptions
- Use Airwallex saved payment methods for charging

## Reviews (V1: NOT included)

Either add a `Review` Prisma model (rating + body + verified-purchase flag) or drop in Judge.me / Yotpo via embed.

## Tax

V1: tax is a column on `Order` set to 0 by default. To wire real calc:
- Add TaxJar SDK
- In `create-intent` route, call `taxjar.taxForOrder()` before creating the Order
- Pass `taxCents` into the create flow
