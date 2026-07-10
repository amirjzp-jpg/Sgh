# Lolosel — Old Loves. New Hands.

Vancouver's secondhand marketplace. Free to sell, courier-run handoff, escrow-held payments.

This is a **clickable, locally-runnable prototype**: real auth, real persistence (SQLite), real
chat — with payments, courier dispatch, and withdrawals **simulated** through the same data model
a real integration would use.

## Run it

```bash
npm install
npm run dev
```

That's it — no external accounts, keys, or cloud services. First run creates `.env` from
`.env.example`, pushes the Prisma schema into a local SQLite file, and seeds demo data.
Open http://localhost:3000.

Reset to a fresh seeded database anytime with `npm run db:reset`.

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
