"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawForm({ balanceCents }: { balanceCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (balanceCents < 100) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1) {
      setError("Enter at least $1");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: Math.round(dollars * 100) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Withdrawal failed");
      return;
    }
    setOpen(false);
    setAmount("");
    router.refresh();
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-amber-300"
        >
          Withdraw
        </button>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <span className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={(balanceCents / 100).toFixed(2)}
              className="input !w-32 !pl-6"
              autoFocus
            />
          </span>
          <button type="submit" disabled={busy}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-amber-300 disabled:opacity-50">
            {busy ? "Sending…" : "Request"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-brand-100/80 hover:text-white">
            Cancel
          </button>
          {error && <p className="w-full text-sm text-amber-200">{error}</p>}
        </form>
      )}
      <p className="mt-2 text-[11px] text-brand-100/60">
        Demo: creates a pending withdrawal record — no real transfer.
      </p>
    </div>
  );
}
