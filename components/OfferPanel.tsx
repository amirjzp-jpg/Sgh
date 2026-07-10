"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

type Offer = {
  id: string;
  amountCents: number;
  status: string;
  fromSeller: boolean;
};

// Inline offer widget for the chat thread. Shows the negotiation state and
// lets whoever the pending offer is waiting on accept / decline / counter.
export default function OfferPanel({
  listingId,
  listingStatus,
  listingPriceCents,
  isBuyer,
  offers,
}: {
  listingId: string;
  listingStatus: string;
  listingPriceCents: number;
  isBuyer: boolean;
  offers: Offer[];
}) {
  const router = useRouter();
  const [counterOpen, setCounterOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = offers.find((o) => o.status === "pending");
  const accepted = offers.find((o) => o.status === "accepted");
  const latest = offers[offers.length - 1];

  async function act(offerId: string, action: "accept" | "decline" | "counter") {
    setError("");
    let counterAmountCents: number | undefined;
    if (action === "counter") {
      const dollars = Number(amount);
      if (!Number.isFinite(dollars) || dollars < 1) {
        setError("Enter a counter of at least $1");
        return;
      }
      counterAmountCents = Math.round(dollars * 100);
    }
    setBusy(true);
    const res = await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, counterAmountCents }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    setCounterOpen(false);
    setAmount("");
    router.refresh();
  }

  async function makeOffer(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1) {
      setError("Enter an offer of at least $1");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, amountCents: Math.round(dollars * 100) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the offer");
      return;
    }
    setCounterOpen(false);
    setAmount("");
    router.refresh();
  }

  if (listingStatus === "sold" && !accepted) return null;

  // Sold + accepted offer by this buyer → probably purchased already; keep quiet.
  if (listingStatus !== "active" && !accepted) return null;

  const waitingOnMe = pending && (pending.fromSeller ? isBuyer : !isBuyer);

  return (
    <div className="card mt-3 border-amber-200 bg-amber-50/60 p-3 text-sm">
      {accepted && listingStatus === "active" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            ✅ Offer accepted at{" "}
            <strong className="text-brand-800">{formatMoney(accepted.amountCents)}</strong>
          </p>
          {isBuyer ? (
            <Link href={`/checkout/${listingId}?offer=${accepted.id}`} className="btn-primary !py-1.5">
              Check out · {formatMoney(accepted.amountCents)}
            </Link>
          ) : (
            <span className="text-xs text-stone-500">Waiting for the buyer to check out</span>
          )}
        </div>
      ) : pending ? (
        <div>
          <p>
            💬 {pending.fromSeller ? "Seller countered" : isBuyer ? "You offered" : "Buyer offered"}{" "}
            <strong className="text-brand-800">{formatMoney(pending.amountCents)}</strong>
            <span className="ml-1 text-xs text-stone-500">
              (asking {formatMoney(listingPriceCents)})
            </span>
          </p>
          {waitingOnMe ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="btn-primary !py-1.5" disabled={busy} onClick={() => act(pending.id, "accept")}>
                Accept
              </button>
              <button className="btn-secondary !py-1.5" disabled={busy} onClick={() => act(pending.id, "decline")}>
                Decline
              </button>
              {!counterOpen ? (
                <button className="btn-secondary !py-1.5" disabled={busy} onClick={() => setCounterOpen(true)}>
                  Counter
                </button>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input value={amount} onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal" className="input !w-28 !pl-6 !py-1.5" autoFocus />
                  </span>
                  <button className="btn-primary !py-1.5" disabled={busy} onClick={() => act(pending.id, "counter")}>
                    Send
                  </button>
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-stone-500">Waiting for the other side to respond…</p>
          )}
        </div>
      ) : isBuyer ? (
        <form onSubmit={makeOffer} className="flex flex-wrap items-center gap-2">
          <span>
            {latest?.status === "declined" ? "Offer declined — try again?" : "Want to haggle?"}
          </span>
          <span className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
              placeholder={(listingPriceCents / 100).toFixed(0)} className="input !w-28 !pl-6 !py-1.5" />
          </span>
          <button type="submit" className="btn-primary !py-1.5" disabled={busy}>
            Make offer
          </button>
        </form>
      ) : (
        <p className="text-xs text-stone-500">No open offers on this listing.</p>
      )}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  );
}
