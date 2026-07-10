import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { walletBalanceCents, heldBalanceCents } from "@/lib/wallet";
import { formatMoney, formatDateTime } from "@/lib/format";
import WithdrawForm from "@/components/WithdrawForm";

export const dynamic = "force-dynamic";

const txnLabel: Record<string, string> = {
  credit: "Sale payment",
  debit: "Purchase",
  withdrawal: "Withdrawal",
};

export default async function WalletPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/wallet");

  const [balance, held, txns] = await Promise.all([
    walletBalanceCents(user.id),
    heldBalanceCents(user.id),
    prisma.walletTxn.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { order: { include: { listing: { select: { title: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-serif text-2xl font-bold text-stone-800">Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card bg-brand-800 p-5 text-white">
          <p className="text-xs uppercase tracking-widest text-brand-100/70">Available balance</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(balance)}</p>
          <WithdrawForm balanceCents={balance} />
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-widest text-stone-400">Held in escrow</p>
          <p className="mt-2 text-3xl font-bold text-stone-800">{formatMoney(held)}</p>
          <p className="mt-2 text-xs text-stone-500">
            Releases to your balance when buyers confirm delivery.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Transaction history
        </h2>
        {txns.length === 0 ? (
          <div className="card mt-2 p-8 text-center text-sm text-stone-500">
            No transactions yet — sell something!
          </div>
        ) : (
          <ul className="card mt-2 divide-y divide-stone-100">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-800">
                    {txnLabel[t.type] ?? t.type}
                    {t.order && <span className="text-stone-500"> — {t.order.listing.title}</span>}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatDateTime(t.createdAt)} ·{" "}
                    <span className={t.status === "held" ? "text-amber-600" : t.status === "pending" ? "text-amber-600" : "text-stone-400"}>
                      {t.status}
                    </span>
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap text-sm font-bold ${
                    t.type === "credit" ? "text-brand-700" : "text-stone-700"
                  }`}
                >
                  {t.type === "credit" ? "+" : "−"}
                  {formatMoney(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
