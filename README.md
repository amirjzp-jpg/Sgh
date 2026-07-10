# Lolosel — Old Loves. New Hands.

Vancouver's secondhand marketplace. Free to sell, courier-run handoff, escrow-held payments.

This is a **clickable, locally-runnable prototype**: real auth, real persistence (SQLite), real
chat — with payments, courier dispatch, and withdrawals **simulated** through the same data model
a real integration would use.

## Run it

The app uses Postgres (a free Supabase project) so the same database works locally and on Vercel.

1. Create a free project at [supabase.com](https://supabase.com) and set a database password.
2. In the Supabase dashboard click **Connect** → **ORMs** → **Prisma**: copy the two URIs it
   shows into `.env` (see `.env.example` — `DATABASE_URL` is the transaction pooler on port
   6543 with `?pgbouncer=true&connection_limit=1`, `DIRECT_URL` is the direct connection on
   port 5432).
3. Then:

```bash
npm install
npm run dev
```

First run pushes the Prisma schema and seeds demo data (seeding is idempotent — it skips if
data already exists). Open http://localhost:3000.

Reset to a fresh seeded database anytime with `npm run db:reset`.

## Deploy to Vercel

1. Push this repo to GitHub (done if you're reading this there) and import it at
   [vercel.com/new](https://vercel.com/new). Framework auto-detects as Next.js; no build
   settings to change.
2. In the project's **Settings → Environment Variables**, add:
   - `DATABASE_URL` — same pooler URI as above (`?pgbouncer=true&connection_limit=1` matters
     on serverless)
   - `DIRECT_URL` — same direct URI as above (used by `prisma db push` during the build)
   - `NEXTAUTH_SECRET` — a long random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-app.vercel.app` (add/update it
     after the first deploy if you don't know it yet)
3. Deploy. The build runs `prisma db push` + the idempotent seed, so the database is ready on
   the first deploy with no manual step.

### Demo accounts

| Email | Role |
|---|---|
| maya@example.com | buyer/seller (has a completed purchase) |
| arjun@example.com | buyer/seller (has wallet balance from a sale) |
| sofia@example.com | buyer/seller (mid-negotiation on the teak sofa) |
| dev@example.com | buyer/seller |
| admin@lolosel.ca | admin (sees the flagged-content dashboard) |

Password for all accounts: `password123`

## Try the full flow

1. Log in as **sofia** → Inbox → the teak sofa thread has a live counter-offer to accept.
2. Accept it → **Check out** with any 16-digit card number → payment is "held in escrow" and a
   courier is auto-assigned.
3. Open **Courier** → advance the delivery: picked up → in transit → delivered.
4. Back as sofia → **Orders** → confirm receipt → funds release to Arjun's wallet.
5. Log in as **arjun** → **Wallet** → see the released balance → click **Withdraw** (creates a
   pending withdrawal record).
6. Both sides can rate each other from the order page; report/block lives on profiles, listings,
   and orders.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite (file-based, swaps to Postgres by changing the datasource)
- NextAuth (credentials provider, bcrypt-hashed passwords, JWT sessions)
- Tailwind CSS
- Zod validation on every form and API route
- Chat via 2.5s polling against an API route

## Where real integrations slot in

- **Payments**: `lib/payments/mock.ts` is the single seam — replace its body with Stripe Connect
  (PaymentIntent + destination charge). Card data never touches the DB, matching that posture.
- **Courier dispatch**: `lib/courier.ts` picks from a seeded pool; swap for a dispatch service.
- **Withdrawals**: pending `WalletTxn` records are what a payout rail would consume.

## Explicitly out of scope (per spec)

Real payment processing, KYC, real courier logistics, real e-transfers, dispute adjudication,
PIPEDA review, content moderation, and notifications.
