import { prisma } from "@/lib/prisma";

// Spendable balance = released sale credits minus withdrawals (pending or completed).
// Held (escrow) credits are shown separately and are not withdrawable.
export async function walletBalanceCents(userId: string): Promise<number> {
  const txns = await prisma.walletTxn.findMany({ where: { userId } });
  let balance = 0;
  for (const t of txns) {
    if (t.type === "credit" && t.status === "released") balance += t.amountCents;
    if (t.type === "withdrawal") balance -= t.amountCents;
  }
  return balance;
}

export async function heldBalanceCents(userId: string): Promise<number> {
  const result = await prisma.walletTxn.aggregate({
    where: { userId, type: "credit", status: "held" },
    _sum: { amountCents: true },
  });
  return result._sum.amountCents ?? 0;
}
