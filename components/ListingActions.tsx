"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

export default function ListingActions({
  listingId,
  priceCents,
  signedIn,
}: {
  listingId: string;
  priceCents: number;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <div className="mt-4 space-y-2">
        <Link href={`/login?callbackUrl=/listings/${listingId}`} className="btn-primary w-full">
          Log in to buy or make an offer
        </Link>
      </div>
    );
  }

  async function openConversation() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't open the conversation");
      return;
    }
    router.push(`/inbox/${data.id}`);
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(offerAmount);
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
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the offer");
      setBusy(false);
      return;
    }
    // Offer creation also ensures the conversation exists — jump into it.
    const convRes = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const conv = await convRes.json().catch(() => ({}));
    setBusy(false);
    if (convRes.ok) router.push(`/inbox/${conv.id}`);
  }

  return (
    <div className="mt-4 space-y-2">
      <Link href={`/checkout/${listingId}`} className="btn-primary w-full">
        Buy now · {formatMoney(priceCents)}
      </Link>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setOfferOpen((o) => !o)} className="btn-secondary" disabled={busy}>
          Make an offer
        </button>
        <button onClick={openConversation} className="btn-secondary" disabled={busy}>
          Message seller
        </button>
      </div>

      {offerOpen && (
        <form onSubmit={submitOffer} className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
            <input
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder={(priceCents / 100).toFixed(0)}
              inputMode="decimal"
              className="input !pl-7"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
