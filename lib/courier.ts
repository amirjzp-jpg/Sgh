// ─── Mock courier dispatch ──────────────────────────────────────────────────
// Stands in for a real dispatch/routing system: picks a random courier from
// the seeded pool. A real integration swaps this function's body for a call
// to the dispatch service and keeps the same return shape.

import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function assignCourier(tx: Tx): Promise<{ id: string; name: string }> {
  const couriers = await tx.courier.findMany();
  if (couriers.length === 0) {
    throw new Error("No couriers seeded — run `npm run db:prepare`");
  }
  return couriers[Math.floor(Math.random() * couriers.length)];
}
