# Deploying Got Beef to Netlify

This is the step-by-step. Skip ahead if you've already done a step.

---

## 0 · What you need before starting

| Service | Why | Free tier? |
|---|---|---|
| GitHub account | Source repo Netlify pulls from | Yes |
| Netlify account | Hosting + deploy | Yes |
| Postgres database | Customer accounts, orders, email captures | **Neon** or **Supabase** — both free |
| Resend account | Magic-link login + transactional email | Yes (3k/mo) |
| Klaviyo account | Marketing email | Yes (250 contacts) |
| Airwallex account | Payment processing | Real account needed |
| ShipStation account | Order fulfillment + tracking | Trial available |

For the **first deploy**, you only strictly need GitHub + Netlify + a Postgres URL. The other services can be added later — the site will deploy and the storefront will work; just login + checkout won't fully function until you wire the rest.

---

## 1 · Create the GitHub repo

1. Create a new repo at github.com/new (private is fine)
2. From your local machine:
```
cd gotbeef-web
git init
git add .
git commit -m "initial got beef storefront"
git branch -M main
git remote add origin git@github.com:<you>/gotbeef-web.git
git push -u origin main
```

---

## 2 · Set up the database (Neon — fastest path)

1. neon.tech → sign up (free)
2. Create a project named "gotbeef"
3. Copy the **pooled connection string** (with `-pooler` in the host)
4. Save it — this is your `DATABASE_URL`

(Or use Supabase — connection string is in Settings → Database)

---

## 3 · Set up Resend

1. resend.com → sign up
2. Verify the gotbeef.us domain (DNS record they give you)
3. Create an API key
4. Save the key — this is `RESEND_API_KEY`
5. From address: `Got Beef <orders@gotbeef.us>` — this is `RESEND_FROM`

---

## 4 · Generate AUTH_SECRET

```
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

---

## 5 · Connect to Netlify

1. netlify.com → "Add new site" → "Import an existing project" → GitHub
2. Select the `gotbeef-web` repo
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `prisma generate && next build`
   - Publish directory: `.next`
4. **Environment variables** (Site settings → Build & deploy → Environment):

| Key | Value |
|---|---|
| `DATABASE_URL` | from Neon |
| `AUTH_SECRET` | from step 4 |
| `AUTH_URL` | `https://YOUR-SITE.netlify.app` (then update to `https://gotbeef.us` after custom domain) |
| `NEXT_PUBLIC_SITE_URL` | same as `AUTH_URL` |
| `RESEND_API_KEY` | from Resend |
| `RESEND_FROM` | `Got Beef <orders@gotbeef.us>` |
| `ADMIN_EMAIL_ALLOWLIST` | `ben@advancedmarketing.co` |

Add these later when you have them:
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo → Settings → API keys |
| `KLAVIYO_NEWSLETTER_LIST_ID` | Klaviyo → Lists → URL |
| `AIRWALLEX_CLIENT_ID` + `AIRWALLEX_API_KEY` + `AIRWALLEX_WEBHOOK_SECRET` | Airwallex dashboard |
| `AIRWALLEX_ENV` | `demo` for testing, `prod` for live |
| `SHIPSTATION_API_KEY` + `SHIPSTATION_API_SECRET` | ShipStation → Account → API |

5. Hit **Deploy**

---

## 6 · After first successful deploy

1. **Push the database schema:** locally run `pnpm db:push` (or `npm run db:push`) with your `.env.production` set to the Neon URL.
2. **Custom domain:** Site settings → Domain management → add `gotbeef.us`. Netlify gives you DNS records.
3. **Webhooks:** in Airwallex dashboard, register webhook URL `https://gotbeef.us/api/webhooks/airwallex` and subscribe to `payment_intent.succeeded`. In ShipStation dashboard, register `https://gotbeef.us/api/webhooks/shipstation`.

---

## Troubleshooting

**Build fails with "Can't resolve @prisma/client"** — Prisma client wasn't generated. The build command should run `prisma generate && next build` (already in `netlify.toml` and `package.json`).

**Auth pages 500** — Missing `AUTH_SECRET` or `AUTH_URL`. Set both in Netlify env vars.

**Magic-link email doesn't arrive** — Check Resend dashboard → Logs. Most common: domain not verified.

**Webhooks not firing** — Verify the webhook URL in Airwallex/ShipStation dashboards, and check `WebhookEvent` table for incoming events. Check signature in `AIRWALLEX_WEBHOOK_SECRET`.
